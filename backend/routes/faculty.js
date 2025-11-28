const express = require("express");
const router = express.Router();
const pool = require("../db"); // PostgreSQL connection pool
const auth = require("../middleware/auth"); // JWT middleware
const crypto = require("crypto");
const socketIO = require("../socket"); // Socket.io instance

// ------------------------
// Get logged-in faculty info
// ------------------------
router.get("/me", auth(["faculty"]), async (req, res) => {
  try {
    const facultyId = req.user.id;
    // Fixed: Use users table instead of non-existent faculty table
    const result = await pool.query(
      "SELECT id, name, email, role, roll_no FROM users WHERE id = $1 AND role = 'faculty'",
      [facultyId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Faculty not found" });
    }
    const user = result.rows[0];
    // Map to match frontend expectations (department and college are derived from roll_no or set defaults)
    res.json({
      name: user.name,
      email: user.email,
      role: user.role,
      id: user.roll_no, // Frontend expects roll_no as id
      department: user.roll_no ? user.roll_no.substring(0, 3) : "N/A",
      college: "Tech University", // Default or can be added to users table later
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching faculty info" });
  }
});

// ------------------------
// Register a new course
// ------------------------
router.post("/register-course", auth(["faculty"]), async (req, res) => {
  const { course_code, title, total_classes } = req.body;
  const faculty_id = req.user.id;

  try {
    if (!course_code || !title || !total_classes || total_classes < 1) {
      return res
        .status(400)
        .json({ message: "Missing required fields or invalid class count." });
    }

    const result = await pool.query(
      `INSERT INTO classes (faculty_id, course_code, title, total_classes)
       VALUES ($1, $2, $3, $4)
       RETURNING id, course_code, title`,
      [faculty_id, course_code, title, total_classes]
    );

    res.status(201).json({
      message: "Course registered successfully",
      course: result.rows[0],
    });
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(400)
        .json({ message: "You have already registered this course code." });
    }
    console.error(err);
    res.status(500).json({ error: "Server error while registering course" });
  }
});

// ------------------------
// List all courses by faculty
// ------------------------
router.get("/my-courses", auth(["faculty"]), async (req, res) => {
  const faculty_id = req.user.id;
  try {
    const result = await pool.query(
      "SELECT id, course_code, title, total_classes FROM classes WHERE faculty_id = $1 ORDER BY title",
      [faculty_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while fetching courses" });
  }
});

// ------------------------
// Generate attendance session
// ------------------------
router.post("/start-session", auth(["faculty"]), async (req, res) => {
  const { class_id } = req.body;
  const code = crypto.randomBytes(3).toString("hex").toUpperCase();
  const EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes
  const expires_at = new Date(Date.now() + EXPIRATION_MS);

  try {
    if (!class_id) {
      return res.status(400).json({ message: "Class ID required" });
    }

    const result = await pool.query(
      `INSERT INTO sessions (class_id, code, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, code, expires_at`,
      [class_id, code, expires_at]
    );

    const newSession = result.rows[0];

    // Emit real-time Socket.io event when session is started
    try {
      const io = socketIO.getIO();
      if (io) {
        // Emit to class room to notify all connected clients
        io.to(`class_${class_id}`).emit("sessionStarted", {
          sessionId: newSession.id,
          code: newSession.code,
          classId: class_id,
          expiresAt: newSession.expires_at,
          facultyId: faculty_id,
        });

        console.log(`📡 Emitted session started event for class ${class_id} with code ${newSession.code}`);
      }
    } catch (socketError) {
      // Don't fail the request if Socket.io fails
      console.error("Socket.io emission error:", socketError);
    }

    res.json({
      message: "Session started",
      session: newSession,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while starting session" });
  }
});

// ------------------------
// Get course roster (students)
// ------------------------
router.get("/course-roster/:classId", auth(["faculty"]), async (req, res) => {
  const { classId } = req.params;

  try {
    // Fixed: Use users and enrollments tables (enrollments table now exists in schema)
    const result = await pool.query(
      `SELECT u.id, u.name, u.roll_no
       FROM users u
       INNER JOIN enrollments e ON e.student_id = u.id
       WHERE e.class_id = $1 AND u.role = 'student'
       ORDER BY u.name`,
      [classId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch course roster" });
  }
});

// ------------------------
// Get session attendance list (Use Case 02: Supervised Validation)
// ------------------------
router.get("/session-attendance/:sessionId", auth(["faculty"]), async (req, res) => {
  const { sessionId } = req.params;
  const faculty_id = req.user.id;

  try {
    // Verify session belongs to faculty
    const sessionCheck = await pool.query(
      `SELECT s.id, s.class_id, s.code, s.expires_at, c.faculty_id, c.course_code, c.title
       FROM sessions s
       INNER JOIN classes c ON c.id = s.class_id
       WHERE s.id = $1 AND c.faculty_id = $2`,
      [sessionId, faculty_id]
    );

    if (sessionCheck.rowCount === 0) {
      return res.status(404).json({ message: "Session not found or access denied." });
    }

    const session = sessionCheck.rows[0];

    // Get all enrolled students for this class
    const enrolledStudents = await pool.query(
      `SELECT u.id, u.name, u.roll_no
       FROM users u
       INNER JOIN enrollments e ON e.student_id = u.id
       WHERE e.class_id = $1 AND u.role = 'student'
       ORDER BY u.name`,
      [session.class_id]
    );

    // Get attendance records for this session
    const attendanceRecords = await pool.query(
      `SELECT a.*, u.name, u.roll_no
       FROM attendance a
       INNER JOIN users u ON u.id = a.student_id
       WHERE a.session_id = $1
       ORDER BY u.name`,
      [sessionId]
    );

    // Map students with their attendance status
    const attendanceMap = new Map();
    attendanceRecords.rows.forEach((record) => {
      attendanceMap.set(record.student_id, {
        id: record.id,
        status: record.status,
        is_overridden: record.is_overridden,
        override_reason: record.override_reason,
        face_verified: record.face_verified,
        fingerprint_verified: record.fingerprint_verified,
        created_at: record.created_at,
      });
    });

    const attendanceList = enrolledStudents.rows.map((student) => ({
      student_id: student.id,
      name: student.name,
      roll_no: student.roll_no,
      attendance: attendanceMap.get(student.id) || null,
      present: attendanceMap.has(student.id),
    }));

    res.json({
      success: true,
      session: {
        id: session.id,
        code: session.code,
        expires_at: session.expires_at,
        course_code: session.course_code,
        course_title: session.title,
      },
      attendance: attendanceList,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while fetching session attendance" });
  }
});

// ------------------------
// Manually mark attendance for student (Use Case 02: Supervised Validation)
// ------------------------
router.post("/manual-attendance", auth(["faculty"]), async (req, res) => {
  const { student_id, session_id, reason } = req.body;
  const faculty_id = req.user.id;

  try {
    if (!student_id || !session_id) {
      return res.status(400).json({ message: "Student ID and Session ID are required." });
    }

    // Verify session belongs to faculty
    const sessionCheck = await pool.query(
      `SELECT s.id, s.class_id, c.faculty_id
       FROM sessions s
       INNER JOIN classes c ON c.id = s.class_id
       WHERE s.id = $1 AND c.faculty_id = $2`,
      [session_id, faculty_id]
    );

    if (sessionCheck.rowCount === 0) {
      return res.status(403).json({ message: "You don't have permission to mark attendance for this session." });
    }

    // Verify student is enrolled
    const enrollmentCheck = await pool.query(
      "SELECT id FROM enrollments WHERE student_id = $1 AND class_id = $2",
      [student_id, sessionCheck.rows[0].class_id]
    );

    if (enrollmentCheck.rowCount === 0) {
      return res.status(400).json({ message: "Student is not enrolled in this class." });
    }

    // Insert or update attendance
    const result = await pool.query(
      `INSERT INTO attendance (student_id, session_id, status, is_overridden, override_reason)
       VALUES ($1, $2, 'Manual', TRUE, $3)
       ON CONFLICT (student_id, session_id)
       DO UPDATE SET 
         status = 'Manual',
         is_overridden = TRUE,
         override_reason = $3
       RETURNING id, created_at`,
      [student_id, session_id, reason || "Manually marked by faculty"]
    );

    res.json({
      success: true,
      message: "Attendance marked manually.",
      attendance: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error while marking manual attendance" });
  }
});

// ------------------------
// Enroll student in a class
// ------------------------
router.post("/enroll-student", auth(["faculty"]), async (req, res) => {
  const { student_id, class_id } = req.body;
  const faculty_id = req.user.id;

  try {
    if (!student_id || !class_id) {
      return res.status(400).json({ message: "Student ID and Class ID are required." });
    }

    // Verify the class belongs to this faculty
    const classCheck = await pool.query(
      "SELECT id FROM classes WHERE id = $1 AND faculty_id = $2",
      [class_id, faculty_id]
    );
    if (classCheck.rowCount === 0) {
      return res.status(403).json({ message: "You don't have permission to enroll students in this class." });
    }

    // Verify the user is a student
    const studentCheck = await pool.query(
      "SELECT id FROM users WHERE id = $1 AND role = 'student'",
      [student_id]
    );
    if (studentCheck.rowCount === 0) {
      return res.status(400).json({ message: "Invalid student ID." });
    }

    // Enroll the student
    const result = await pool.query(
      "INSERT INTO enrollments (student_id, class_id) VALUES ($1, $2) RETURNING id",
      [student_id, class_id]
    );

    res.status(201).json({
      message: "Student enrolled successfully.",
      enrollment_id: result.rows[0].id,
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ message: "Student is already enrolled in this class." });
    }
    console.error(err);
    res.status(500).json({ error: "Server error while enrolling student" });
  }
});

// ------------------------
// Get pending students for faculty approval
// ------------------------
router.get("/pending-students", auth(["faculty"]), async (req, res) => {
  const facultyId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT 
        ps.id as pending_id,
        ps.status,
        ps.created_at,
        ps.faculty_notes,
        u.id as student_id,
        u.name as student_name,
        u.email as student_email,
        u.roll_no as student_roll_no,
        u.mobile_number,
        u.country_code,
        u.college,
        u.passport_photo_url
      FROM pending_students ps
      JOIN users u ON ps.student_id = u.id
      WHERE ps.faculty_id = $1 AND ps.status = 'Pending'
      ORDER BY ps.created_at DESC`,
      [facultyId]
    );

    res.json({
      pendingStudents: result.rows.map((row) => ({
        pendingId: row.pending_id,
        status: row.status,
        createdAt: row.created_at,
        facultyNotes: row.faculty_notes,
        student: {
          id: row.student_id,
          name: row.student_name,
          email: row.student_email,
          rollNo: row.student_roll_no,
          mobileNumber: row.mobile_number,
          countryCode: row.country_code,
          college: row.college,
          passportPhotoUrl: row.passport_photo_url,
        },
      })),
    });
  } catch (err) {
    console.error("Error fetching pending students:", err);
    res.status(500).json({ error: "Server error while fetching pending students" });
  }
});

// ------------------------
// Approve or reject pending student
// ------------------------
router.post("/pending-students/:pendingId/approve", auth(["faculty"]), async (req, res) => {
  const facultyId = req.user.id;
  const { pendingId } = req.params;
  const { notes } = req.body;

  try {
    // Verify the pending request belongs to this faculty
    const checkResult = await pool.query(
      "SELECT student_id FROM pending_students WHERE id = $1 AND faculty_id = $2 AND status = 'Pending'",
      [pendingId, facultyId]
    );

    if (checkResult.rowCount === 0) {
      return res.status(404).json({ message: "Pending student request not found or already processed" });
    }

    const studentId = checkResult.rows[0].student_id;

    // Update pending student status
    await pool.query(
      `UPDATE pending_students 
       SET status = 'Approved', 
           faculty_notes = $1, 
           resolved_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [notes || null, pendingId]
    );

    res.json({
      success: true,
      message: "Student approved successfully",
      studentId: studentId,
    });
  } catch (err) {
    console.error("Error approving student:", err);
    res.status(500).json({ error: "Server error while approving student" });
  }
});

router.post("/pending-students/:pendingId/reject", auth(["faculty"]), async (req, res) => {
  const facultyId = req.user.id;
  const { pendingId } = req.params;
  const { notes } = req.body;

  try {
    // Verify the pending request belongs to this faculty
    const checkResult = await pool.query(
      "SELECT student_id FROM pending_students WHERE id = $1 AND faculty_id = $2 AND status = 'Pending'",
      [pendingId, facultyId]
    );

    if (checkResult.rowCount === 0) {
      return res.status(404).json({ message: "Pending student request not found or already processed" });
    }

    // Update pending student status
    await pool.query(
      `UPDATE pending_students 
       SET status = 'Rejected', 
           faculty_notes = $1, 
           resolved_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [notes || null, pendingId]
    );

    res.json({
      success: true,
      message: "Student request rejected",
    });
  } catch (err) {
    console.error("Error rejecting student:", err);
    res.status(500).json({ error: "Server error while rejecting student" });
  }
});

module.exports = router;
