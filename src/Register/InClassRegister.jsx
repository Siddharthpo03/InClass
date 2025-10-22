import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./InClassRegister.css";

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

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear relevant error on change for better UX
    setValidationErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setRegisterMessage("");
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setDropdownOpen(false);
    // Clear specific ID field and its error if role changes
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Memoized function to determine required fields
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

  // Effect to manage button disability
  useEffect(() => {
    const requiredFields = getRequiredFields();

    // Check if ALL fields (including conditional IDs) are non-empty
    const allRequiredFieldsFilled = requiredFields.every(
      (field) => formData[field] && formData[field].trim() !== ""
    );

    // Button is disabled if role isn't selected OR not all required fields are filled
    setIsButtonDisabled(!role || !allRequiredFieldsFilled);
  }, [formData, role, getRequiredFields]);

  const validateForm = () => {
    let isValid = true;
    let errors = {};
    const requiredFields = getRequiredFields();

    // 1. Validate role selection
    if (!role) {
      errors.role = "⚠ Please select a role";
      isValid = false;
    }

    // 2. Validate all required fields
    requiredFields.forEach((field) => {
      if (!formData[field].trim()) {
        // Use more specific messages for conditional fields
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // API call logic here.
      setRegisterMessage("✅ Registration successful!");
      console.log("Registered with:", { ...formData, role });
      // navigate('/login');
    } else {
      setRegisterMessage("❌ Please correct the errors above.");
    }
  };

  return (
    <div className="register-page-wrapper">
      <div className="register-wrapper">
        <form id="registerForm" noValidate onSubmit={handleSubmit}>
          <h1>Register</h1>

          {/* Display registration message */}
          {registerMessage && (
            <div
              style={{
                color: registerMessage.startsWith("✅") ? "green" : "red",
                marginBottom: "15px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {registerMessage}
            </div>
          )}

          {/* Dropdown Role */}
          <div
            className={`dropdown ${validationErrors.role ? "input-error" : ""}`}
            ref={dropdownRef}
          >
            <div
              className="dropdown-selected"
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              {role || "Select Role"}{" "}
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
            <span className="error-message">{validationErrors.role}</span>
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
          <button type="submit" className="button" disabled={isButtonDisabled}>
            Register
          </button>

          {/* Login link */}
          <div className="register-link">
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
    </div>
  );
};

export default InClassRegister;
