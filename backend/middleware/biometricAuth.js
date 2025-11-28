// inclass-backend/middleware/biometricAuth.js
// Biometric authentication middleware for attendance marking

const pool = require("../db");
const { verifyFace, isModelsLoaded } = require("../utils/faceRecognition");
const {
  verifyFingerprintAuthentication,
  ORIGIN,
  RP_ID,
} = require("../utils/fingerprintRecognition");

// Store authentication challenges (in production, use Redis)
const authenticationChallenges = new Map();

/**
 * Middleware to validate biometric authentication during attendance marking
 * @param {Object} options - Configuration options
 * @param {boolean} options.requireFace - Require face verification (default: false)
 * @param {boolean} options.requireFingerprint - Require fingerprint verification (default: false)
 * @param {boolean} options.requireAny - Require at least one biometric (default: false)
 * @param {boolean} options.allowNone - Allow attendance without biometrics (default: true)
 * @returns {Function} Express middleware function
 */
function biometricAuth(options = {}) {
  const {
    requireFace = false,
    requireFingerprint = false,
    requireAny = false,
    allowNone = true,
  } = options;

  return async (req, res, next) => {
    const userId = req.user.id;
    const { faceImage, fingerprintAuthResponse, fingerprintChallenge } = req.body;

    const biometricResults = {
      faceVerified: false,
      faceMatchScore: null,
      faceError: null,
      fingerprintVerified: false,
      fingerprintCredentialId: null,
      fingerprintError: null,
    };

    // Face Verification
    if (faceImage || requireFace) {
      try {
        if (!faceImage && requireFace) {
          return res.status(400).json({
            message: "Face image is required for attendance marking.",
            code: "FACE_REQUIRED",
          });
        }

        const faceEnrollment = await pool.query(
          "SELECT face_descriptor FROM face_encodings WHERE user_id = $1 AND is_active = TRUE",
          [userId]
        );

        if (faceEnrollment.rowCount === 0) {
          if (requireFace) {
            return res.status(400).json({
              message: "Face enrollment required. Please enroll your face first at /api/face/enroll",
              code: "FACE_NOT_ENROLLED",
            });
          }
          biometricResults.faceError = "Face not enrolled";
        } else {
          const verificationResult = await verifyFace(
            faceImage,
            faceEnrollment.rows[0].face_descriptor
          );

          if (verificationResult.error) {
            if (requireFace) {
              return res.status(400).json({
                message: `Face verification failed: ${verificationResult.error}`,
                code: "FACE_VERIFICATION_FAILED",
              });
            }
            biometricResults.faceError = verificationResult.error;
          } else {
            biometricResults.faceVerified = verificationResult.match;
            biometricResults.faceMatchScore = verificationResult.score;

            if (requireFace && !biometricResults.faceVerified) {
              return res.status(403).json({
                message: "Face verification failed. Please try again with better lighting.",
                code: "FACE_VERIFICATION_FAILED",
                score: biometricResults.faceMatchScore,
              });
            }
          }
        }
      } catch (faceError) {
        console.error("Face verification error in middleware:", faceError);
        if (requireFace) {
          return res.status(500).json({
            message: "Face verification error.",
            code: "FACE_VERIFICATION_ERROR",
          });
        }
        biometricResults.faceError = faceError.message;
      }
    }

    // Fingerprint Verification
    if (fingerprintAuthResponse || requireFingerprint) {
      try {
        if ((!fingerprintAuthResponse || !fingerprintChallenge) && requireFingerprint) {
          return res.status(400).json({
            message: "Fingerprint authentication is required for attendance marking.",
            code: "FINGERPRINT_REQUIRED",
          });
        }

        if (fingerprintAuthResponse && fingerprintChallenge) {
          // Get stored challenge
          const storedChallenge = authenticationChallenges.get(userId.toString());
          if (!storedChallenge || storedChallenge.challenge !== fingerprintChallenge) {
            if (requireFingerprint) {
              return res.status(400).json({
                message: "Invalid or expired fingerprint verification challenge.",
                code: "FINGERPRINT_CHALLENGE_INVALID",
              });
            }
            biometricResults.fingerprintError = "Invalid challenge";
          } else {
            // Get credential from database
            const credentialId = fingerprintAuthResponse.id;
            const credentialResult = await pool.query(
              "SELECT credential_id, public_key, counter FROM fingerprint_data WHERE credential_id = $1 AND user_id = $2 AND is_active = TRUE",
              [credentialId, userId]
            );

            if (credentialResult.rowCount === 0) {
              if (requireFingerprint) {
                return res.status(400).json({
                  message: "Fingerprint enrollment required. Please enroll your fingerprint first.",
                  code: "FINGERPRINT_NOT_ENROLLED",
                });
              }
              biometricResults.fingerprintError = "Fingerprint not enrolled";
            } else {
              const credential = credentialResult.rows[0];

              // Verify fingerprint authentication
              const verification = await verifyFingerprintAuthentication(
                fingerprintAuthResponse,
                fingerprintChallenge,
                credential,
                credential.counter
              );

              if (verification.verified) {
                biometricResults.fingerprintVerified = true;
                biometricResults.fingerprintCredentialId = credentialId;

                // Update counter and last used timestamp
                await pool.query(
                  "UPDATE fingerprint_data SET counter = $1, last_used_at = CURRENT_TIMESTAMP WHERE credential_id = $2",
                  [verification.newCounter, credentialId]
                );

                // Clean up challenge
                authenticationChallenges.delete(userId.toString());
              } else {
                if (requireFingerprint) {
                  return res.status(400).json({
                    message: verification.error || "Fingerprint verification failed.",
                    code: "FINGERPRINT_VERIFICATION_FAILED",
                  });
                }
                biometricResults.fingerprintError = verification.error;
              }
            }
          }
        }
      } catch (fingerprintError) {
        console.error("Fingerprint verification error in middleware:", fingerprintError);
        if (requireFingerprint) {
          return res.status(500).json({
            message: "Fingerprint verification error.",
            code: "FINGERPRINT_VERIFICATION_ERROR",
          });
        }
        biometricResults.fingerprintError = fingerprintError.message;
      }
    }

    // Check if any biometric is required
    if (requireAny && !biometricResults.faceVerified && !biometricResults.fingerprintVerified) {
      return res.status(403).json({
        message: "At least one biometric verification is required (face or fingerprint).",
        code: "BIOMETRIC_REQUIRED",
      });
    }

    // Check if none are allowed
    if (!allowNone && !biometricResults.faceVerified && !biometricResults.fingerprintVerified) {
      return res.status(403).json({
        message: "Biometric verification is required for attendance marking.",
        code: "BIOMETRIC_REQUIRED",
      });
    }

    // Attach biometric results to request object
    req.biometricResults = biometricResults;
    next();
  };
}

/**
 * Helper function to set authentication challenge (used by fingerprint routes)
 */
function setAuthenticationChallenge(userId, challenge) {
  authenticationChallenges.set(userId.toString(), {
    challenge,
    timestamp: Date.now(),
  });
}

/**
 * Helper function to get authentication challenge
 */
function getAuthenticationChallenge(userId) {
  return authenticationChallenges.get(userId.toString());
}

/**
 * Helper function to clear authentication challenge
 */
function clearAuthenticationChallenge(userId) {
  authenticationChallenges.delete(userId.toString());
}

// Clean up old challenges every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of authenticationChallenges.entries()) {
    if (now - value.timestamp > 300000) {
      // 5 minutes
      authenticationChallenges.delete(key);
    }
  }
}, 300000);

module.exports = {
  biometricAuth,
  setAuthenticationChallenge,
  getAuthenticationChallenge,
  clearAuthenticationChallenge,
};

