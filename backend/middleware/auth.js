// inclass-backend/middleware/auth.js

const jwt = require("jsonwebtoken");
require("dotenv").config();

// The middleware function that checks for a token and validates roles
function auth(requiredRoles = []) {
  return (req, res, next) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ message: "Missing token" });

    // Format: "Bearer <TOKEN>"
    const token = header.split(" ")[1];

    try {
      // JWT_SECRET is loaded from the .env file
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach decoded user payload to request
      req.user = decoded;

      // Role-based access control
      if (requiredRoles.length && !requiredRoles.includes(decoded.role)) {
        return res
          .status(403)
          .json({ message: "Forbidden: Insufficient role permissions." });
      }

      next();
    } catch (err) {
      res.status(401).json({ message: "Invalid or expired token." });
    }
  };
}

module.exports = auth;
