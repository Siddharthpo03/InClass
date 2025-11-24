import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // 🚨 NEW IMPORT 🚨
import styles from "./InClassRegister.module.css";

const classNames = (...classes) =>
  classes
    .flat()
    .filter(Boolean)
    .map((cls) => styles[cls] || cls)
    .join(" ")
    .trim();

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
  <div className={classNames("input-box")}>
    <input
      type={type}
      placeholder={placeholder}
      name={name}
      value={value}
      onChange={onChange}
      className={classNames(error && "input-error")}
      required
    />
    <i className={classNames("bx", iconClass)} />
    <span className={classNames("error-message")}>{error}</span>
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
      const response = await axios.post(
        "http://localhost:4000/api/auth/register",
        registrationPayload
      );

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
    <div className={classNames("register-page-wrapper")}>
      <div className={classNames("register-wrapper")}>
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
            className={classNames(
              "dropdown",
              validationErrors.role && "input-error"
            )}
            ref={dropdownRef}
          >
            <div
              className={classNames("dropdown-selected")}
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              {role || "Select Role"}{" "}
              <span
                className={classNames("arrow", dropdownOpen && "rotate")}
              >
                ▼
              </span>
            </div>
            <ul
              className={classNames("dropdown-menu", dropdownOpen && "show")}
            >
              {["Admin", "Student", "Faculty"].map((r) => (
                <li
                  key={r}
                  className={classNames("dropdown-item")}
                  onClick={() => handleRoleSelect(r)}
                >
                  {r}
                </li>
              ))}
            </ul>
            <span className={classNames("error-message")}>{validationErrors.role}</span>
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
          <button type="submit" className={classNames("button")} disabled={isButtonDisabled}>
            Register
          </button>

          {/* Login link */}
          <div className={classNames("register-link")}>
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
