// inclass-backend/index.js (Your Main Server File)

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./db"); // Import the PostgreSQL connection pool

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// --- Database Connection Test ---
// Check DB connection on startup (Optional but good practice)
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("❌ FATAL: Database connection failed.", err.message);
    // Do not exit the process, but log the error
  } else {
    console.log("✅ PostgreSQL connected successfully.");
  }
});

// --- Routes ---
// NOTE: We assume your route files export the router object correctly.
const authRoutes = require("./routes/auth");
const attendanceRoutes = require("./routes/attendance");
const facultyRoutes = require("./routes/faculty");

app.use("/api/auth", authRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/attendance", attendanceRoutes);

// Basic Route
app.get("/", (req, res) => res.send("InClass Backend Running (v2)"));

// 🚨 FIX: Using port 4000 for the web server, NOT 5432 (DB port)
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
