// inclass-backend/routes/auth.js

const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {
  asyncHandler,
  ValidationError,
  AuthenticationError,
  NotFoundError,
  ConflictError,
  validateRequired,
  validateEmail,
  validateRole,
} = require("../utils/errorHandler");

// Utility to generate JWT (requires JWT_SECRET in .env)
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });
};

// @route   GET /api/auth/check-email
// @desc    Check if email exists and return role (for admin auto-detection)
// @access  Public
// IMPORTANT: This route must be defined BEFORE other routes to avoid conflicts
router.get(
  "/check-email",
  asyncHandler(async (req, res) => {
    const { email } = req.query;

    if (!email) {
      return res.json({ exists: false, role: null });
    }

    const result = await pool.query(
      "SELECT role FROM users WHERE email = $1",
      [email]
    );

    if (result.rowCount === 0) {
      return res.json({ exists: false, role: null });
    }

    res.json({
      exists: true,
      role: result.rows[0].role,
    });
  })
);

// @route   GET /api/auth/profile
// @desc    Get authenticated user's profile details
// @access  Private
router.get(
  "/profile",
  auth(),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT name, email, role, roll_no, college, department FROM users WHERE id = $1",
      [userId]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError("User profile");
    }

    const user = result.rows[0];

    // Check if user has enrolled fingerprint
    const fingerprintCheck = await pool.query(
      "SELECT id FROM fingerprint_data WHERE user_id = $1 AND is_active = true LIMIT 1",
      [userId]
    );

    const hasFingerprint = fingerprintCheck.rowCount > 0;

    // Map data to the structure the frontend expects
    res.json({
      name: user.name,
      role: user.role,
      id: user.roll_no,
      userId: userId, // Add userId for fingerprint enrollment
      hasFingerprint: hasFingerprint,
      email: user.email,
      department: user.department || (user.roll_no ? user.roll_no.substring(0, 3) : "N/A"),
      college: user.college || "Tech University",
    });
  })
);

// @route   POST /api/auth/register
// @desc    Register User (with file upload support)
const upload = require("../middleware/upload");

router.post(
  "/register",
  upload.fields([
    { name: "passportPhoto", maxCount: 1 },
    { name: "faceImage", maxCount: 1 }
  ]), // Handle multiple file uploads
  asyncHandler(async (req, res) => {
    // Debug: Log what we received
    console.log("📥 Registration request received");
    console.log("📥 Content-Type:", req.headers["content-type"]);
    console.log("📥 req.body:", req.body);
    console.log("📥 req.body type:", typeof req.body);
    console.log("📥 req.body keys:", req.body ? Object.keys(req.body) : "null");
    console.log("📥 req.files:", req.files);
    console.log("📥 passportPhoto:", req.files?.passportPhoto ? { filename: req.files.passportPhoto[0].filename, size: req.files.passportPhoto[0].size } : null);
    console.log("📥 faceImage:", req.files?.faceImage ? { filename: req.files.faceImage[0].filename, size: req.files.faceImage[0].size } : null);
    
    // Check if req.body exists - multer should populate this
    if (!req.body) {
      console.error("❌ req.body is undefined - multer may not have parsed the request");
      console.error("❌ This usually means the request isn't multipart/form-data");
      throw new ValidationError("Request body is missing. Please ensure the form is submitted correctly.");
    }
    
    if (typeof req.body !== 'object') {
      console.error("❌ req.body is not an object:", typeof req.body, req.body);
      throw new ValidationError("Invalid request format. Please try again.");
    }

    // Note: Frontend sends name, email, password, role, roll_no, mobile_number, country_code
    // and passportPhoto as file upload
    // Multer parses form fields into req.body
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const role = req.body.role;
    const roll_no = req.body.roll_no;
    const mobile_number = req.body.mobile_number;
    const country_code = req.body.country_code;
    const college = req.body.college;
    const department = req.body.department;
    
    console.log("📥 Parsed values:", { name, email, role, roll_no, mobile_number, country_code, college, department });

    // Validate required fields - use individual variables
    if (!name || !email || !password || !role) {
      throw new ValidationError("Missing required fields: name, email, password, and role are required.");
    }

    // Validate email format
    validateEmail(email);

    // Validate role
    validateRole(role);

    // Validate mobile number format if provided
    if (mobile_number && !/^\d{10,15}$/.test(mobile_number.replace(/\s/g, ""))) {
      throw new ValidationError("Invalid mobile number format");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Handle passport photo upload
    let passportPhotoUrl = null;
    if (req.files?.passportPhoto && req.files.passportPhoto[0]) {
      // In production, upload to cloud storage (S3, Cloudinary, etc.)
      // For now, store relative path
      passportPhotoUrl = `/uploads/${req.files.passportPhoto[0].filename}`;
      console.log("📸 Passport photo saved:", passportPhotoUrl);
    }
    
    // Handle face image upload (store for face recognition enrollment)
    let faceImagePath = null;
    if (req.files?.faceImage && req.files.faceImage[0]) {
      faceImagePath = `/uploads/${req.files.faceImage[0].filename}`;
      console.log("👤 Face image saved:", faceImagePath);
    }

    // Insert user (PostgreSQL will handle unique constraint violations)
    console.log("💾 Inserting user into database...");
    console.log("💾 Values:", { 
      name, 
      email, 
      role, 
      roll_no: roll_no || null, 
      mobile_number: mobile_number || null, 
      country_code: country_code || "+1", 
      passport_photo_url: passportPhotoUrl 
    });
    
    try {
      const result = await pool.query(
        `INSERT INTO users (name, email, password, role, roll_no, mobile_number, country_code, passport_photo_url, college, department) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
         RETURNING id, name, role, mobile_number, country_code, passport_photo_url, college, department`,
        [name, email, hashedPassword, role, roll_no || null, mobile_number || null, country_code || "+1", passportPhotoUrl, college || null, department || null]
      );

      console.log("✅ User inserted successfully, ID:", result.rows[0].id);
      const user = result.rows[0];
      
      res.status(201).json({
        success: true,
        message: "User registered successfully.",
        user: user,
        token: generateToken(user.id, user.role),
        userId: user.id, // Return userId for biometric enrollment
      });
    } catch (dbError) {
      console.error("❌ ========== DATABASE ERROR ==========");
      console.error("❌ Error message:", dbError.message);
      console.error("❌ Error code:", dbError.code);
      console.error("❌ Error detail:", dbError.detail);
      console.error("❌ Error constraint:", dbError.constraint);
      console.error("❌ Error table:", dbError.table);
      console.error("❌ Error column:", dbError.column);
      console.error("❌ Full error:", JSON.stringify(dbError, null, 2));
      console.error("❌ ====================================");
      throw dbError; // Re-throw to be caught by errorHandler
    }
  })
);

// @route   POST /api/auth/login
// @desc    Authenticate User
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password, role } = req.body; // Frontend sends email as 'username'

    // Validate required fields
    validateRequired(["email", "password", "role"], req.body);
    validateEmail(email);
    validateRole(role);

    // Find user
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rowCount === 0) {
      throw new AuthenticationError("Invalid email or password.");
    }

    const user = result.rows[0];

    // Check role match
    if (user.role !== role) {
      throw new AuthenticationError(
        "Role mismatch. Please select the correct role.",
        { expected: role, actual: user.role }
      );
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new AuthenticationError("Invalid email or password.");
    }

    res.json({
      success: true,
      message: "Login successful.",
      user: { id: user.id, name: user.name, role: user.role },
      token: generateToken(user.id, user.role),
      role: user.role,
    });
  })
);

// @route   GET /api/auth/faculty-by-college
// @desc    Get faculty members by college name
// @access  Public
router.get(
  "/faculty-by-college",
  asyncHandler(async (req, res) => {
    const { college } = req.query;

    if (!college || college.trim().length === 0) {
      return res.json({ faculty: [] });
    }

    const result = await pool.query(
      "SELECT id, name, email, roll_no FROM users WHERE role = 'faculty' AND college ILIKE $1 ORDER BY name",
      [`%${college.trim()}%`]
    );

    res.json({
      faculty: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        roll_no: row.roll_no,
      })),
    });
  })
);

// @route   POST /api/auth/submit-pending-student
// @desc    Submit student registration for faculty approval (when no fingerprint)
// @access  Public (student submits before login)
router.post(
  "/submit-pending-student",
  asyncHandler(async (req, res) => {
    const { studentId, facultyId } = req.body;

    if (!studentId || !facultyId) {
      throw new ValidationError("Student ID and Faculty ID are required.");
    }

    // Check if student exists
    const studentCheck = await pool.query("SELECT id, role FROM users WHERE id = $1", [studentId]);
    if (studentCheck.rowCount === 0 || studentCheck.rows[0].role !== "student") {
      throw new NotFoundError("Student not found.");
    }

    // Check if faculty exists
    const facultyCheck = await pool.query("SELECT id, role FROM users WHERE id = $1", [facultyId]);
    if (facultyCheck.rowCount === 0 || facultyCheck.rows[0].role !== "faculty") {
      throw new NotFoundError("Faculty not found.");
    }

    // Insert or update pending student record
    const result = await pool.query(
      `INSERT INTO pending_students (student_id, faculty_id, status)
       VALUES ($1, $2, 'Pending')
       ON CONFLICT (student_id, faculty_id) 
       DO UPDATE SET status = 'Pending', created_at = CURRENT_TIMESTAMP
       RETURNING id, student_id, faculty_id, status, created_at`,
      [studentId, facultyId]
    );

    res.status(201).json({
      success: true,
      message: "Registration request submitted successfully. Faculty will review your application.",
      pendingRequest: result.rows[0],
    });
  })
);

// @route   GET /api/auth/colleges
// @desc    Get list of all active colleges/universities
// @access  Public
router.get(
  "/colleges",
  asyncHandler(async (req, res) => {
    const { search } = req.query;
    
    let query = "SELECT id, name, country, state, city, type FROM colleges WHERE is_active = true";
    let params = [];
    
    if (search && search.trim().length > 0) {
      query += " AND name ILIKE $1";
      params.push(`%${search.trim()}%`);
    }
    
    query += " ORDER BY name ASC";
    
    const result = await pool.query(query, params);
    
    res.json({
      colleges: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        country: row.country,
        state: row.state,
        city: row.city,
        type: row.type,
      })),
    });
  })
);

// @route   GET /api/auth/departments
// @desc    Get list of all active departments
// @access  Public
router.get(
  "/departments",
  asyncHandler(async (req, res) => {
    const { search } = req.query;
    
    let query = "SELECT id, name, code, description FROM departments WHERE is_active = true";
    let params = [];
    
    if (search && search.trim().length > 0) {
      query += " AND (name ILIKE $1 OR code ILIKE $1)";
      params.push(`%${search.trim()}%`);
    }
    
    query += " ORDER BY name ASC";
    
    const result = await pool.query(query, params);
    
    res.json({
      departments: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        description: row.description,
      })),
    });
  })
);

module.exports = router;
