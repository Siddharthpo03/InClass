const express = require("express");
const router = express.Router();
const pool = require("../db"); // PostgreSQL connection pool
const auth = require("../middleware/auth"); // JWT middleware
const crypto = require("crypto");

// ------------------------
// Get logged-in faculty info
// ------------------------
router.get("/me", auth(["faculty"]), async (req, res) => {
  try {
    const facultyId = req.user.id;
    const result = await pool.query(
      "SELECT id, name, email, department, college FROM faculty WHERE id = $1",
      [facultyId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Faculty not found" });
    }
    res.json(result.rows[0]);
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

    res.json({
      message: "Session started",
      session: result.rows[0],
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
    const result = await pool.query(
      `SELECT s.id, s.name, s.roll_no
       FROM students s
       INNER JOIN enrollments e ON e.student_id = s.id
       WHERE e.class_id = $1
       ORDER BY s.name`,
      [classId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch course roster" });
  }
});

module.exports = router;
