// inclass-backend/index.js
// Main server entry point - consolidated from server.js

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const pool = require("./db");
const socketInit = require("./socket");
const { errorHandler } = require("./utils/errorHandler");

// Load environment variables
dotenv.config();

const app = express();

// --- Middleware ---
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));
// Body parsing middleware - but multer will handle multipart/form-data
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files statically
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

// --- Initialize Face Recognition Models (async, non-blocking) ---
// Face recognition is optional - server will start even if TensorFlow.js is not available
// We'll load it after server starts to avoid blocking startup
setTimeout(() => {
  try {
    const faceRecognition = require("./utils/faceRecognition");
    if (faceRecognition && typeof faceRecognition.loadModels === 'function') {
      faceRecognition.loadModels().catch((err) => {
        console.warn("⚠️  Face recognition models will use fallback mode:", err.message);
      });
    }
  } catch (error) {
    console.warn("⚠️  Face recognition module not available. Server will continue without it.");
    console.warn("   Face recognition features will be disabled.");
  }
}, 1000);

// --- Routes ---
// Import your route handlers
const authRoutes = require("./routes/auth");
const attendanceRoutes = require("./routes/attendance");
const facultyRoutes = require("./routes/faculty");
const faceRecognitionRoutes = require("./routes/faceRecognition");
const fingerprintRecognitionRoutes = require("./routes/fingerprintRecognition");
const biometricsRoutes = require("./routes/biometrics");
const reportsRoutes = require("./routes/reports");

// --- API Endpoints ---
app.use("/api/auth", authRoutes);
app.use("/api/faculty", facultyRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/face", faceRecognitionRoutes);
app.use("/api/fingerprint", fingerprintRecognitionRoutes);
app.use("/api/biometrics", biometricsRoutes);

// Basic test route
app.get("/", (req, res) =>
  res.send(
    "InClass Backend Running (Endpoints: /api/auth, /api/faculty, /api/attendance, /api/reports, /api/face, /api/fingerprint, /api/biometrics)"
  )
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Error Handling Middleware (must be last) ---
app.use(errorHandler);

// --- Create HTTP Server and Integrate Socket.io ---
const PORT = process.env.PORT || 4000;
const server = http.createServer(app);

// Initialize Socket.io with the HTTP server
const io = socketInit.init(server, {
  origin: process.env.FRONTEND_URL || "*"
});

// Make io available to routes if needed
app.set("io", io);

// --- Start Server ---
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ Socket.io initialized and ready for connections`);
});
