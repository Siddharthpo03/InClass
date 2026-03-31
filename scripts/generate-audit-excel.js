#!/usr/bin/env node
/**
 * Generates audit-report.xlsx with two sheets: Solved | New Errors
 * Run from repo root: node scripts/generate-audit-excel.js
 */
const XLSX = require("xlsx");
const path = require("path");
const fs = require("fs");

const solved = [
  ["Category", "Item", "Evidence / Location"],
  ["Security", "Rate limiting", "backend/middleware/rateLimiter.js; app.js, auth.js"],
  ["Security", "Helmet security headers", "backend/app.js"],
  ["Security", "CORS restrictions", "FRONTEND_URL in production; no wildcard"],
  ["Security", "JWT secret validation", "backend/app.js L58, L82"],
  ["Security", "Admin secret enforcement", "Admin routes/middleware"],
  ["Security", "SQL injection protection", "Parameterized queries in biometrics.js, attendance.js, etc."],
  ["Security", "Environment variable protection", "backend/utils/crypto.js BIOMETRIC_ENCRYPTION_KEY"],
  ["Security", "WebAuthn RP_ID", "backend/routes/biometrics.js required in production"],
  ["Security", "Socket.io CORS", "backend/socket.js SOCKET_ORIGINS; no *"],
  ["Database", "Connection pool limits", "backend/db.js max: 20, timeouts, SSL"],
  ["Database", "Indexes", "backend/schema.sql CREATE INDEX IF NOT EXISTS"],
  ["Database", "Migration / schema system", "schema.sql; run-schema.js, setup-schema.js"],
  ["Database", "Duplicate detection job", "backend/jobs/duplicateDetection.js; server.js L70-71"],
  ["Biometrics", "FaceNet model verification", "frontend/src/utils/faceModels.js verifyFaceNetModel()"],
  ["Biometrics", "No logging of decrypted embeddings", "backend/utils/crypto.js secureLog() redacts"],
  ["Biometrics", "WebAuthn RP_ID validation", "Required in production in biometrics routes"],
  ["Realtime", "Secure Socket.io CORS", "socket.js SOCKET_ORIGINS"],
  ["Realtime", "Structured socket logging", "backend/socket.js logger (Winston)"],
  ["Realtime", "Monitoring hooks", "Sentry when SENTRY_DSN set"],
  ["Infrastructure", "Monitoring / Sentry", "server.js, socket.js SENTRY_DSN"],
  ["Infrastructure", "Structured logging", "backend/utils/logger.js Winston JSON"],
  ["Infrastructure", "Deployment documentation", "DEPLOYMENT.md"],
  ["Infrastructure", "Metrics endpoint", "backend/utils/metrics.js GET /metrics"],
  ["Performance", "k6 load tests", "backend/tests/load/login-test.js, attendance-test.js, session-test.js"],
  ["Performance", "CDN support for models", "frontend faceModels.js VITE_CDN_BASE_URL"],
  ["Performance", "Lazy loading", "frontend/src/App.jsx lazy() + Suspense"],
  ["Code Quality", "ESLint in CI", ".github/workflows/lint.yml"],
  ["Code Quality", "TypeScript / JS checks", "tsconfig.json checkJs, allowJs"],
  ["UX", "Error boundaries", "frontend/src/App.jsx ErrorBoundary"],
  ["UX", "Mobile responsiveness", "frontend/index.html viewport meta"],
];

const newErrors = [
  ["Priority", "Issue", "Location", "Details"],
  ["High", "Sensitive data in console", "backend/scripts/createAdmin.js L66", "Logs plaintext password to console"],
  ["High", "ReferenceError in error paths", "backend/routes/biometrics.js L766, L826, L957, L1007", "targetUserId out of scope in catch blocks"],
  ["High", "Undefined next in Express handlers", "backend/routes/biometrics.js L283, L447", "Handlers use next(err) but declared as (req, res)"],
  ["Medium", "Blocking sync file read", "backend/routes/faceRecognition.js L19, L24", "fs.existsSync / fs.readFileSync blocks event loop"],
  ["Medium", "Secrets on disk", "backend/.env", "Real secrets; ensure never committed"],
  ["Low", "Auth route debug logging", "backend/routes/auth.js L410-431", "Multiple console.log for login/face flow"],
  ["Low", "Test script logs", "backend/scripts/testAdminLogin.js L85, L90", "Password hash substring; ensure not run in production"],
  ["New", "Backend ESLint errors", "Multiple backend files", "46 errors: no-unused-vars, no-undef (next, targetUserId), no-useless-escape"],
  ["New", "Frontend ESLint errors", "CookieConsent, Footer, Navigation, etc.", "Unused vars; jsx-a11y (labels, keyboard, anchor-is-valid)"],
  ["New", "biometrics.js runtime", "backend/routes/biometrics.js", "next and targetUserId cause runtime errors in error paths"],
  ["New", "faceRecognition.js sync I/O", "backend/routes/faceRecognition.js", "Sync file read can cause latency under load"],
];

const wb = XLSX.utils.book_new();
const wsSolved = XLSX.utils.aoa_to_sheet(solved);
const wsNewErrors = XLSX.utils.aoa_to_sheet(newErrors);

XLSX.utils.book_append_sheet(wb, wsSolved, "Solved");
XLSX.utils.book_append_sheet(wb, wsNewErrors, "New Errors");

const outDir = path.join(__dirname, "..");
const outPath = path.join(outDir, "audit-solved-vs-new-errors.xlsx");
XLSX.writeFile(wb, outPath);

console.log("Written:", outPath);
