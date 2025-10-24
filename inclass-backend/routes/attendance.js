// inclass-backend/routes/attendance.js

const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const getLocation = require("../utils/geo"); // Utility to get location (needs fixing in geo.js)
const sendMail = require("../utils/mailer"); // Utility to send mail

// @route   POST /api/attendance/mark
// @desc    Student submits code to mark attendance
// @access  Private (Student only)
router.post("/mark", auth(["student"]), async (req, res) => {
  const { code } = req.body;
  const student_id = req.user.id;
  const ip = req.ip; // Get client IP address
  let location_text = "Unknown"; // Placeholder

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

    // 2. Check Expiration Time
    if (new Date(session.expires_at) < new Date()) {
      // Optional: You could update is_active=FALSE here
      return res.status(400).json({ message: "Code expired." });
    }

    // 3. Attempt to get geo-location (This requires a working geo.js)
    // location_text = await getLocation(ip); // Using mock IP for now, actual IP won't work in development

    // 4. Record Attendance
    await pool.query(
      `INSERT INTO attendance (student_id, session_id, ip_address, location, status) 
             VALUES ($1, $2, $3, $4, 'Present')`,
      [student_id, session.id, ip, location_text]
    );

    // Optional: Notify faculty (using mock email)
    sendMail(
      "faculty@college.com",
      "Attendance Marked",
      `Student ${student_id} marked attendance for session ${session.id}.`
    );

    res.json({ message: "Attendance marked successfully." });
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
