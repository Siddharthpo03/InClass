import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import Favicon from "../../assets/favicon.jpg";
import styles from "./InClassForgotPass.module.css";

const InClassForgotPass = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [resetMessage, setResetMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Email Input, 2: Confirmation Message
  const [validationError, setValidationError] = useState("");

  // Initialize dark mode
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const shouldBeDark =
      savedDarkMode !== null ? savedDarkMode === "true" : prefersDark;
    if (shouldBeDark) {
      document.body.classList.add("darkMode");
    } else {
      document.body.classList.remove("darkMode");
    }
  }, []);

  useEffect(() => {
    setIsButtonDisabled(!email.trim());
    setValidationError("");
    setResetMessage("");
  }, [email]);

  const validateEmail = (emailValue) => {
    if (!emailValue.trim()) {
      setValidationError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setValidationError("Please enter a valid email address");
      return false;
    }
    setValidationError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResetMessage("");
    setValidationError("");

    if (!validateEmail(email)) {
      return;
    }

    setLoading(true);

    try {
      // TODO: Replace with actual API endpoint when backend is ready
      // const response = await apiClient.post("/auth/forgot-password", { email });

      // Simulated API call for now
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setResetMessage(`✅ Instructions sent to ${email}. Check your inbox!`);
      setLoading(false);

      setTimeout(() => {
        setStep(2);
      }, 1000);
    } catch (error) {
      setLoading(false);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to send reset link. Please try again.";
      setResetMessage(`❌ ${errorMessage}`);
      console.error("Password reset error:", error);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div className={styles.forgotPasswordPageWrapper}>
      <Navigation />

      <div className={styles.forgotPasswordContainer}>
        <div className={styles.forgotPasswordCard}>
          {step === 1 ? (
            <>
              <div className={styles.header}>
                <div className={styles.logoSection}>
                  <div className={styles.logoIcon}>
                    <img src={Favicon} alt="InClass Logo" />
                  </div>
                </div>
                <h1 className={styles.title}>Forgot Password?</h1>
                <p className={styles.subtitle}>
                  No worries! Enter your email address and we'll send you a
                  reset link.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className={styles.forgotPasswordForm}
              >
                {resetMessage && (
                  <div
                    className={`${styles.messageBox} ${
                      resetMessage.startsWith("✅")
                        ? styles.messageSuccess
                        : styles.messageError
                    }`}
                  >
                    <i
                      className={`bx ${
                        resetMessage.startsWith("✅")
                          ? "bx-check-circle"
                          : "bx-error-circle"
                      }`}
                    ></i>
                    <span>{resetMessage}</span>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    <i className="bx bx-envelope"></i>
                    Email Address
                  </label>
                  <div className={styles.inputWrapper}>
                    <i className="bx bx-envelope"></i>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your registered email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={validationError ? styles.inputError : ""}
                      required
                    />
                  </div>
                  {validationError && (
                    <span className={styles.errorText}>
                      <i className="bx bx-error-circle"></i>
                      {validationError}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isButtonDisabled || loading}
                >
                  {loading ? (
                    <>
                      <div className={styles.spinner}></div>
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <>
                      <i className="bx bx-send"></i>
                      <span>Send Reset Link</span>
                    </>
                  )}
                </button>

                <div className={styles.divider}>
                  <span>or</span>
                </div>

                <div className={styles.backToLoginLink}>
                  <p>
                    Remember your password?{" "}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate("/login");
                      }}
                    >
                      Sign In
                    </a>
                  </p>
                </div>
              </form>
            </>
          ) : (
            <div className={styles.successSection}>
              <div className={styles.successIcon}>
                <i className="bx bx-check-circle"></i>
              </div>
              <h2 className={styles.successTitle}>Check Your Email</h2>
              <p className={styles.successText}>
                We've sent a password reset link to:
                <br />
                <strong>{email}</strong>
              </p>
              <p className={styles.successHint}>
                Please check your inbox and spam folder. The link will expire in
                1 hour.
              </p>
              <button
                type="button"
                className={styles.backButton}
                onClick={handleBackToLogin}
              >
                <i className="bx bx-arrow-back"></i>
                <span>Back to Login</span>
              </button>
              <div className={styles.resendSection}>
                <p>Didn't receive the email?</p>
                <button
                  type="button"
                  className={styles.resendButton}
                  onClick={() => {
                    setStep(1);
                    setResetMessage("");
                  }}
                >
                  Resend Email
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side Illustration */}
        <div className={styles.illustrationSection}>
          <div className={styles.illustrationContent}>
            <div className={styles.illustrationIcon}>
              <i className="bx bx-lock-open-alt"></i>
            </div>
            <h2>Reset Your Password</h2>
            <p>
              Secure password recovery process to get you back into your account
              quickly
            </p>
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <i className="bx bx-check-circle"></i>
                <span>Secure reset link</span>
              </div>
              <div className={styles.featureItem}>
                <i className="bx bx-check-circle"></i>
                <span>Quick recovery</span>
              </div>
              <div className={styles.featureItem}>
                <i className="bx bx-check-circle"></i>
                <span>Email verification</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default InClassForgotPass;
