// inclass-backend/routes/attendance.js

const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const getLocation = require("../utils/geo"); // Utility to get location (needs fixing in geo.js)
const sendMail = require("../utils/mailer"); // Utility to send mail
const socketIO = require("../socket"); // Socket.io instance
const { verifyFace, isModelsLoaded } = require("../utils/faceRecognition");
const {
  verifyFingerprintAuthentication,
  ORIGIN,
  RP_ID,
} = require("../utils/fingerprintRecognition");
const { getAuthenticationChallenge, clearAuthenticationChallenge } = require("../middleware/biometricAuth");

// Optional: Use biometric middleware instead of manual verification
// Example: router.post("/mark", auth(["student"]), biometricAuth({ requireAny: true }), async (req, res) => {
//   Then use req.biometricResults instead of manual verification
// });

// @route   POST /api/attendance/mark
// @desc    Student submits code to mark attendance (with optional face/fingerprint verification)
// @access  Private (Student only)
router.post("/mark", auth(["student"]), async (req, res) => {
  const { code, faceImage, fingerprintAuthResponse, fingerprintChallenge } = req.body;
  const student_id = req.user.id;
  const ip = req.ip; // Get client IP address
  let location_text = "Unknown"; // Placeholder
  let faceVerified = false;
  let faceMatchScore = null;
  let fingerprintVerified = false;
  let fingerprintCredentialId = null;

  try {
    if (!code) {
      return res.status(400).json({ message: "Attendance code is required." });
    }

    // 1. Look up the session by code (only active sessions)
    const result = await pool.query(
      `SELECT id, expires_at, class_id FROM sessions 
             WHERE code = $1 AND is_active = TRUE 
             ORDER BY created_at DESC LIMIT 1`,
      [code]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ message: "Invalid or inactive code." });
    }

    const session = result.rows[0];

    // 2. Check Expiration Time (Use Case 04: Allow reporting expired codes)
    if (new Date(session.expires_at) < new Date()) {
      // Code expired - return error but allow student to report it
      return res.status(400).json({ 
        message: "Code expired.",
        expired: true,
        session_id: session.id,
        expires_at: session.expires_at
      });
    }

    // 2.5. Verify student is enrolled in the class
    const enrollmentCheck = await pool.query(
      "SELECT id FROM enrollments WHERE student_id = $1 AND class_id = $2",
      [student_id, session.class_id]
    );
    if (enrollmentCheck.rowCount === 0) {
      return res.status(403).json({ 
        message: "You are not enrolled in this class." 
      });
    }

    // 2.6. ENFORCE BIOMETRIC VERIFICATION - Check if both WebAuthn and Face are enrolled
    const webauthnCheck = await pool.query(
      "SELECT id FROM webauthn_credentials WHERE user_id = $1 AND is_active = TRUE LIMIT 1",
      [student_id]
    );
    const faceCheck = await pool.query(
      "SELECT id FROM biometric_face WHERE user_id = $1 AND is_active = TRUE LIMIT 1",
      [student_id]
    );

    const webauthnEnrolled = webauthnCheck.rowCount > 0;
    const faceEnrolled = faceCheck.rowCount > 0;

    if (!webauthnEnrolled || !faceEnrolled) {
      return res.status(403).json({
        message: "Biometric verification required to mark attendance. Please enroll both device biometric and face recognition.",
        webauthnEnrolled: webauthnEnrolled,
        faceEnrolled: faceEnrolled,
      });
    }

    // 3. Face Verification (REQUIRED)
    if (!faceImage && !req.body.faceEmbedding) {
      return res.status(400).json({
        message: "Face verification is required. Please provide face embedding.",
      });
    }

    try {
      // Get stored face embedding (from new biometric_face table)
      const faceEnrollment = await pool.query(
        "SELECT encrypted_embedding FROM biometric_face WHERE user_id = $1 AND is_active = TRUE",
        [student_id]
      );

      if (faceEnrollment.rowCount === 0) {
        return res.status(400).json({
          message: "Face enrollment not found. Please enroll your face first.",
        });
      }

      // Decrypt stored embedding
      const { decrypt } = require("../utils/crypto");
      const storedEmbedding = JSON.parse(decrypt(faceEnrollment.rows[0].encrypted_embedding));

      // If face embedding is provided directly, use it; otherwise extract from image
      let faceEmbedding = req.body.faceEmbedding;
      if (!faceEmbedding && faceImage) {
        // Legacy: if faceImage is provided, use old face recognition utility
        const verificationResult = await verifyFace(faceImage, storedEmbedding);
        if (verificationResult.error) {
          return res.status(400).json({
            message: `Face verification failed: ${verificationResult.error}`,
          });
        }
        faceVerified = verificationResult.match;
        faceMatchScore = verificationResult.score;
      } else if (faceEmbedding) {
        // New: use embedding directly with cosine similarity
        const cosineSimilarity = (vecA, vecB) => {
          if (vecA.length !== vecB.length) return 0;
          let dotProduct = 0;
          let normA = 0;
          let normB = 0;
          for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
          }
          const denominator = Math.sqrt(normA) * Math.sqrt(normB);
          return denominator === 0 ? 0 : dotProduct / denominator;
        };

        faceMatchScore = cosineSimilarity(faceEmbedding, storedEmbedding);
        const threshold = parseFloat(process.env.FACE_SIMILARITY_THRESHOLD || "0.62");
        faceVerified = faceMatchScore >= threshold;
      } else {
        return res.status(400).json({
          message: "Face verification data is required.",
        });
      }

      // ENFORCE: Face verification must pass
      if (!faceVerified) {
        return res.status(403).json({
          message: "Face verification failed. Please try again with better lighting and a clear view of your face.",
          score: faceMatchScore,
        });
      }
    } catch (faceError) {
      console.error("Face verification error:", faceError);
      return res.status(500).json({ error: "Face verification error." });
    }

    // 4. WebAuthn/Fingerprint Verification (REQUIRED)
    try {
      // Get stored challenge using middleware helper
      const storedChallenge = getAuthenticationChallenge(student_id);
      if (!storedChallenge || storedChallenge.challenge !== fingerprintChallenge) {
        return res.status(400).json({
          message: "Invalid or expired fingerprint verification challenge.",
        });
      }

      // Get credential from database (use new webauthn_credentials table)
      const credentialId = fingerprintAuthResponse.id;
      const credentialResult = await pool.query(
        "SELECT credential_id, public_key, counter FROM webauthn_credentials WHERE credential_id = $1 AND user_id = $2 AND is_active = TRUE",
        [credentialId, student_id]
      );

        if (credentialResult.rowCount > 0) {
          const credential = credentialResult.rows[0];

          // Verify fingerprint authentication
          const verification = await verifyFingerprintAuthentication(
            fingerprintAuthResponse,
            fingerprintChallenge,
            credential,
            credential.counter
          );

          if (verification.verified) {
            fingerprintVerified = true;
            fingerprintCredentialId = credentialId;

            // Update counter and last used timestamp
            await pool.query(
              "UPDATE fingerprint_data SET counter = $1, last_used_at = CURRENT_TIMESTAMP WHERE credential_id = $2",
              [verification.newCounter, credentialId]
            );

            // Clean up challenge using middleware helper
            clearAuthenticationChallenge(student_id);
          } else {
            return res.status(400).json({
              message: verification.error || "Fingerprint verification failed.",
            });
          }
      } else {
        return res.status(400).json({
          message: "Fingerprint credential not found. Please enroll your fingerprint first.",
        });
      }
    } catch (fingerprintError) {
      console.error("Fingerprint verification error:", fingerprintError);
      return res.status(500).json({
        error: "Fingerprint verification error.",
      });
    }

    // 4. Attempt to get geo-location (This requires a working geo.js)
    // location_text = await getLocation(ip); // Using mock IP for now, actual IP won't work in development

    // 5. Get student info for real-time notification
    const studentInfo = await pool.query(
      "SELECT id, name, roll_no FROM users WHERE id = $1",
      [student_id]
    );
    const student = studentInfo.rows[0];

    // 6. Record Attendance (with biometric verification data if available)
    const attendanceResult = await pool.query(
      `INSERT INTO attendance (student_id, session_id, ip_address, location, status, face_verified, face_match_score, fingerprint_verified, fingerprint_credential_id) 
             VALUES ($1, $2, $3, $4, 'Present', $5, $6, $7, $8)
             RETURNING id, created_at`,
      [student_id, session.id, ip, location_text, faceVerified, faceMatchScore, fingerprintVerified, fingerprintCredentialId]
    );
    const attendanceRecord = attendanceResult.rows[0];

    // 6. Emit real-time Socket.io event to faculty monitoring this session
    try {
      const io = socketIO.getIO();
      if (io) {
        // Emit to session-specific room
        io.to(`session_${session.id}`).emit("attendanceMarked", {
          attendanceId: attendanceRecord.id,
          studentId: student.id,
          studentName: student.name,
          studentRollNo: student.roll_no,
          sessionId: session.id,
          classId: session.class_id,
          timestamp: attendanceRecord.created_at,
          status: "Present",
        });

        // Also emit to class room for broader monitoring
        io.to(`class_${session.class_id}`).emit("attendanceMarked", {
          attendanceId: attendanceRecord.id,
          studentId: student.id,
          studentName: student.name,
          studentRollNo: student.roll_no,
          sessionId: session.id,
          classId: session.class_id,
          timestamp: attendanceRecord.created_at,
          status: "Present",
        });

        console.log(`📡 Emitted attendance event for student ${student.name} (${student.roll_no}) in session ${session.id}`);
      }
    } catch (socketError) {
      // Don't fail the request if Socket.io fails
      console.error("Socket.io emission error:", socketError);
    }

    // 7. Optional: Notify faculty (using mock email)
    sendMail(
      "faculty@college.com",
      "Attendance Marked",
      `Student ${student.name} (${student.roll_no}) marked attendance for session ${session.id}.`
    );

    res.json({ 
      message: "Attendance marked successfully.",
      attendanceId: attendanceRecord.id,
      timestamp: attendanceRecord.created_at,
      faceVerified: faceVerified,
      faceMatchScore: faceMatchScore,
      fingerprintVerified: fingerprintVerified,
      fingerprintCredentialId: fingerprintCredentialId,
    });
  } catch (err) {
    if (err.code === "23505") {
      // Unique constraint violation (Student already marked attendance for this session)
      return res
        .status(400)
        .json({
          message: "You have already marked attendance for this session.",
        });
    }
    console.error("Attendance marking error:", err);
    res.status(500).json({ error: "Server error during attendance marking." });
  }
});

module.exports = router;
