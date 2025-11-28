// inclass-backend/routes/biometrics.js
// Complete biometric onboarding and verification routes

const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const { isoBase64URL, isoUint8Array } = require("@simplewebauthn/server/helpers");
const { encrypt, decrypt } = require("../utils/crypto");
const {
  setAuthenticationChallenge,
  getAuthenticationChallenge,
  clearAuthenticationChallenge,
} = require("../middleware/biometricAuth");

// WebAuthn configuration
const RP_ID = process.env.WEBAUTHN_RP_ID || "localhost";
const RP_NAME = process.env.WEBAUTHN_RP_NAME || "InClass Attendance System";
const ORIGIN = process.env.WEBAUTHN_ORIGIN || (process.env.FRONTEND_URL || "http://localhost:5173");

// Store registration challenges temporarily (in production, use Redis)
const registrationChallenges = new Map();

// Clean up old challenges every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of registrationChallenges.entries()) {
    if (now - value.timestamp > 300000) {
      registrationChallenges.delete(key);
    }
  }
}, 300000);

// ============================================
// WEBAUTHN ROUTES
// ============================================

// @route   POST /api/biometrics/webauthn/register/options
// @desc    Generate WebAuthn registration options
// @access  Public (during onboarding) or Private
router.post("/webauthn/register/options", async (req, res) => {
  try {
    const { userId } = req.body;
    const authUser = req.user; // From auth middleware if present

    // Get userId from body or auth token
    const targetUserId = userId || (authUser ? authUser.id : null);
    if (!targetUserId) {
      return res.status(400).json({ 
        success: false,
        message: "User ID is required. Please provide userId in request body or authenticate with a valid token." 
      });
    }

    console.log(`[WebAuthn] Generating registration options for userId: ${targetUserId}`);

    // Get user info
    let userResult;
    try {
      userResult = await pool.query(
        "SELECT name, email FROM users WHERE id = $1",
        [targetUserId]
      );
    } catch (dbError) {
      console.error("[WebAuthn] Database error fetching user:", dbError);
      return res.status(500).json({ 
        success: false,
        message: `Database error: ${dbError.message}. Check if users table exists.` 
      });
    }

    if (userResult.rowCount === 0) {
      return res.status(404).json({ 
        success: false,
        message: `User not found with ID: ${targetUserId}` 
      });
    }

    const user = userResult.rows[0];

    // Get existing credentials for this user (handle case where table doesn't exist yet)
    let existingCredentials = { rows: [] };
    try {
      const credResult = await pool.query(
        "SELECT credential_id FROM webauthn_credentials WHERE user_id = $1 AND is_active = TRUE",
        [targetUserId]
      );
      existingCredentials = credResult;
    } catch (dbError) {
      // Table might not exist - log but continue (will create on first enrollment)
      console.warn("[WebAuthn] Could not fetch existing credentials (table may not exist):", dbError.message);
      existingCredentials = { rows: [] };
    }

    // Generate registration options
    let options;
    try {
      options = generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: RP_ID,
        userID: isoUint8Array.fromUTF8String(targetUserId.toString()),
        userName: user.email || user.name || `user_${targetUserId}`,
        userDisplayName: user.name || `User ${targetUserId}`,
        timeout: 60000,
        attestationType: "none",
        excludeCredentials: existingCredentials.rows.map((cred) => ({
          id: isoBase64URL.toBuffer(cred.credential_id),
          type: "public-key",
          transports: ["internal"],
        })),
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          requireResidentKey: false,
        },
        supportedAlgorithmIDs: [-7, -257],
      });
    } catch (genError) {
      console.error("[WebAuthn] Error generating registration options:", genError);
      console.error("[WebAuthn] Stack trace:", genError.stack);
      return res.status(500).json({ 
        success: false,
        message: `Failed to generate registration options: ${genError.message}. Check RP_ID (${RP_ID}) and ORIGIN (${ORIGIN}) configuration.` 
      });
    }

    // Store challenge temporarily (in-memory cache)
    const challengeString = typeof options.challenge === 'string' 
      ? options.challenge 
      : isoBase64URL.fromBuffer(options.challenge);
    
    registrationChallenges.set(targetUserId.toString(), {
      challenge: challengeString,
      timestamp: Date.now(),
    });

    console.log(`[WebAuthn] Challenge stored for userId: ${targetUserId}`);

    // Serialize options for JSON response (convert ArrayBuffers to base64url strings)
    const serializedOptions = {
      challenge: challengeString,
      rp: {
        id: RP_ID,
        name: RP_NAME,
      },
      user: {
        id: isoBase64URL.fromBuffer(options.user.id),
        name: options.user.name,
        displayName: options.user.displayName,
      },
      pubKeyCredParams: options.pubKeyCredParams || [{ alg: -7, type: "public-key" }],
      authenticatorSelection: options.authenticatorSelection || {
        authenticatorAttachment: "platform",
        userVerification: "required",
      },
      timeout: options.timeout || 60000,
      attestation: options.attestation || "none",
    };

    if (options.excludeCredentials && options.excludeCredentials.length > 0) {
      serializedOptions.excludeCredentials = options.excludeCredentials.map((cred) => ({
        id: isoBase64URL.fromBuffer(cred.id),
        type: cred.type,
        transports: cred.transports || ["internal"],
      }));
    }

    console.log(`[WebAuthn] Returning registration options for userId: ${targetUserId}`);
    res.json(serializedOptions);
  } catch (err) {
    console.error("[WebAuthn] Registration options error - Full stack trace:");
    console.error(err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      success: false,
      error: "Server error generating registration options.",
      message: err.message || "Unknown error occurred",
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// @route   POST /api/biometrics/webauthn/register/complete
// @desc    Complete WebAuthn registration
// @access  Public (during onboarding) or Private
router.post("/webauthn/register/complete", async (req, res) => {
  try {
    const { userId, registrationResponse, deviceName } = req.body;
    const authUser = req.user;

    const targetUserId = userId || (authUser ? authUser.id : null);
    if (!targetUserId) {
      return res.status(400).json({ 
        success: false,
        message: "User ID is required." 
      });
    }

    if (!registrationResponse) {
      return res.status(400).json({ 
        success: false,
        message: "Registration response is required." 
      });
    }

    console.log(`[WebAuthn] Completing registration for userId: ${targetUserId}`);

    // Get stored challenge
    const storedChallenge = registrationChallenges.get(targetUserId.toString());
    if (!storedChallenge) {
      return res.status(400).json({
        success: false,
        message: "Registration session expired. Please start a new enrollment.",
      });
    }

    // Convert base64url strings from client to ArrayBuffers for verification
    // Client sends: { id, rawId (base64url), response: { clientDataJSON (base64url), attestationObject (base64url) } }
    const response = {
      id: registrationResponse.id,
      rawId: typeof registrationResponse.rawId === 'string' 
        ? isoBase64URL.toBuffer(registrationResponse.rawId)
        : registrationResponse.rawId,
      response: {
        clientDataJSON: typeof registrationResponse.response?.clientDataJSON === 'string'
          ? isoBase64URL.toBuffer(registrationResponse.response.clientDataJSON)
          : registrationResponse.response?.clientDataJSON,
        attestationObject: typeof registrationResponse.response?.attestationObject === 'string'
          ? isoBase64URL.toBuffer(registrationResponse.response.attestationObject)
          : registrationResponse.response?.attestationObject,
      },
      type: registrationResponse.type || "public-key",
    };

    console.log(`[WebAuthn] Verifying registration response...`);

    // Verify registration response
    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: response,
        expectedChallenge: storedChallenge.challenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        requireUserVerification: true,
      });
    } catch (verifyError) {
      console.error("[WebAuthn] Verification error:", verifyError);
      console.error("[WebAuthn] Verification error stack:", verifyError.stack);
      return res.status(400).json({
        success: false,
        message: `Verification failed: ${verifyError.message}. Check ORIGIN (${ORIGIN}) and RP_ID (${RP_ID}) configuration.`,
      });
    }

    if (!verification.verified || !verification.registrationInfo) {
      console.error("[WebAuthn] Verification failed - not verified or missing registration info");
      return res.status(400).json({
        success: false,
        message: "Registration verification failed. Please try again.",
      });
    }

    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo;

    console.log(`[WebAuthn] Verification successful, storing credential...`);

    // Store credential in database
    try {
      await pool.query(
        `INSERT INTO webauthn_credentials (user_id, credential_id, public_key, device_name, counter, is_active)
         VALUES ($1, $2, $3, $4, $5, TRUE)`,
        [
          targetUserId,
          isoBase64URL.fromBuffer(credentialID),
          isoBase64URL.fromBuffer(credentialPublicKey),
          deviceName || "Unknown Device",
          counter || 0,
        ]
      );
    } catch (dbError) {
      console.error("[WebAuthn] Database error storing credential:", dbError);
      if (dbError.code === "23505") {
        return res.status(400).json({ 
          success: false,
          message: "This biometric is already enrolled." 
        });
      }
      // Check if table doesn't exist
      if (dbError.code === "42P01") {
        return res.status(500).json({ 
          success: false,
          message: `Database table 'webauthn_credentials' does not exist. Please run the schema.sql migration.` 
        });
      }
      throw dbError;
    }

    // Clean up challenge
    registrationChallenges.delete(targetUserId.toString());

    console.log(`[WebAuthn] Registration completed successfully for userId: ${targetUserId}`);

    res.status(201).json({
      success: true,
      message: "Device biometric enrolled successfully.",
      credentialId: isoBase64URL.fromBuffer(credentialID),
    });
  } catch (err) {
    console.error("[WebAuthn] Registration complete error - Full stack trace:");
    console.error(err);
    console.error("Error stack:", err.stack);
    res.status(500).json({ 
      success: false,
      error: "Server error completing registration.",
      message: err.message || "Unknown error occurred",
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// @route   POST /api/biometrics/webauthn/auth/options
// @desc    Generate WebAuthn authentication options
// @access  Public (during onboarding) or Private
router.post("/webauthn/auth/options", async (req, res) => {
  try {
    const { userId } = req.body;
    const authUser = req.user;

    const targetUserId = userId || (authUser ? authUser.id : null);
    if (!targetUserId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Get user's enrolled credentials
    const credentials = await pool.query(
      "SELECT credential_id FROM webauthn_credentials WHERE user_id = $1 AND is_active = TRUE",
      [targetUserId]
    );

    if (credentials.rowCount === 0) {
      return res.status(404).json({
        message: "No biometric enrollment found. Please enroll your biometric first.",
        enrolled: false,
      });
    }

    // Generate authentication options
    const options = generateAuthenticationOptions({
      rpID: RP_ID,
      allowCredentials: credentials.rows.map((cred) => ({
        id: isoBase64URL.toBuffer(cred.credential_id),
        type: "public-key",
        transports: ["internal"],
      })),
      userVerification: "required",
      timeout: 60000,
    });

    // Store challenge using middleware helper
    setAuthenticationChallenge(targetUserId, options.challenge);

    // Serialize for JSON
    const serializedOptions = {
      challenge: options.challenge,
      allowCredentials: options.allowCredentials.map((cred) => ({
        id: isoBase64URL.fromBuffer(cred.id),
        type: cred.type,
        transports: cred.transports,
      })),
      timeout: options.timeout,
      userVerification: options.userVerification,
    };

    res.json(serializedOptions);
  } catch (err) {
    console.error("WebAuthn authentication options error:", err);
    res.status(500).json({ error: "Server error generating authentication options." });
  }
});

// @route   POST /api/biometrics/webauthn/auth/complete
// @desc    Complete WebAuthn authentication
// @access  Public (during onboarding) or Private
router.post("/webauthn/auth/complete", async (req, res) => {
  try {
    const { userId, authenticationResponse } = req.body;
    const authUser = req.user;

    const targetUserId = userId || (authUser ? authUser.id : null);
    if (!targetUserId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    if (!authenticationResponse) {
      return res.status(400).json({ message: "Authentication response is required." });
    }

    // Get stored challenge
    const storedChallenge = getAuthenticationChallenge(targetUserId);
    if (!storedChallenge) {
      return res.status(400).json({
        message: "Authentication session expired. Please start a new verification.",
      });
    }

    // Get credential from database
    const credentialId = authenticationResponse.id;
    const credentialResult = await pool.query(
      "SELECT credential_id, public_key, counter FROM webauthn_credentials WHERE credential_id = $1 AND user_id = $2 AND is_active = TRUE",
      [credentialId, targetUserId]
    );

    if (credentialResult.rowCount === 0) {
      return res.status(404).json({ message: "Credential not found." });
    }

    const credential = credentialResult.rows[0];

    // Convert authentication response to proper format
    const response = {
      id: authenticationResponse.id,
      rawId: isoBase64URL.toBuffer(authenticationResponse.id),
      response: {
        clientDataJSON: isoBase64URL.toBuffer(authenticationResponse.response.clientDataJSON),
        authenticatorData: isoBase64URL.toBuffer(authenticationResponse.response.authenticatorData),
        signature: isoBase64URL.toBuffer(authenticationResponse.response.signature),
        userHandle: authenticationResponse.response.userHandle
          ? isoBase64URL.toBuffer(authenticationResponse.response.userHandle)
          : null,
      },
      type: authenticationResponse.type || "public-key",
    };

    // Verify authentication response
    const verification = await verifyAuthenticationResponse({
      response: response,
      expectedChallenge: storedChallenge.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: isoBase64URL.toBuffer(credential.credential_id),
        publicKey: isoBase64URL.toBuffer(credential.public_key),
        counter: credential.counter,
      },
      requireUserVerification: true,
    });

    if (!verification.verified) {
      return res.status(400).json({
        message: "Biometric verification failed.",
        verified: false,
      });
    }

    // Update counter and last used timestamp
    await pool.query(
      "UPDATE webauthn_credentials SET counter = $1, last_used_at = CURRENT_TIMESTAMP WHERE credential_id = $2",
      [verification.authenticationInfo.newCounter, credentialId]
    );

    // Clean up challenge
    clearAuthenticationChallenge(targetUserId);

    res.json({
      verified: true,
      message: "Biometric verified successfully.",
      credentialId: credentialId,
    });
  } catch (err) {
    console.error("WebAuthn authentication complete error:", err);
    res.status(500).json({ error: "Server error completing authentication." });
  }
});

// ============================================
// FACE RECOGNITION ROUTES
// ============================================

// @route   POST /api/biometrics/face/enroll
// @desc    Enroll user's face (accept embedding array)
// @access  Public (during onboarding) or Private
router.post("/face/enroll", async (req, res) => {
  try {
    const { userId, embedding } = req.body;
    const authUser = req.user;

    const targetUserId = userId || (authUser ? authUser.id : null);
    if (!targetUserId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      return res.status(400).json({
        message: "Face embedding array is required.",
      });
    }

    // Encrypt embedding before storing
    const encryptedEmbedding = encrypt(JSON.stringify(embedding));

    // Check if user already has a face enrolled
    const existingCheck = await pool.query(
      "SELECT id FROM biometric_face WHERE user_id = $1 AND is_active = TRUE",
      [targetUserId]
    );

    if (existingCheck.rowCount > 0) {
      // Update existing enrollment
      await pool.query(
        `UPDATE biometric_face 
         SET encrypted_embedding = $1, enrolled_at = CURRENT_TIMESTAMP, is_active = TRUE
         WHERE user_id = $2`,
        [encryptedEmbedding, targetUserId]
      );

      return res.json({
        success: true,
        message: "Face enrollment updated successfully.",
      });
    } else {
      // Create new enrollment
      await pool.query(
        `INSERT INTO biometric_face (user_id, encrypted_embedding, is_active)
         VALUES ($1, $2, TRUE)`,
        [targetUserId, encryptedEmbedding]
      );

      return res.status(201).json({
        success: true,
        message: "Face enrolled successfully.",
      });
    }
  } catch (err) {
    console.error("Face enrollment error:", err);
    res.status(500).json({ error: "Server error during face enrollment." });
  }
});

// @route   POST /api/biometrics/face/verify
// @desc    Verify user's face against stored enrollment
// @access  Public (during onboarding) or Private
router.post("/face/verify", async (req, res) => {
  try {
    const { userId, embedding } = req.body;
    const authUser = req.user;

    const targetUserId = userId || (authUser ? authUser.id : null);
    if (!targetUserId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
      return res.status(400).json({ message: "Face embedding array is required." });
    }

    // Get stored face embedding
    const storedResult = await pool.query(
      "SELECT encrypted_embedding FROM biometric_face WHERE user_id = $1 AND is_active = TRUE",
      [targetUserId]
    );

    if (storedResult.rowCount === 0) {
      return res.status(404).json({
        message: "No face enrollment found. Please enroll your face first.",
        enrolled: false,
      });
    }

    // Decrypt stored embedding
    const decryptedEmbedding = JSON.parse(decrypt(storedResult.rows[0].encrypted_embedding));

    // Calculate cosine similarity
    const similarity = cosineSimilarity(embedding, decryptedEmbedding);
    const threshold = parseFloat(process.env.FACE_SIMILARITY_THRESHOLD || "0.62");
    const match = similarity >= threshold;

    res.json({
      verified: match,
      score: similarity,
      threshold: threshold,
      message: match
        ? "Face verified successfully."
        : "Face verification failed. Please try again with better lighting and a clear view of your face.",
    });
  } catch (err) {
    console.error("Face verification error:", err);
    res.status(500).json({ error: "Server error during face verification." });
  }
});

// Helper function to calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

// ============================================
// CONSENT ROUTES
// ============================================

// @route   POST /api/biometrics/consent
// @desc    Record biometric consent
// @access  Public (during onboarding) or Private
router.post("/consent", async (req, res) => {
  try {
    const { userId, method, ip, userAgent } = req.body;
    const authUser = req.user;

    const targetUserId = userId || (authUser ? authUser.id : null);
    if (!targetUserId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Check if consent already exists
    const existingCheck = await pool.query(
      "SELECT id FROM biometric_consent WHERE user_id = $1",
      [targetUserId]
    );

    if (existingCheck.rowCount > 0) {
      // Update existing consent
      await pool.query(
        `UPDATE biometric_consent 
         SET method = $1, ip_address = $2, user_agent = $3, consented_at = CURRENT_TIMESTAMP, is_active = TRUE
         WHERE user_id = $4`,
        [method || "both", ip || req.ip, userAgent || req.get("user-agent"), targetUserId]
      );
    } else {
      // Create new consent
      await pool.query(
        `INSERT INTO biometric_consent (user_id, method, ip_address, user_agent, is_active)
         VALUES ($1, $2, $3, $4, TRUE)`,
        [targetUserId, method || "both", ip || req.ip, userAgent || req.get("user-agent")]
      );
    }

    res.json({
      success: true,
      message: "Biometric consent recorded successfully.",
    });
  } catch (err) {
    console.error("Consent recording error:", err);
    res.status(500).json({ error: "Server error recording consent." });
  }
});

// ============================================
// STATUS ROUTES
// ============================================

// @route   GET /api/biometrics/status
// @desc    Get user's biometric enrollment status
// @access  Public (during onboarding) or Private
router.get("/status", async (req, res) => {
  try {
    const { userId } = req.query;
    const authUser = req.user;

    const targetUserId = userId || (authUser ? authUser.id : null);
    if (!targetUserId) {
      return res.status(400).json({ message: "User ID is required." });
    }

    // Check WebAuthn enrollment
    const webauthnCheck = await pool.query(
      "SELECT id FROM webauthn_credentials WHERE user_id = $1 AND is_active = TRUE LIMIT 1",
      [targetUserId]
    );

    // Check face enrollment
    const faceCheck = await pool.query(
      "SELECT id FROM biometric_face WHERE user_id = $1 AND is_active = TRUE LIMIT 1",
      [targetUserId]
    );

    // Check consent
    const consentCheck = await pool.query(
      "SELECT id, method, consented_at FROM biometric_consent WHERE user_id = $1 AND is_active = TRUE LIMIT 1",
      [targetUserId]
    );

    res.json({
      webauthn: webauthnCheck.rowCount > 0,
      face: faceCheck.rowCount > 0,
      consent: consentCheck.rowCount > 0,
      consentMethod: consentCheck.rowCount > 0 ? consentCheck.rows[0].method : null,
      consentedAt: consentCheck.rowCount > 0 ? consentCheck.rows[0].consented_at : null,
    });
  } catch (err) {
    console.error("Biometric status error:", err);
    res.status(500).json({ error: "Server error checking biometric status." });
  }
});

module.exports = router;

