// inclass-backend/index.js

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const pool = require("./db"); // Assuming db.js exports the pool

// Load environment variables
dotenv.config();

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Database Connection Check (Initial Test) ---
// This ensures the application doesn't try to route traffic if the DB is down.
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error(
      "❌ FATAL: Database connection failed. Check db.js and .env.",
      err.message
    );
    // Fail fast in production/CI so deploys don't run with a broken DB
    process.exit(1);
  } else {
    console.log("✅ PostgreSQL connected successfully. Date:", res.rows[0].now);
  }
});

// --- Routes ---
// Import your route handlers
const authRoutes = require("./routes/auth");
const attendanceRoutes = require("./routes/attendance");
const facultyRoutes = require("./routes/faculty");

// --- API Endpoints ---
app.use("/api/auth", authRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/attendance", attendanceRoutes);

// Basic test route
app.get("/", (req, res) =>
  res.send(
    "InClass Backend Running (Endpoints: /api/auth, /api/faculty, /api/attendance)"
  )
);

// --- Start Server ---
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
