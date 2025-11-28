// inclass-backend/routes/faceRecognition.js
// Face recognition enrollment and verification routes

const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");

// Safely require face recognition utilities (may not be available)
let faceRecognitionUtils = null;
try {
  faceRecognitionUtils = require("../utils/faceRecognition");
} catch (error) {
  console.warn("⚠️  Face recognition utilities not available. Face recognition routes will return errors.");
}

const {
  extractFaceDescriptor,
  verifyFace,
  detectFaceSimple,
  isModelsLoaded,
} = faceRecognitionUtils || {
  extractFaceDescriptor: async () => { throw new Error("Face recognition not available"); },
  verifyFace: async () => ({ match: false, error: "Face recognition not available" }),
  detectFaceSimple: async () => false,
  isModelsLoaded: () => false,
};

// @route   POST /api/face/enroll
// @desc    Enroll user's face (store face descriptor)
// @access  Private (or Public during registration with userId)
const upload = require("../middleware/upload");

router.post("/enroll", upload.single("faceImage"), async (req, res) => {
  // Allow enrollment during registration (userId in body) or after login (from auth token)
  let userId;
  if (req.user) {
    userId = req.user.id;
  } else if (req.body.userId) {
    userId = req.body.userId;
  } else {
    return res.status(401).json({ message: "User ID is required." });
  }

  // Get image from file upload or base64
  let imageData = null;
  if (req.file) {
    // File was uploaded via multer
    const fs = require("fs");
    const path = require("path");
    const imagePath = path.join(__dirname, "../uploads", req.file.filename);
    imageData = fs.readFileSync(imagePath);
  } else if (req.body.image) {
    // Base64 encoded image (legacy support)
    imageData = Buffer.from(req.body.image, "base64");
  }

  try {
    if (!imageData) {
      return res.status(400).json({ message: "Image is required." });
    }

    // Convert image data to base64 for face recognition utilities
    const imageBase64 = imageData.toString("base64");

    // Check if user already has a face enrolled
    const existingCheck = await pool.query(
      "SELECT id FROM face_encodings WHERE user_id = $1 AND is_active = TRUE",
      [userId]
    );

    let faceDescriptor;
    let enrollmentMethod = "full";

    // Try to extract face descriptor
    if (isModelsLoaded()) {
      try {
        faceDescriptor = await extractFaceDescriptor(imageBase64);
        if (!faceDescriptor) {
          return res.status(400).json({
            message: "No face detected in the image. Please provide a clear image with your face visible.",
          });
        }
      } catch (faceError) {
        return res.status(400).json({
          message: faceError.message || "Failed to process face image.",
        });
      }
    } else {
      // Fallback: simple face detection
      const hasFace = await detectFaceSimple(imageBase64);
      if (!hasFace) {
        return res.status(400).json({
          message: "Could not detect a face in the image. Please ensure face recognition models are loaded.",
        });
      }
      // Store a placeholder descriptor (in production, you'd want proper models)
      faceDescriptor = new Float32Array(128).fill(0); // Placeholder
      enrollmentMethod = "simple";
    }

    // Convert Float32Array to regular array for JSON storage
    const descriptorArray = Array.from(faceDescriptor);

    if (existingCheck.rowCount > 0) {
      // Update existing enrollment
      await pool.query(
        `UPDATE face_encodings 
         SET face_descriptor = $1, enrolled_at = CURRENT_TIMESTAMP, is_active = TRUE
         WHERE user_id = $2`,
        [JSON.stringify(descriptorArray), userId]
      );

      return res.json({
        message: "Face enrollment updated successfully.",
        method: enrollmentMethod,
        modelsLoaded: isModelsLoaded(),
      });
    } else {
      // Create new enrollment
      await pool.query(
        `INSERT INTO face_encodings (user_id, face_descriptor, is_active)
         VALUES ($1, $2, TRUE)`,
        [userId, JSON.stringify(descriptorArray)]
      );

      return res.status(201).json({
        message: "Face enrolled successfully.",
        method: enrollmentMethod,
        modelsLoaded: isModelsLoaded(),
      });
    }
  } catch (err) {
    console.error("Face enrollment error:", err);
    res.status(500).json({ error: "Server error during face enrollment." });
  }
});

// @route   POST /api/face/verify
// @desc    Verify user's face against stored enrollment
// @access  Private
router.post("/verify", auth(), async (req, res) => {
  const userId = req.user.id;
  const { image } = req.body; // Base64 encoded image

  try {
    if (!image) {
      return res.status(400).json({ message: "Image is required." });
    }

    // Get stored face descriptor
    const storedResult = await pool.query(
      "SELECT face_descriptor FROM face_encodings WHERE user_id = $1 AND is_active = TRUE",
      [userId]
    );

    if (storedResult.rowCount === 0) {
      return res.status(404).json({
        message: "No face enrollment found. Please enroll your face first.",
        enrolled: false,
      });
    }

    const storedDescriptor = storedResult.rows[0].face_descriptor;

    // Verify face
    let verificationResult;
    if (isModelsLoaded()) {
      verificationResult = await verifyFace(image, storedDescriptor);
    } else {
      // Fallback: simple detection
      const hasFace = await detectFaceSimple(image);
      verificationResult = {
        match: hasFace,
        score: hasFace ? 0.8 : 0, // Placeholder score
        threshold: 0.6,
        warning: "Face recognition models not loaded. Using simple detection.",
      };
    }

    if (verificationResult.error) {
      return res.status(400).json({
        message: verificationResult.error,
        verified: false,
      });
    }

    res.json({
      verified: verificationResult.match,
      score: verificationResult.score,
      threshold: verificationResult.threshold,
      message: verificationResult.match
        ? "Face verified successfully."
        : "Face verification failed. Please try again with better lighting and a clear view of your face.",
      warning: verificationResult.warning,
    });
  } catch (err) {
    console.error("Face verification error:", err);
    res.status(500).json({ error: "Server error during face verification." });
  }
});

// @route   GET /api/face/status
// @desc    Check if user has face enrolled and system status
// @access  Private
router.get("/status", auth(), async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "SELECT id, enrolled_at, is_active FROM face_encodings WHERE user_id = $1 AND is_active = TRUE",
      [userId]
    );

    res.json({
      enrolled: result.rowCount > 0,
      enrolledAt: result.rowCount > 0 ? result.rows[0].enrolled_at : null,
      modelsLoaded: isModelsLoaded(),
      systemReady: isModelsLoaded(),
    });
  } catch (err) {
    console.error("Face status error:", err);
    res.status(500).json({ error: "Server error checking face status." });
  }
});

// @route   DELETE /api/face/enroll
// @desc    Delete user's face enrollment
// @access  Private
router.delete("/enroll", auth(), async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      "UPDATE face_encodings SET is_active = FALSE WHERE user_id = $1",
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "No face enrollment found." });
    }

    res.json({ message: "Face enrollment deleted successfully." });
  } catch (err) {
    console.error("Face deletion error:", err);
    res.status(500).json({ error: "Server error deleting face enrollment." });
  }
});

module.exports = router;

