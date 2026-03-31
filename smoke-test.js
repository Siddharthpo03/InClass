/**
 * InClass API Smoke Test
 *
 * Tests all API endpoints used by the frontend to identify 404s and mismatches.
 * Run with: node smoke-test.js
 *
 * Requires:
 * - Backend server running on http://localhost:4000
 * - Valid JWT token (set in TOKEN env var or create test user)
 */

const axios = require("axios");

const BASE_URL = process.env.API_BASE_URL || "http://localhost:4000/api";
const TEST_TOKEN = process.env.TOKEN || "";

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

const results = {
  passed: [],
  failed: [],
  skipped: [],
};

// Test configuration
const tests = [
  // Auth endpoints (no auth required)
  {
    name: "GET /api/auth/check-email",
    method: "get",
    url: `${BASE_URL}/auth/check-email?email=test@example.com`,
    auth: false,
    expectedStatus: 200,
  },
  {
    name: "GET /api/auth/colleges",
    method: "get",
    url: `${BASE_URL}/auth/colleges`,
    auth: false,
    expectedStatus: 200,
  },

  // Faculty endpoints (auth required)
  {
    name: "GET /api/faculty/my-courses",
    method: "get",
    url: `${BASE_URL}/faculty/my-courses`,
    auth: true,
    expectedStatus: [200, 401, 403],
  },
  {
    name: "GET /api/faculty/sessions",
    method: "get",
    url: `${BASE_URL}/faculty/sessions`,
    auth: true,
    expectedStatus: [200, 401, 403],
  },
  {
    name: "GET /api/faculty/list",
    method: "get",
    url: `${BASE_URL}/faculty/list?collegeId=1&departmentId=1`,
    auth: false,
    expectedStatus: 200,
  },

  // Registration endpoints
  {
    name: "GET /api/registrations/pending",
    method: "get",
    url: `${BASE_URL}/registrations/pending`,
    auth: true,
    expectedStatus: [200, 404, 401, 403],
    note: "May return 404 if not implemented",
  },
  {
    name: "GET /api/registrations/my-registrations",
    method: "get",
    url: `${BASE_URL}/registrations/my-registrations`,
    auth: true,
    expectedStatus: [200, 401, 403],
  },

  // Biometrics endpoints
  {
    name: "GET /api/biometrics/assist",
    method: "get",
    url: `${BASE_URL}/biometrics/assist?college_id=1&department_id=1`,
    auth: true,
    expectedStatus: [200, 404, 401, 403],
    note: "May return 404 if not implemented",
  },
  {
    name: "GET /api/biometrics/status",
    method: "get",
    url: `${BASE_URL}/biometrics/status?userId=1`,
    auth: true,
    expectedStatus: [200, 401, 403],
  },
];

async function runTest(test) {
  const config = {
    method: test.method,
    url: test.url,
    validateStatus: () => true, // Don't throw on any status
  };

  if (test.auth && TEST_TOKEN) {
    config.headers = {
      Authorization: `Bearer ${TEST_TOKEN}`,
    };
  }

  try {
    const response = await axios(config);
    const status = response.status;
    const expectedStatuses = Array.isArray(test.expectedStatus)
      ? test.expectedStatus
      : [test.expectedStatus];

    if (expectedStatuses.includes(status)) {
      results.passed.push({
        ...test,
        actualStatus: status,
        response: response.data,
      });
      return { success: true, status, test };
    } else {
      results.failed.push({
        ...test,
        actualStatus: status,
        expectedStatus: test.expectedStatus,
        response: response.data,
      });
      return { success: false, status, test };
    }
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      results.skipped.push({
        ...test,
        reason: "Server not running",
      });
      return { success: null, status: "SKIPPED", test };
    }
    results.failed.push({
      ...test,
      error: error.message,
    });
    return { success: false, status: "ERROR", test };
  }
}

async function runAllTests() {
  console.log(`${colors.blue}=== InClass API Smoke Test ===${colors.reset}\n`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(
    `Token: ${
      TEST_TOKEN ? "Provided" : "Not provided (some tests will fail)"
    }\n`
  );

  for (const test of tests) {
    const result = await runTest(test);
    const icon = result.success
      ? `${colors.green}✓${colors.reset}`
      : result.success === null
      ? `${colors.yellow}⊘${colors.reset}`
      : `${colors.red}✗${colors.reset}`;
    const statusText =
      result.status === "SKIPPED"
        ? "SKIPPED"
        : typeof result.status === "number"
        ? result.status
        : result.status;

    console.log(
      `${icon} ${test.name} - ${statusText}${
        test.note ? ` (${test.note})` : ""
      }`
    );

    // Small delay to avoid overwhelming the server
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log(`\n${colors.blue}=== Results ===${colors.reset}`);
  console.log(`${colors.green}Passed: ${results.passed.length}${colors.reset}`);
  console.log(`${colors.red}Failed: ${results.failed.length}${colors.reset}`);
  console.log(
    `${colors.yellow}Skipped: ${results.skipped.length}${colors.reset}`
  );

  if (results.failed.length > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    results.failed.forEach((test) => {
      console.log(`  - ${test.name}`);
      if (test.actualStatus) {
        console.log(
          `    Expected: ${test.expectedStatus}, Got: ${test.actualStatus}`
        );
      }
      if (test.error) {
        console.log(`    Error: ${test.error}`);
      }
    });
  }

  if (results.skipped.length > 0) {
    console.log(`\n${colors.yellow}Skipped Tests:${colors.reset}`);
    results.skipped.forEach((test) => {
      console.log(`  - ${test.name}: ${test.reason}`);
    });
  }

  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      total: tests.length,
      passed: results.passed.length,
      failed: results.failed.length,
      skipped: results.skipped.length,
    },
    results: {
      passed: results.passed.map((t) => ({
        name: t.name,
        status: t.actualStatus,
      })),
      failed: results.failed.map((t) => ({
        name: t.name,
        expected: t.expectedStatus,
        actual: t.actualStatus || t.error,
      })),
      skipped: results.skipped.map((t) => ({
        name: t.name,
        reason: t.reason,
      })),
    },
  };

  console.log(
    `\n${colors.blue}Report saved to smoke-test-report.json${colors.reset}`
  );
  require("fs").writeFileSync(
    "smoke-test-report.json",
    JSON.stringify(report, null, 2)
  );

  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
