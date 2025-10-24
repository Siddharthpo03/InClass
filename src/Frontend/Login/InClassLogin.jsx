import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./InClassLogin.css";

// Reusable Input Component
const AuthInput = ({
  name,
  type,
  placeholder,
  value,
  onChange,
  error,
  iconClass,
}) => (
  <div className="input-box">
    <input
      type={type}
      placeholder={placeholder}
      name={name}
      value={value}
      onChange={onChange}
      className={error ? "input-error" : ""}
      required
    />
    <i className={`bx ${iconClass}`} />
    <span className="error-message">{error}</span>
  </div>
);

const InClassLogin = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});
  const [loginMessage, setLoginMessage] = useState("");

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setLoginMessage("");
    setValidationErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setDropdownOpen(false);
    setValidationErrors((prev) => ({ ...prev, role: "" }));
    setLoginMessage("");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsButtonDisabled(
      !formData.username.trim() || !formData.password.trim() || !role
    );
  }, [formData, role]);

  const validateForm = () => {
    let isValid = true;
    let errors = {};

    if (!formData.username.trim()) {
      errors.username = "⚠ Username is required";
      isValid = false;
    }
    if (!formData.password.trim()) {
      errors.password = "⚠ Password is required";
      isValid = false;
    }
    if (!role) {
      errors.role = "⚠ Please select a role.";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setLoginMessage("❌ Please correct the errors above.");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:4000/api/auth/login",
        {
          email: formData.username,
          password: formData.password,
          role: role.toLowerCase(),
        }
      );

      const { token, role: userRole } = response.data;
      localStorage.setItem("inclass_token", token);
      localStorage.setItem("user_role", userRole);

      setLoginMessage("✅ Logged in successfully! Redirecting...");

      // 🚨 CRITICAL FIX: Determine path and use it immediately 🚨
      let targetPath = "/"; // Fallback to homepage

      if (userRole === "student") {
        targetPath = "/student/dashboard";
      } else if (userRole === "faculty") {
        targetPath = "/faculty/dashboard";
      } else if (userRole === "admin") {
        targetPath = "/admin/dashboard";
      }

      setTimeout(() => navigate(targetPath), 1000); // Navigate using the confirmed path
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Login failed due to network error.";
      setLoginMessage(`❌ ${errorMessage}`);
      console.error("Login Error:", error.response || error);
    }
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    navigate("/register");
  };

  const handleForgotPasswordClick = (e) => {
    e.preventDefault();
    navigate("/forgot");
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-wrapper">
        <form id="loginForm" noValidate onSubmit={handleSubmit}>
          <h1>Login</h1>

          {loginMessage && (
            <div
              style={{
                color: loginMessage.startsWith("✅") ? "green" : "red",
                marginBottom: "15px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {loginMessage}
            </div>
          )}

          <div
            className={`dropdown ${validationErrors.role ? "input-error" : ""}`}
            ref={dropdownRef}
          >
            <div
              className="dropdown-selected"
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              {role || "Select Role"}
              <span className={`arrow ${dropdownOpen ? "rotate" : ""}`}>▼</span>
            </div>

            <ul className={`dropdown-menu ${dropdownOpen ? "show" : ""}`}>
              {["Admin", "Student", "Faculty"].map((r) => (
                <li
                  key={r}
                  className="dropdown-item"
                  onClick={() => handleRoleSelect(r)}
                >
                  {r}
                </li>
              ))}
            </ul>

            {validationErrors.role && (
              <span className="error-message">{validationErrors.role}</span>
            )}
          </div>

          <AuthInput
            name="username"
            type="text"
            placeholder="Email (Used as Username for login)"
            value={formData.username}
            onChange={handleFormChange}
            error={validationErrors.username}
            iconClass="bxs-user"
          />

          <AuthInput
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleFormChange}
            error={validationErrors.password}
            iconClass="bxs-lock-alt"
          />

          <div className="remember-forgot">
            <label>
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" onClick={handleForgotPasswordClick}>
              Forgot Password
            </a>
          </div>

          <button type="submit" className="button" disabled={isButtonDisabled}>
            Login
          </button>

          <div className="register-link">
            <p>
              Don't have an account?{" "}
              <a href="#" onClick={handleRegisterClick}>
                Register
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InClassLogin;
