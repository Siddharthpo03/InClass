// Quick test script for email check endpoint
const pool = require("./db");
require("dotenv").config();

async function testEmailCheck() {
  try {
    // Test with a sample email (replace with actual admin email)
    const testEmail = process.argv[2] || "admin@test.com";
    
    const result = await pool.query(
      "SELECT role FROM users WHERE email = $1",
      [testEmail]
    );

    if (result.rowCount === 0) {
      console.log(`❌ Email ${testEmail} not found in database`);
      console.log("\nTo create an admin account, run:");
      console.log(`npm run create-admin "Admin Name" "${testEmail}" "password123"`);
    } else {
      console.log(`✅ Email ${testEmail} found!`);
      console.log(`   Role: ${result.rows[0].role}`);
      if (result.rows[0].role === "admin") {
        console.log("   ✓ This is an admin account");
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testEmailCheck();

