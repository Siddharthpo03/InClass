import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import Footer from "../../components/Footer";
import styles from "./InClassRegister.module.css";

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

// Reusable Input Component (Abstraction)
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

const InClassRegister = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    collegeName: "",
    department: "",
    studentId: "",
    facultyId: "",
  });

  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});
  const [registerMessage, setRegisterMessage] = useState("");

  // Force light mode on register page for better visibility
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
    setValidationErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setRegisterMessage("");
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setDropdownOpen(false);
    setFormData((prev) => ({
      ...prev,
      studentId: "",
      facultyId: "",
    }));
    setValidationErrors((prev) => ({
      ...prev,
      role: "",
      studentId: "",
      facultyId: "",
    }));
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

  const getRequiredFields = useCallback(() => {
    let fields = ["fullName", "email", "password"];
    if (role !== "Admin") {
      fields.push("collegeName", "department");
    }
    if (role === "Student") {
      fields.push("studentId");
    } else if (role === "Faculty") {
      fields.push("facultyId");
    }
    return fields;
  }, [role]);

  useEffect(() => {
    const requiredFields = getRequiredFields();
    const allRequiredFieldsFilled = requiredFields.every(
      (field) => formData[field] && formData[field].trim() !== ""
    );
    setIsButtonDisabled(!role || !allRequiredFieldsFilled);
  }, [formData, role, getRequiredFields]);

  const validateForm = () => {
    let isValid = true;
    let errors = {};
    const requiredFields = getRequiredFields();

    if (!role) {
      errors.role = "⚠ Please select a role";
      isValid = false;
    }

    requiredFields.forEach((field) => {
      if (!formData[field].trim()) {
        if (field === "studentId")
          errors.studentId = "⚠ Student ID is required";
        else if (field === "facultyId")
          errors.facultyId = "⚠ Faculty ID is required";
        else errors[field] = "⚠ Please fill out this field";
        isValid = false;
      }
    });

    setValidationErrors(errors);
    return isValid;
  };

  // 🚨 UPDATED: Handle registration via API call 🚨
  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegisterMessage("");

    if (!validateForm()) {
      setRegisterMessage("❌ Please correct the errors above.");
      return;
    }

    // Determine the unique roll_no based on the role selected
    let roll_no = null;
    if (role === "Student") {
      roll_no = formData.studentId;
    } else if (role === "Faculty") {
      roll_no = formData.facultyId;
    }

    // Prepare the payload for the backend API
    const registrationPayload = {
      name: formData.fullName,
      email: formData.email,
      password: formData.password,
      role: role.toLowerCase(), // Backend expects lowercase
      roll_no: roll_no,
      // The backend User model currently does not handle collegeName/department,
      // but we keep them here in case the backend is updated later:
      collegeName: formData.collegeName,
      department: formData.department,
    };

    try {
      const response = await apiClient.post("/auth/register", registrationPayload);

      // Handle successful registration (HTTP 201)
      setRegisterMessage(`✅ Success! Redirecting to login.`);
      console.log("Registration API Success:", response.data);

      // Redirect to Login page after a delay
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      // Handle API error messages (e.g., email already exists)
      const errorMessage =
        error.response?.data?.message ||
        (error.response?.status === 500
          ? "Server crashed. Check backend console."
          : "Registration failed. Please try again.");

      setRegisterMessage(`Registration failed: ${errorMessage}`);
      console.error("Registration API Error:", error.response || error.message);
    }
  };

  return (
    <div className={styles.registerPageWrapper}>
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
      <div className={styles.registerWrapper}>
        <form id="registerForm" noValidate onSubmit={handleSubmit}>
          <h1>Register</h1>

          {/* Display registration message */}
          {registerMessage && (
            <div
              style={{
                color: registerMessage.startsWith("✅") ? "#10b981" : "#ef4444",
                marginBottom: "15px",
                textAlign: "center",
                fontWeight: 600,
                padding: "10px",
                borderRadius: "8px",
                backgroundColor: registerMessage.startsWith("✅") 
                  ? "rgba(16, 185, 129, 0.1)" 
                  : "rgba(239, 68, 68, 0.1)",
              }}
            >
              {registerMessage}
            </div>
          )}

          {/* Dropdown Role */}
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
              {role || "Select Role"}{" "}
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
            name="fullName"
            type="text"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleFormChange}
            error={validationErrors.fullName}
            iconClass="bxs-user"
          />

          <AuthInput
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleFormChange}
            error={validationErrors.email}
            iconClass="bxs-envelope"
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

          {/* Conditional Fields: COLLEGE NAME and DEPARTMENT */}
          {role !== "Admin" && (
            <>
              <AuthInput
                name="collegeName"
                type="text"
                placeholder="College Name"
                value={formData.collegeName}
                onChange={handleFormChange}
                error={validationErrors.collegeName}
                iconClass="bxs-bank"
              />

              <AuthInput
                name="department"
                type="text"
                placeholder="Department"
                value={formData.department}
                onChange={handleFormChange}
                error={validationErrors.department}
                iconClass="bxs-graduation"
              />
            </>
          )}

          {/* Conditional ID Field: STUDENT */}
          {role === "Student" && (
            <AuthInput
              name="studentId"
              type="text"
              placeholder="Student ID (e.g., STU12345)"
              value={formData.studentId}
              onChange={handleFormChange}
              error={validationErrors.studentId}
              iconClass="bxs-id-card"
            />
          )}

          {/* Conditional ID Field: FACULTY */}
          {role === "Faculty" && (
            <AuthInput
              name="facultyId"
              type="text"
              placeholder="Faculty ID (e.g., FAC67890)"
              value={formData.facultyId}
              onChange={handleFormChange}
              error={validationErrors.facultyId}
              iconClass="bxs-hard-hat"
            />
          )}

          {/* Submit */}
          <button type="submit" className={styles.button} disabled={isButtonDisabled}>
            Register
          </button>

          {/* Login link */}
          <div className={styles.registerLink}>
            <p>
              Already have an account?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/login");
                }}
              >
                Login
              </a>
            </p>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default InClassRegister;
