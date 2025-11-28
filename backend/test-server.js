// Simple server test script
// Run with: node test-server.js

const http = require("http");

const PORT = process.env.PORT || 4000;
const BASE_URL = `http://localhost:${PORT}`;

// Test colors for console
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(path, method = "GET", data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      options.headers["Authorization"] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runTests() {
  log("\n🧪 Starting Backend Tests...\n", "blue");

  // Test 1: Server Health Check
  log("Test 1: Server Health Check", "yellow");
  try {
    const response = await makeRequest("/health");
    if (response.status === 200) {
      log("✅ Server is running and healthy", "green");
    } else {
      log(`❌ Server returned status ${response.status}`, "red");
    }
  } catch (error) {
    log(`❌ Server is not running: ${error.message}`, "red");
    log("\n💡 Make sure to start the server first:", "yellow");
    log("   cd backend && npm start", "yellow");
    return;
  }

  // Test 2: Root Endpoint
  log("\nTest 2: Root Endpoint", "yellow");
  try {
    const response = await makeRequest("/");
    if (response.status === 200) {
      log("✅ Root endpoint working", "green");
      log(`   Response: ${response.body}`, "blue");
    } else {
      log(`❌ Root endpoint returned status ${response.status}`, "red");
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, "red");
  }

  // Test 3: User Registration
  log("\nTest 3: User Registration", "yellow");
  try {
    const testUser = {
      name: "Test User",
      email: `test${Date.now()}@example.com`,
      password: "Test123!@#",
      role: "student",
      roll_no: `TEST${Date.now()}`,
    };

    const response = await makeRequest("/api/auth/register", "POST", testUser);
    if (response.status === 201) {
      log("✅ User registration successful", "green");
      log(`   User ID: ${response.body.user?.id}`, "blue");
      const token = response.body.token;
      
      // Test 4: User Login
      log("\nTest 4: User Login", "yellow");
      try {
        const loginResponse = await makeRequest("/api/auth/login", "POST", {
          email: testUser.email,
          password: testUser.password,
          role: "student",
        });
        
        if (loginResponse.status === 200) {
          log("✅ User login successful", "green");
          const loginToken = loginResponse.body.token;
          
          // Test 5: Get User Profile
          log("\nTest 5: Get User Profile", "yellow");
          try {
            const profileResponse = await makeRequest("/api/auth/profile", "GET", null, loginToken);
            if (profileResponse.status === 200) {
              log("✅ Profile retrieval successful", "green");
              log(`   Name: ${profileResponse.body.name}`, "blue");
              log(`   Role: ${profileResponse.body.role}`, "blue");
            } else {
              log(`❌ Profile returned status ${profileResponse.status}`, "red");
              log(`   Error: ${JSON.stringify(profileResponse.body)}`, "red");
            }
          } catch (error) {
            log(`❌ Profile error: ${error.message}`, "red");
          }
        } else {
          log(`❌ Login returned status ${loginResponse.status}`, "red");
          log(`   Error: ${JSON.stringify(loginResponse.body)}`, "red");
        }
      } catch (error) {
        log(`❌ Login error: ${error.message}`, "red");
      }
    } else {
      log(`❌ Registration returned status ${response.status}`, "red");
      log(`   Error: ${JSON.stringify(response.body)}`, "red");
    }
  } catch (error) {
    log(`❌ Registration error: ${error.message}`, "red");
  }

  // Test 6: Invalid Endpoint
  log("\nTest 6: Invalid Endpoint (Error Handling)", "yellow");
  try {
    const response = await makeRequest("/api/invalid/endpoint");
    if (response.status === 404) {
      log("✅ Error handling working (404 for invalid endpoint)", "green");
    } else {
      log(`⚠️  Expected 404, got ${response.status}`, "yellow");
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, "red");
  }

  // Test 7: Face Recognition Status
  log("\nTest 7: Face Recognition Status (requires auth)", "yellow");
  try {
    // First login to get token
    const loginResponse = await makeRequest("/api/auth/login", "POST", {
      email: `test${Date.now()}@example.com`,
      password: "Test123!@#",
      role: "student",
    });
    
    if (loginResponse.status === 200) {
      const token = loginResponse.body.token;
      const faceStatusResponse = await makeRequest("/api/face/status", "GET", null, token);
      if (faceStatusResponse.status === 200) {
        log("✅ Face recognition status endpoint working", "green");
        log(`   Enrolled: ${faceStatusResponse.body.enrolled}`, "blue");
        log(`   Models Loaded: ${faceStatusResponse.body.modelsLoaded}`, "blue");
      } else {
        log(`⚠️  Face status returned ${faceStatusResponse.status}`, "yellow");
      }
    } else {
      log("⚠️  Skipping face status test (login failed)", "yellow");
    }
  } catch (error) {
    log(`⚠️  Face status test skipped: ${error.message}`, "yellow");
  }

  log("\n✨ Basic Tests Complete!\n", "blue");
  log("📝 For comprehensive testing, see TESTING_GUIDE.md", "yellow");
  log("📝 To test with Postman/Insomnia, use the endpoints listed in TESTING_GUIDE.md\n", "yellow");
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Test suite error: ${error.message}`, "red");
  process.exit(1);
});

