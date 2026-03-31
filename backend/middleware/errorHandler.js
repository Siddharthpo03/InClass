// backend/middleware/errorHandler.js
// Centralized, production-safe Express error handler.
//
// - In development: returns message + stack for easier debugging.
// - In production: returns a generic message, never a stack trace.

// Ensure NODE_ENV always has a sane default
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode && Number.isInteger(err.statusCode)
    ? err.statusCode
    : 500;

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    res.status(statusCode).json({
      success: false,
      message: err.message || "Internal Server Error",
      stack: err.stack,
    });
  } else {
    // In production we never leak stack traces or internal details
    res.status(statusCode).json({
      success: false,
      message: "Internal Server Error",
    });
  }
}

module.exports = errorHandler;

