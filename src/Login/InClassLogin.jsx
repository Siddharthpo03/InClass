import React, { useState, useEffect } from "react";
import "./InClassLogin.css";
import { useNavigate } from "react-router-dom";
// import AuthInput from "../../components/AuthInput"; // Assuming a separate component for input

// For abstraction, we'll keep the input logic inline for now, but use a helper component pattern.

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

  // Form State - unified for easier handling
  const [formData, setFormData] = useState({ username: "", password: "" });

  // UI State
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});
  const [loginMessage, setLoginMessage] = useState("");

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear the message and relevant error on change
    setLoginMessage("");
    setValidationErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  // Effect to manage button disability
  useEffect(() => {
    setIsButtonDisabled(!formData.username.trim() || !formData.password.trim());
  }, [formData]);

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

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      // In a real application, replace this with an API call.
      setLoginMessage("✅ Logged in successfully!");
      console.log("Attempting login with:", formData);
    } else {
      setLoginMessage("❌ Please correct the errors above.");
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-wrapper">
        <form id="loginForm" noValidate onSubmit={handleSubmit}>
          <h1>Login</h1>

          {/* Display login message */}
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

          <AuthInput
            name="username"
            type="text"
            placeholder="Username"
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
            <a href="/forgot-password" target="_blank">
              Forgot Password
            </a>
          </div>

          <button type="submit" className="button" disabled={isButtonDisabled}>
            Login
          </button>

          <div className="register-link">
            <p>
              Don't have an account?{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/register");
                }}
              >
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
