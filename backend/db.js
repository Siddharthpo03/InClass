// inclass-backend/db.js

const { Pool } = require("pg");
require("dotenv").config();

// Enable SSL on cloud hosts (e.g., Render) or if explicitly requested via env
const isRender = !!process.env.RENDER;
const shouldEnableSsl =
  process.env.PGSSLMODE === "require" ||
  process.env.DATABASE_SSL === "true" ||
  isRender;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: shouldEnableSsl ? { rejectUnauthorized: false } : false,
});

// ✅ Optional: test the connection once when backend starts
pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL successfully"))
  .catch((err) => console.error("❌ Database connection failed:", err.message));

module.exports = pool;
