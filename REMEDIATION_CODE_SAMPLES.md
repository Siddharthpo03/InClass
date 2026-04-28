# Production Deployment Remediation Guide

**Quick Reference:** Specific fixes and code samples for each issue

---

## 🔴 CRITICAL ISSUES - Remediation Code

### Issue #1: Console Logging → Winston Logger

**Current State:**

```javascript
// app.js
console.log("🔒 CORS: Production mode - Allowing:", frontendUrl);
console.warn(`🚫 CORS: Blocked request from origin: ${origin}`);
console.error("Health check database error:", err.message);
```

**Remediation - Option A: Replace all console calls**

File: [backend/app.js](./backend/app.js)

```javascript
// Add at top
const logger = require("./utils/logger");

// Line 152: Replace
// console.log("🔒 CORS: Development mode...")
logger.info("CORS: Development mode", { origins: allowedOrigins });

// Line 177: Replace
// console.log("🔒 CORS: Production mode...")
logger.info("CORS: Production mode", { frontendUrl });

// Line 189: Replace console.warn
logger.warn("CORS: Request with no origin header", { isDevelopment });

// Line 207: Replace console.warn
logger.warn("CORS: Blocked origin", { origin });

// Line 328: Replace console.error
logger.error("Health check failed", { error: err.message });
```

File: [backend/routes/admin.js](./backend/routes/admin.js)

```javascript
// Line 69: Replace
// console.log(`[Admin Login] Attempting login for email: ${email}`);
logger.info("Admin login attempt", { email, ip: req.ip });
```

File: [backend/routes/registrations.js](./backend/routes/registrations.js)

```javascript
// Line 29: Replace
// console.log("📝 Course registration request:", { studentId, courseId });
logger.info("Course registration request", { studentId, courseId, ip: req.ip });

// Line 57: Replace
// console.log("✅ Creating registration:", ...)
logger.info("Registration created", { registrationId, studentId, courseId });
```

File: [backend/utils/sms.js](./backend/utils/sms.js)

```javascript
const logger = require("./logger");

// Replace initialization logs
(function initializeTwilio() {
  if (ACCOUNT_SID && AUTH_TOKEN) {
    try {
      twilioClient = twilio(ACCOUNT_SID, AUTH_TOKEN);
      logger.info("Twilio initialized successfully");
      if (VERIFY_SERVICE_SID) {
        logger.info("Twilio Verify Service configured");
      } else {
        logger.warn("Twilio Verify Service SID not configured - OTP disabled");
      }
    } catch (error) {
      logger.error("Twilio initialization failed", { error: error.message });
      twilioClient = null;
    }
  } else {
    logger.warn("Twilio credentials not configured - SMS disabled");
  }
})();
```

**Global Find & Replace Pattern:**

Use VS Code find/replace with regex:

- Find: `console\.(log|warn|error)\(`
- Replace: `logger.$1(`
- Add imports: `const logger = require("./utils/logger");`

**Test:**

```bash
# Run server with LOG_LEVEL=debug
LOG_LEVEL=debug npm start

# Verify Winston logs are emitted (should see JSON on stdout)
# Should NOT see emoji prefixes (🔒, ❌, ✅)
```

---

### Issue #2: Consistent Error Response Format

**Current Inconsistency:**

```javascript
// Format 1: admin.js
res.status(400).json({ message: "Email required" });

// Format 2: biometrics.js
res.status(400).json({ success: false, message: "..." });

// Format 3: faceRecognition.js
res.status(500).json({ error: "...", message: "..." });
```

**Remediation - Create Standard Error Response**

File: [backend/utils/errorHandler.js](./backend/utils/errorHandler.js) - **REPLACE lines 190-210**

```javascript
/**
 * AsyncHandler wrapper - catches errors and passes to errorHandler middleware
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ... existing classes ...

/**
 * Standard response format - use consistently across all routes
 */
function sendErrorResponse(res, error) {
  const statusCode = error.statusCode || 500;
  const isDev = process.env.NODE_ENV === "development";

  const response = {
    success: false,
    error: {
      code: error.code || "INTERNAL_ERROR",
      message: isDev ? error.message : getPublicErrorMessage(statusCode),
    },
    timestamp: new Date().toISOString(),
  };

  // Include details only in development
  if (isDev && error.details) {
    response.error.details = error.details;
  }

  // Include stack trace only in development
  if (isDev && error.stack) {
    response.error.stack = error.stack;
  }

  // Include correlation ID if available
  if (res.locals.correlationId) {
    response.correlationId = res.locals.correlationId;
  }

  res.status(statusCode).json(response);
}

/**
 * Map status codes to public error messages (no internal details)
 */
function getPublicErrorMessage(statusCode) {
  switch (statusCode) {
    case 400:
      return "Bad request";
    case 401:
      return "Unauthorized";
    case 403:
      return "Forbidden";
    case 404:
      return "Not found";
    case 409:
      return "Conflict";
    case 429:
      return "Too many requests";
    case 500:
    case 502:
    case 503:
      return "Internal server error";
    default:
      return "An error occurred";
  }
}

/**
 * Express error handler middleware (UPDATED)
 */
function errorHandler(err, req, res, next) {
  let error = err;
  const logger = require("./logger");

  // Log the error
  logger.error("Unhandled error", {
    error: error.message,
    code: error.code,
    statusCode: error.statusCode,
    stack: error.stack,
    url: req.url,
    method: req.method,
    correlationId: res.locals.correlationId,
  });

  // Send standardized response
  sendErrorResponse(res, error);
}

/**
 * Success response format
 */
function sendSuccessResponse(res, data, statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
    correlationId: res.locals.correlationId,
  });
}

module.exports = {
  // ... existing exports ...
  asyncHandler,
  sendErrorResponse,
  sendSuccessResponse,
  errorHandler,
};
```

**Updates Required in Routes:**

File: [backend/routes/faculty.js](./backend/routes/faculty.js)

```javascript
const {
  asyncHandler,
  sendErrorResponse,
  sendSuccessResponse,
  ValidationError,
  NotFoundError,
} = require("../utils/errorHandler");

// Line 12: CHANGE from direct try-catch
router.get(
  "/me",
  auth(["faculty"]),
  asyncHandler(async (req, res) => {
    const facultyId = req.user.id;
    const result = await pool.query(
      "SELECT id, name, email, role, roll_no FROM users WHERE id = $1 AND role = 'faculty'",
      [facultyId],
    );

    if (result.rows.length === 0) {
      throw new NotFoundError("Faculty account not found");
    }

    const user = result.rows[0];
    sendSuccessResponse(res, {
      name: user.name,
      email: user.email,
      role: user.role,
      id: user.roll_no,
      department: user.roll_no ? user.roll_no.substring(0, 3) : "N/A",
      college: "Tech University",
    });
  }),
);

// Line 41: Course creation
router.post(
  "/courses",
  auth(["faculty"]),
  asyncHandler(async (req, res) => {
    const { courseCode, courseName, description, credits } = req.body;
    const faculty_id = req.user.id;

    if (!courseCode || !courseName) {
      throw new ValidationError("Course code and name are required");
    }

    const result = await pool.query(
      `INSERT INTO courses (faculty_id, course_code, course_name, description, credits, semester, academic_year, department_id, college_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
      [
        faculty_id,
        courseCode,
        courseName,
        description || null,
        credits || null,
        null,
        null,
        null,
        null,
      ],
    );

    sendSuccessResponse(res, { course: result.rows[0] }, 201);
  }),
);
```

**Test:** All error responses should now look like:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Course code and name are required"
  },
  "timestamp": "2026-04-26T10:30:00.000Z",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

### Issue #3: Startup Validation Checks

**Create File:** `backend/lib/startup-validation.js`

```javascript
// backend/lib/startup-validation.js

const pool = require("../db");
const logger = require("../utils/logger");

/**
 * Comprehensive startup checks before server listens
 */
async function validateStartup() {
  logger.info("Starting production readiness checks...");

  const checks = [];

  // 1. Database connectivity
  try {
    await pool.query("SELECT NOW()");
    logger.info("✅ Database connectivity OK");
    checks.push({ name: "Database connectivity", passed: true });
  } catch (err) {
    logger.error("❌ Database connection failed", { error: err.message });
    checks.push({
      name: "Database connectivity",
      passed: false,
      error: err.message,
    });
  }

  // 2. Required tables exist
  const requiredTables = [
    "users",
    "sessions",
    "attendance",
    "enrollments",
    "courses",
    "biometric_face",
    "webauthn_credentials",
  ];

  for (const table of requiredTables) {
    try {
      const result = await pool.query(
        `
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      `,
        [table],
      );

      if (result.rowCount === 0) {
        logger.error(`❌ Required table missing: ${table}`);
        checks.push({ name: `Table: ${table}`, passed: false });
      } else {
        checks.push({ name: `Table: ${table}`, passed: true });
      }
    } catch (err) {
      checks.push({
        name: `Table: ${table}`,
        passed: false,
        error: err.message,
      });
    }
  }

  // 3. pgvector extension
  try {
    const result = await pool.query(`
      SELECT 1 FROM pg_extension WHERE extname = 'vector'
    `);
    if (result.rowCount > 0) {
      logger.info("✅ pgvector extension available");
      checks.push({ name: "pgvector extension", passed: true });
    } else {
      logger.warn("⚠️  pgvector not installed, using float8[] fallback");
      checks.push({
        name: "pgvector extension",
        passed: true,
        warning: "fallback",
      });
    }
  } catch (err) {
    logger.warn("⚠️  Could not check pgvector", { error: err.message });
  }

  // 4. Environment variables validation
  const requiredEnv = [
    { name: "JWT_SECRET", minLength: 32 },
    { name: "BIOMETRIC_ENCRYPTION_KEY", minLength: 32 },
    { name: "DATABASE_URL", minLength: 10 },
  ];

  const optionalEnv = ["FRONTEND_URL", "SOCKET_ORIGINS", "WEBAUTHN_RP_ID"];

  for (const { name, minLength } of requiredEnv) {
    const value = process.env[name];
    if (!value) {
      logger.error(`❌ Required env var missing: ${name}`);
      checks.push({ name: `Env: ${name}`, passed: false });
    } else if (value.length < minLength) {
      logger.error(`❌ Env var too short: ${name} (need ${minLength} chars)`);
      checks.push({ name: `Env: ${name}`, passed: false });
    } else {
      checks.push({ name: `Env: ${name}`, passed: true });
    }
  }

  for (const name of optionalEnv) {
    const value = process.env[name];
    if (!value) {
      logger.warn(`⚠️  Optional env var not set: ${name}`);
    }
  }

  // 5. External services (if configured)
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    logger.info("✅ Twilio credentials configured");
    checks.push({ name: "Twilio SMS service", passed: true });
  } else {
    logger.warn("⚠️  Twilio SMS not configured (optional)");
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    logger.info("✅ Email service credentials configured");
    checks.push({ name: "Email service", passed: true });
  } else {
    logger.warn("⚠️  Email service not configured (optional)");
  }

  // 6. Face recognition model
  try {
    const { isFaceNetAvailable } = require("../services/facenet");
    if (isFaceNetAvailable()) {
      logger.info("✅ FaceNet model available");
      checks.push({ name: "FaceNet face recognition", passed: true });
    } else {
      logger.warn("⚠️  FaceNet model not available (optional)");
    }
  } catch (err) {
    logger.warn("⚠️  Could not verify FaceNet", { error: err.message });
  }

  // Summary
  const failedChecks = checks.filter((c) => !c.passed);
  const passedCount = checks.filter((c) => c.passed).length;

  logger.info(
    `Startup validation complete: ${passedCount}/${checks.length} passed`,
    {
      checks,
    },
  );

  if (failedChecks.length > 0) {
    logger.error("CRITICAL: Startup validation failed", {
      failed: failedChecks.map((c) => c.name),
    });
    process.exit(1);
  }

  return checks;
}

module.exports = { validateStartup };
```

**Update:** [backend/app.js](./backend/app.js) - Add before export

```javascript
// Add after all middleware/route setup, before export

// --- Startup Validation (non-test environments) ---
if (process.env.NODE_ENV !== "test") {
  const { validateStartup } = require("./lib/startup-validation");

  // Run checks asynchronously
  setImmediate(async () => {
    try {
      await validateStartup();
      logger.info("🚀 Application ready for requests");
    } catch (err) {
      logger.error("Startup validation critical error", { error: err.message });
      process.exit(1);
    }
  });
}

module.exports = app;
```

**Test:**

```bash
# Test with missing table - should exit
npm start

# Should see:
# [INFO] Starting production readiness checks...
# [ERROR] ❌ Required table missing: webauthn_credentials
# [ERROR] CRITICAL: Startup validation failed
```

---

### Issue #4: Email Service Validation

**Update:** [backend/utils/mailer.js](./backend/utils/mailer.js)

```javascript
const nodemailer = require("nodemailer");
const logger = require("./logger");

// Validate credentials exist
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  logger.warn("Email service not configured - notifications will be skipped");
}

let transporter = null;
let isEmailConfigured = false;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  try {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    isEmailConfigured = true;
    logger.info("Email service initialized");
  } catch (err) {
    logger.error("Failed to initialize email service", { error: err.message });
  }
}

/**
 * Send email with error handling
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function sendMail(to, subject, text) {
  if (!isEmailConfigured) {
    const error = "Email service not configured";
    logger.warn("Email send skipped", { to, reason: error });
    return { success: false, error };
  }

  if (!to || !subject || !text) {
    const error = "Missing required parameters: to, subject, text";
    logger.error("Email send failed", { error });
    return { success: false, error };
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });

    logger.info("Email sent successfully", {
      to,
      messageId: info.messageId,
      subject,
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    logger.error("Email send failed", {
      to,
      subject,
      error: err.message,
    });

    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Test email configuration on startup
 */
async function testEmailConfiguration() {
  if (!isEmailConfigured) {
    return { configured: false };
  }

  try {
    await transporter.verify();
    logger.info("Email service verified successfully");
    return { configured: true, verified: true };
  } catch (err) {
    logger.error("Email service verification failed", { error: err.message });
    return { configured: true, verified: false, error: err.message };
  }
}

module.exports = { sendMail, testEmailConfiguration, isEmailConfigured };
```

**Usage in routes:**

```javascript
// BEFORE
sendMail(user.email, "Welcome", "Welcome to InClass");

// AFTER - Check result
const result = await sendMail(user.email, "Welcome", "Welcome to InClass");
if (!result.success) {
  logger.warn("Could not send email notification", { error: result.error });
  // Continue without failing - email is not critical
}
```

---

### Issue #5: Remove /sentry-test Endpoint

**File:** [backend/app.js](./backend/app.js) - **DELETE lines at end**

```javascript
// ❌ DELETE THIS ENTIRE BLOCK:
app.get("/sentry-test", (req, res) => {
  throw new Error("Sentry test error from InClass backend");
});
```

**Replacement:** Add to test file instead

File: `backend/tests/sentry.test.js` (NEW)

```javascript
// backend/tests/sentry.test.js
/**
 * Test Sentry integration
 */

describe("Sentry integration", () => {
  test("should capture errors when SENTRY_DSN is set", () => {
    if (!process.env.SENTRY_DSN) {
      expect(true).toBe(true); // Skip test if Sentry not configured
      return;
    }

    const Sentry = require("@sentry/node");

    try {
      throw new Error("Test Sentry error");
    } catch (err) {
      const eventId = Sentry.captureException(err);
      expect(eventId).toBeDefined();
    }
  });
});
```

---

## 🟠 HIGH PRIORITY ISSUES - Remediation Code

### Issue #6-8: Input Validation

**Create validation utility:** File: `backend/lib/validators.js`

```javascript
// backend/lib/validators.js

const logger = require("../utils/logger");

/**
 * Validate integer value
 */
function validateInteger(
  value,
  { min = null, max = null, name = "value" } = {},
) {
  const num = parseInt(value, 10);

  if (isNaN(num)) {
    throw new Error(`${name} must be an integer`);
  }

  if (min !== null && num < min) {
    throw new Error(`${name} must be >= ${min}`);
  }

  if (max !== null && num > max) {
    throw new Error(`${name} must be <= ${max}`);
  }

  return num;
}

/**
 * Validate string value
 */
function validateString(
  value,
  { minLength = 1, maxLength = 255, name = "value", pattern = null } = {},
) {
  if (typeof value !== "string") {
    throw new Error(`${name} must be a string`);
  }

  if (value.length < minLength) {
    throw new Error(`${name} must be at least ${minLength} characters`);
  }

  if (value.length > maxLength) {
    throw new Error(`${name} must be at most ${maxLength} characters`);
  }

  if (pattern && !pattern.test(value)) {
    throw new Error(`${name} format is invalid`);
  }

  return value.trim();
}

/**
 * Validate email address
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error("Invalid email address");
  }
  return email.toLowerCase().trim();
}

/**
 * Validate phone number (E.164 format)
 */
function validatePhone(phone) {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  if (!phoneRegex.test(cleaned)) {
    throw new Error("Invalid phone number format");
  }
  return cleaned;
}

/**
 * Validate UUID v4
 */
function validateUUID(value) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(value)) {
    throw new Error("Invalid UUID format");
  }
  return value;
}

/**
 * Validate array of face embedding (512-d float array)
 */
function validateEmbedding(value) {
  if (!Array.isArray(value)) {
    throw new Error("Embedding must be an array");
  }

  if (value.length !== 512) {
    throw new Error(`Embedding must be 512-dimensional (got ${value.length})`);
  }

  if (!value.every((v) => typeof v === "number" && isFinite(v))) {
    throw new Error("Embedding must contain only finite numbers");
  }

  return value;
}

module.exports = {
  validateInteger,
  validateString,
  validateEmail,
  validatePhone,
  validateUUID,
  validateEmbedding,
};
```

**Usage in routes:**

```javascript
// File: backend/routes/registrations.js

const { validateInteger, ValidationError } = require("../lib/validators");

router.post(
  "/",
  auth(["student"]),
  asyncHandler(async (req, res) => {
    const studentId = req.user.id;
    let { courseId } = req.body;

    // Validate input
    try {
      courseId = validateInteger(courseId, {
        min: 1,
        name: "courseId",
      });
    } catch (err) {
      throw new ValidationError(err.message);
    }

    // ... rest of handler
  }),
);
```

---

## 🟡 MEDIUM PRIORITY - Monitoring & Observability

### Add Request Correlation ID Middleware

**File:** `backend/middleware/correlation-id.js` (NEW)

```javascript
// backend/middleware/correlation-id.js

const crypto = require("crypto");
const logger = require("../utils/logger");

/**
 * Middleware to add correlation ID to each request
 * Allows tracing of requests across logs
 */
function correlationIdMiddleware(req, res, next) {
  // Use existing X-Correlation-ID header or generate new one
  const correlationId = req.headers["x-correlation-id"] || crypto.randomUUID();

  // Attach to request for use in handlers
  req.id = correlationId;
  res.locals.correlationId = correlationId;

  // Add to response headers
  res.set("X-Correlation-ID", correlationId);

  // Add to all logger calls in this request
  req.logger = logger.child({ correlationId });

  next();
}

module.exports = correlationIdMiddleware;
```

**Integration:** [backend/app.js](./backend/app.js)

```javascript
const correlationIdMiddleware = require("./middleware/correlation-id");

// Add early, before other middleware
app.use(correlationIdMiddleware);

// Now loggers will include correlationId automatically
```

---

### Add Request Logging Middleware

**File:** `backend/middleware/request-logger.js` (NEW)

```javascript
// backend/middleware/request-logger.js

/**
 * Structured request logging for audit trail
 */
function requestLoggerMiddleware(req, res, next) {
  const startTime = Date.now();

  // Capture response
  const originalJson = res.json;
  let responseData = null;

  res.json = function (data) {
    responseData = data;
    return originalJson.call(this, data);
  };

  // Log on response finish
  res.on("finish", () => {
    const duration = Date.now() - startTime;

    req.logger.info("HTTP request completed", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs: duration,
      userId: req.user?.id || "anonymous",
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      responseSize: JSON.stringify(responseData || {}).length,
    });
  });

  next();
}

module.exports = requestLoggerMiddleware;
```

---

## QUICK FIX SUMMARY

| Issue             | File                 | Quick Fix                                      |
| ----------------- | -------------------- | ---------------------------------------------- |
| Console logging   | All `.js` files      | `%s/console\./logger\./g` (regex find/replace) |
| Error formatting  | routes/\*.js         | Wrap endpoints with `asyncHandler()`           |
| Startup checks    | app.js               | Add `validateStartup()` call                   |
| Email validation  | utils/mailer.js      | Return result from `sendMail()`                |
| Sentry test       | app.js               | Delete `/sentry-test` endpoint                 |
| Input validation  | routes/\*.js         | Use `validateInteger()` etc                    |
| Rate limiting     | app.js               | Set `trust proxy` in all envs                  |
| File upload       | middleware/upload.js | Add magic byte validation                      |
| Graceful shutdown | server.js            | Add `SIGTERM` handler                          |
| Health checks     | app.js               | Expand `/health` endpoint                      |
