// inclass-backend/routes/auth.js

const express = require("express");
const router = express.Router();
const pool = require("../db");
const auth = require("../middleware/auth");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Utility to generate JWT (requires JWT_SECRET in .env)
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });
};

// @route   GET /api/auth/profile
// @desc    Get authenticated user's profile details
// @access  Private
router.get("/profile", auth(), async (req, res) => {
  const userId = req.user.id;

  try {
    // 🚨 FIX: Use standard string quotes for the query, and pass parameters in an array.
    const result = await pool.query(
      "SELECT name, email, role, roll_no FROM users WHERE id = $1",
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User profile not found." });
    }

    const user = result.rows[0];

    // Map data to the structure the frontend expects
    res.json({
      name: user.name,
      role: user.role,
      id: user.roll_no,
      email: user.email,
      department: user.roll_no ? user.roll_no.substring(0, 3) : "N/A",
      college: "Tech University",
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ error: "Server error fetching profile." });
  }
});

// @route   POST /api/auth/register
// @desc    Register User
router.post("/register", async (req, res) => {
  // Note: Frontend sends name, email, password, role, and roll_no (studentId/facultyId)
  const { name, email, password, role, roll_no } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    if (!["admin", "faculty", "student"].includes(role)) {
      return res.status(400).json({ message: "Invalid user role specified." });
    }

    // Ensure email is unique (PostgreSQL constraint check will handle this)
    const result = await pool.query(
      "INSERT INTO users (name, email, password, role, roll_no) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, role",
      [name, email, hashedPassword, role, roll_no]
    );

    const user = result.rows[0];
    res.status(201).json({
      message: "User registered successfully.",
      user: user,
      token: generateToken(user.id, user.role),
    });
  } catch (err) {
    if (err.code === "23505") {
      // Unique violation error
      return res
        .status(400)
        .json({ message: "User email or ID already exists." });
    }
    console.error(err);
    res.status(500).json({ error: "Server error during registration." });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate User
router.post("/login", async (req, res) => {
  const { email, password, role } = req.body; // Frontend sends email as 'username'
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rowCount === 0) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const user = result.rows[0];

    if (user.role !== role) {
      return res
        .status(403)
        .json({ message: "Role mismatch. Please select the correct role." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    res.json({
      message: "Login successful.",
      user: { id: user.id, name: user.name, role: user.role },
      token: generateToken(user.id, user.role),
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error during login." });
  }
});

module.exports = router;
