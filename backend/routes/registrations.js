// inclass-backend/routes/registrations.js
// Student course registration routes

const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const {
  asyncHandler,
  ValidationError,
  NotFoundError,
  AuthenticationError,
} = require("../utils/errorHandler");

// @route   POST /api/registrations
// @desc    Student registers for a course
// @access  Private (student)
router.post(
  "/",
  auth(["student"]),
  asyncHandler(async (req, res) => {
    const studentId = req.user.id;
    const { courseId } = req.body;

    if (!courseId) {
      throw new ValidationError("Course ID is required.");
    }

    // Check if course exists
    const courseResult = await pool.query(
      `SELECT id, faculty_id, course_code, course_name 
       FROM courses 
       WHERE id = $1 AND is_active = TRUE`,
      [courseId]
    );

    if (courseResult.rowCount === 0) {
      throw new NotFoundError("Course not found or inactive.");
    }

    const course = courseResult.rows[0];

    // Check if already registered
    const existingCheck = await pool.query(
      `SELECT id, status FROM student_registrations 
       WHERE student_id = $1 AND course_id = $2`,
      [studentId, courseId]
    );

    if (existingCheck.rowCount > 0) {
      const existing = existingCheck.rows[0];
      if (existing.status === "approved") {
        throw new ValidationError("You are already registered for this course.");
      } else if (existing.status === "pending") {
        throw new ValidationError("Registration request is already pending approval.");
      }
    }

    // Create registration request
    const result = await pool.query(
      `INSERT INTO student_registrations (student_id, course_id, faculty_id, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id, student_id, course_id, faculty_id, status, requested_at`,
      [studentId, courseId, course.faculty_id]
    );

    res.status(201).json({
      success: true,
      message: "Course registration request submitted successfully.",
      registration: result.rows[0],
    });
  })
);

// @route   GET /api/registrations/my-registrations
// @desc    Get student's course registrations
// @access  Private (student)
router.get(
  "/my-registrations",
  auth(["student"]),
  asyncHandler(async (req, res) => {
    const studentId = req.user.id;

    const result = await pool.query(
      `SELECT 
        sr.id,
        sr.status,
        sr.rejection_reason,
        sr.requested_at,
        sr.reviewed_at,
        c.id as course_id,
        c.course_code,
        c.course_name,
        c.description,
        c.credits,
        c.semester,
        c.academic_year,
        u.id as faculty_id,
        u.name as faculty_name,
        u.email as faculty_email
       FROM student_registrations sr
       JOIN courses c ON sr.course_id = c.id
       JOIN users u ON sr.faculty_id = u.id
       WHERE sr.student_id = $1
       ORDER BY sr.requested_at DESC`,
      [studentId]
    );

    res.json({
      registrations: result.rows.map((row) => ({
        id: row.id,
        status: row.status,
        rejectionReason: row.rejection_reason,
        requestedAt: row.requested_at,
        reviewedAt: row.reviewed_at,
        course: {
          id: row.course_id,
          courseCode: row.course_code,
          courseName: row.course_name,
          description: row.description,
          credits: row.credits,
          semester: row.semester,
          academicYear: row.academic_year,
        },
        faculty: {
          id: row.faculty_id,
          name: row.faculty_name,
          email: row.faculty_email,
        },
      })),
    });
  })
);

// @route   GET /api/faculty/courses/:courseId/registrations
// @desc    Get pending registrations for a course (faculty only)
// @access  Private (faculty)
router.get(
  "/faculty/courses/:courseId/registrations",
  auth(["faculty"]),
  asyncHandler(async (req, res) => {
    const facultyId = req.user.id;
    const { courseId } = req.params;

    // Verify course belongs to faculty
    const courseCheck = await pool.query(
      "SELECT id FROM courses WHERE id = $1 AND faculty_id = $2",
      [courseId, facultyId]
    );

    if (courseCheck.rowCount === 0) {
      throw new NotFoundError("Course not found or you don't have access to it.");
    }

    const result = await pool.query(
      `SELECT 
        sr.id,
        sr.status,
        sr.rejection_reason,
        sr.requested_at,
        sr.reviewed_at,
        u.id as student_id,
        u.name as student_name,
        u.email as student_email,
        u.roll_no as student_roll_no,
        u.college,
        u.department
       FROM student_registrations sr
       JOIN users u ON sr.student_id = u.id
       WHERE sr.course_id = $1
       ORDER BY sr.requested_at DESC`,
      [courseId]
    );

    res.json({
      registrations: result.rows.map((row) => ({
        id: row.id,
        status: row.status,
        rejectionReason: row.rejection_reason,
        requestedAt: row.requested_at,
        reviewedAt: row.reviewed_at,
        student: {
          id: row.student_id,
          name: row.student_name,
          email: row.student_email,
          rollNo: row.student_roll_no,
          college: row.college,
          department: row.department,
        },
      })),
    });
  })
);

// @route   POST /api/faculty/registrations/:registrationId/approve
// @desc    Approve a student registration request (faculty only)
// @access  Private (faculty)
router.post(
  "/faculty/registrations/:registrationId/approve",
  auth(["faculty"]),
  asyncHandler(async (req, res) => {
    const facultyId = req.user.id;
    const { registrationId } = req.params;
    const { fingerprintData } = req.body; // Optional: fingerprint template data

    // Get registration and verify it belongs to faculty's course
    const regResult = await pool.query(
      `SELECT sr.id, sr.student_id, sr.course_id, sr.status, c.faculty_id
       FROM student_registrations sr
       JOIN courses c ON sr.course_id = c.id
       WHERE sr.id = $1`,
      [registrationId]
    );

    if (regResult.rowCount === 0) {
      throw new NotFoundError("Registration request not found.");
    }

    const registration = regResult.rows[0];

    if (registration.faculty_id !== facultyId) {
      throw new AuthenticationError("You don't have permission to approve this registration.");
    }

    if (registration.status !== "pending") {
      throw new ValidationError(`Registration is already ${registration.status}.`);
    }

    // Approve registration
    await pool.query(
      `UPDATE student_registrations 
       SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [registrationId]
    );

    // If fingerprint data provided, store it (skeleton for vendor integration)
    if (fingerprintData && fingerprintData.encryptedTemplate) {
      const { encrypt } = require("../utils/crypto");
      const encryptedTemplate = encrypt(JSON.stringify(fingerprintData.encryptedTemplate));

      // Check if template already exists for this student
      const existingTemplate = await pool.query(
        "SELECT id FROM fingerprint_templates WHERE student_id = $1 AND is_active = TRUE",
        [registration.student_id]
      );

      if (existingTemplate.rowCount === 0) {
        await pool.query(
          `INSERT INTO fingerprint_templates (user_id, student_id, encrypted_template, vendor, enrolled_by)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            registration.student_id,
            registration.student_id,
            encryptedTemplate,
            fingerprintData.vendor || "custom",
            facultyId,
          ]
        );
      } else {
        // Update existing template
        await pool.query(
          `UPDATE fingerprint_templates 
           SET encrypted_template = $1, vendor = $2, enrolled_by = $3, enrolled_at = CURRENT_TIMESTAMP
           WHERE student_id = $4 AND is_active = TRUE`,
          [
            encryptedTemplate,
            fingerprintData.vendor || "custom",
            facultyId,
            registration.student_id,
          ]
        );
      }

      // Set fingerprint_enrolled flag
      await pool.query(
        "UPDATE users SET fingerprint_enrolled = TRUE WHERE id = $1",
        [registration.student_id]
      );
    }

    res.json({
      success: true,
      message: "Registration approved successfully.",
    });
  })
);

// @route   POST /api/faculty/registrations/:registrationId/reject
// @desc    Reject a student registration request (faculty only)
// @access  Private (faculty)
router.post(
  "/faculty/registrations/:registrationId/reject",
  auth(["faculty"]),
  asyncHandler(async (req, res) => {
    const facultyId = req.user.id;
    const { registrationId } = req.params;
    const { rejectionReason } = req.body;

    // Get registration and verify it belongs to faculty's course
    const regResult = await pool.query(
      `SELECT sr.id, sr.status, c.faculty_id
       FROM student_registrations sr
       JOIN courses c ON sr.course_id = c.id
       WHERE sr.id = $1`,
      [registrationId]
    );

    if (regResult.rowCount === 0) {
      throw new NotFoundError("Registration request not found.");
    }

    const registration = regResult.rows[0];

    if (registration.faculty_id !== facultyId) {
      throw new AuthenticationError("You don't have permission to reject this registration.");
    }

    if (registration.status !== "pending") {
      throw new ValidationError(`Registration is already ${registration.status}.`);
    }

    // Reject registration
    await pool.query(
      `UPDATE student_registrations 
       SET status = 'rejected', rejection_reason = $1, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [rejectionReason || "No reason provided", registrationId]
    );

    res.json({
      success: true,
      message: "Registration rejected successfully.",
    });
  })
);

module.exports = router;

