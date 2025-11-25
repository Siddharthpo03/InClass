import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import "./InClassForgotPass.css";

const InClassForgotPass = () => {
  const navigate = useNavigate();

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
  const [email, setEmail] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [step, setStep] = useState(1); // 1: Email Input, 2: Confirmation Message

  const classNames = (...classes) =>
    classes
      .flat()
      .filter(Boolean)
      .map((cls) => styles[cls] || cls)
      .join(" ")
      .trim();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setResetMessage("");
    setIsButtonDisabled(!e.target.value.trim());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setResetMessage("");
    setIsButtonDisabled(true);

    if (!email.trim()) {
      setResetMessage("❌ Please enter your registered email address.");
      setIsButtonDisabled(false);
      return;
    }

    // --- Simulated API Call ---
    setResetMessage(`✅ Instructions sent to ${email}. Check your inbox!`);
    console.log("Password reset requested for:", email);

    setTimeout(() => {
      setStep(2); // Show confirmation screen
    }, 1000);
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  const renderContent = () => {
    if (step === 2) {
      return (
        <>
          <h2 className={classNames("success-title")}>Email Sent Successfully</h2>
          <p className={classNames("success-text")}>
            We've sent a password reset link to your email address:
            <strong> {email}</strong>. Please check your spam folder if you
            don't see it within a few minutes.
          </p>
          <button
            type="button"
            className={classNames("button", "back-to-login-btn")}
            onClick={handleBackToLogin}
          >
            Back to Login
          </button>
        </>
      );
    }

    // Step 1: Email Input Form
    return (
      <form onSubmit={handleSubmit}>
        <h1>Forgot Password</h1>
        <p className={classNames("instruction-text")}>
          Enter your registered email address below to receive a password reset
          link.
        </p>

        {resetMessage && (
          <div
            className={classNames(
              "reset-message",
              resetMessage.startsWith("✅") ? "success" : "error"
            )}
          >
            {resetMessage}
          </div>
        )}

        <div className={classNames("input-box")}>
          <input
            type="email"
            placeholder="Your Registered Email"
            value={email}
            onChange={handleEmailChange}
            required
            className={classNames(
              resetMessage.includes("Please enter") && "input-error"
            )}
          />
          <i className={classNames("bx", "bxs-envelope")} />
        </div>

        <button type="submit" className={classNames("button")} disabled={isButtonDisabled}>
          Send Reset Link
        </button>

        <div className={classNames("register-link")}>
          <p>
            <a href="#" onClick={handleBackToLogin}>
              Back to Login
            </a>
          </p>
        </div>
      </form>
    );
  };

  return (
    <div className="forgot-password-page-wrapper">
      <Navigation />
      <div className="forgot-password-wrapper" style={{ marginTop: "80px", marginBottom: "80px" }}>{renderContent()}</div>
      <Footer />
    </div>
  );
};

export default InClassForgotPass;
