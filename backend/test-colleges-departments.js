// Test script to check colleges and departments in database
const pool = require("./db");

async function testCollegesAndDepartments() {
  try {
    console.log("\n🔍 Checking Colleges and Departments in Database...\n");

    // Test colleges
    const collegesResult = await pool.query(
      "SELECT COUNT(*) as count FROM colleges WHERE is_active = true"
    );
    console.log(`✅ Active Colleges: ${collegesResult.rows[0].count}`);

    if (parseInt(collegesResult.rows[0].count) === 0) {
      console.log("❌ No colleges found! Database might not be populated.");
    } else {
      const sampleColleges = await pool.query(
        "SELECT id, name, city, state, country FROM colleges WHERE is_active = true LIMIT 5"
      );
      console.log("\n📚 Sample Colleges:");
      sampleColleges.rows.forEach((college) => {
        console.log(
          `   - ${college.name} (${college.city}, ${college.state}, ${college.country})`
        );
      });
    }

    // Test departments
    const departmentsResult = await pool.query(
      "SELECT COUNT(*) as count FROM departments WHERE is_active = true"
    );
    console.log(`\n✅ Active Departments: ${departmentsResult.rows[0].count}`);

    if (parseInt(departmentsResult.rows[0].count) === 0) {
      console.log("❌ No departments found! Database might not be populated.");
    } else {
      const sampleDepartments = await pool.query(
        "SELECT id, name, code FROM departments WHERE is_active = true LIMIT 5"
      );
      console.log("\n📖 Sample Departments:");
      sampleDepartments.rows.forEach((dept) => {
        console.log(`   - ${dept.name} (${dept.code})`);
      });
    }

    // Check if tables exist
    const tablesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('colleges', 'departments')
      ORDER BY table_name
    `);
    console.log(
      "\n📋 Tables found:",
      tablesCheck.rows.map((r) => r.table_name).join(", ")
    );

    console.log("\n✅ Database check complete!\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error checking database:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

testCollegesAndDepartments();
