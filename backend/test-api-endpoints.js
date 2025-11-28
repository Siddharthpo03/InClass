// Test the colleges and departments API endpoints
const express = require("express");
const authRoutes = require("./routes/auth");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);

const PORT = 5555; // Temporary test port

const server = app.listen(PORT, async () => {
  console.log(`\n🧪 Test server running on http://localhost:${PORT}\n`);

  try {
    // Test colleges endpoint
    console.log("Testing GET /api/auth/colleges...");
    const collegesResponse = await fetch(
      `http://localhost:${PORT}/api/auth/colleges`
    );
    const collegesData = await collegesResponse.json();
    console.log(`✅ Colleges endpoint status: ${collegesResponse.status}`);
    console.log(`   Found ${collegesData.colleges?.length || 0} colleges`);
    if (collegesData.colleges?.length > 0) {
      console.log(`   First college: ${collegesData.colleges[0].name}`);
    }

    // Test colleges with search
    console.log("\nTesting GET /api/auth/colleges?search=MIT...");
    const searchResponse = await fetch(
      `http://localhost:${PORT}/api/auth/colleges?search=MIT`
    );
    const searchData = await searchResponse.json();
    console.log(`✅ Search endpoint status: ${searchResponse.status}`);
    console.log(
      `   Found ${searchData.colleges?.length || 0} colleges matching "MIT"`
    );

    // Test departments endpoint
    console.log("\nTesting GET /api/auth/departments...");
    const deptResponse = await fetch(
      `http://localhost:${PORT}/api/auth/departments`
    );
    const deptData = await deptResponse.json();
    console.log(`✅ Departments endpoint status: ${deptResponse.status}`);
    console.log(`   Found ${deptData.departments?.length || 0} departments`);
    if (deptData.departments?.length > 0) {
      console.log(`   First department: ${deptData.departments[0].name}`);
    }

    console.log("\n✅ All API endpoint tests passed!\n");
  } catch (error) {
    console.error("\n❌ Error testing endpoints:", error.message);
  } finally {
    server.close(() => {
      console.log("Test server closed.");
      process.exit(0);
    });
  }
});
