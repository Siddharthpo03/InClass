import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import Footer from "../../components/Footer";
import styles from "./InClassLogin.module.css";

// Helper function for classNames
const classNames = (...classes) => {
  return classes
    .filter(Boolean)
    .map((cls) => {
      if (typeof cls === "string") {
        // Convert kebab-case to camelCase for CSS modules
        const camelCase = cls.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        return styles[camelCase] || styles[cls] || cls;
      }
      // If it's a boolean or other type, return as is (will be filtered out)
      return null;
    })
    .filter(Boolean)
    .join(" ");
};

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
  <div className={styles.inputBox}>
    <input
      type={type}
      placeholder={placeholder}
      name={name}
      value={value}
      onChange={onChange}
      className={error ? styles.inputError : ""}
      required
    />
    <i className={`bx ${iconClass}`} />
    {error && <span className={styles.errorMessage}>{error}</span>}
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

  // Initialize dark mode from localStorage on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    const shouldBeDark = savedDarkMode !== null 
      ? savedDarkMode === "true" 
      : prefersDark;
    
    if (shouldBeDark) {
      document.body.classList.add("darkMode");
    } else {
      document.body.classList.remove("darkMode");
    }
  }, []);

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
      const response = await apiClient.post("/auth/login", {
        email: formData.username,
        password: formData.password,
        role: role.toLowerCase(),
      });

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
    <div className={styles.loginPageWrapper}>
      <a
        href="#"
        className={styles.reportButton}
        onClick={(e) => {
          e.preventDefault();
          navigate("/report");
        }}
        title="Report an Issue"
      >
        Report
      </a>
      <div className={styles.loginWrapper}>
        <form id="loginForm" noValidate onSubmit={handleSubmit}>
          <h1>Login</h1>

          {loginMessage && (
            <div
              style={{
                color: loginMessage.startsWith("✅") ? "#10b981" : "#ef4444",
                marginBottom: "15px",
                textAlign: "center",
                fontWeight: 600,
                padding: "10px",
                borderRadius: "8px",
                backgroundColor: loginMessage.startsWith("✅") 
                  ? "rgba(16, 185, 129, 0.1)" 
                  : "rgba(239, 68, 68, 0.1)",
              }}
            >
              {loginMessage}
            </div>
          )}

          <div
            className={classNames(
              styles.dropdown,
              validationErrors.role ? styles.inputError : ""
            )}
            ref={dropdownRef}
          >
            <div
              className={styles.dropdownSelected}
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              {role || "Select Role"}
              <span className={classNames(styles.arrow, dropdownOpen ? styles.rotate : "")}>▼</span>
            </div>

            <ul className={classNames(styles.dropdownMenu, dropdownOpen ? styles.show : "")}>
              {["Admin", "Student", "Faculty"].map((r) => (
                <li
                  key={r}
                  className={styles.dropdownItem}
                  onClick={() => handleRoleSelect(r)}
                >
                  {r}
                </li>
              ))}
            </ul>

            {validationErrors.role && (
              <span className={styles.errorMessage}>{validationErrors.role}</span>
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

          <div className={styles.rememberForgot}>
            <label>
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" onClick={handleForgotPasswordClick}>
              Forgot Password
            </a>
          </div>

          <button type="submit" className={styles.button} disabled={isButtonDisabled}>
            Login
          </button>

          <div className={styles.registerLink}>
            <p>
              Don't have an account?{" "}
              <a href="#" onClick={handleRegisterClick}>
                Register
              </a>
            </p>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default InClassLogin;
