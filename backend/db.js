// inclass-backend/db.js

const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ✅ Optional: test the connection once when backend starts
pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL successfully"))
  .catch((err) => console.error("❌ Database connection failed:", err.message));

module.exports = pool;
