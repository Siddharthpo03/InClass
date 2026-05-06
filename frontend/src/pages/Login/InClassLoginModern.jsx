import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import useDarkMode from "../../hooks/useDarkMode";
import styles from "./InClassLoginModern.module.css";

const InClassLoginModern = () => {
  useDarkMode();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [capturingFace, setCapturingFace] = useState(false);
  const [faceVerificationRequired, setFaceVerificationRequired] =
    useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Load face-api models
  useEffect(() => {
    const loadFaceModels = async () => {
      try {
        const script = document.createElement("script");
        script.src =
          "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
        script.async = true;
        script.onload = () => {
          console.log("Face-API loaded");
          setModelsLoaded(true);
        };
        document.body.appendChild(script);
      } catch (err) {
        console.error("Failed to load face-api:", err);
      }
    };
    loadFaceModels();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    return errors;
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 320 },
          height: { ideal: 320 },
        },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied:", err);
      setServerError("Camera access denied. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
  };

  const captureAndVerifyFace = async () => {
    if (!canvasRef.current || !videoRef.current) return;
    setCapturingFace(true);
    try {
      const ctx = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);

      const imageData = canvasRef.current.toDataURL("image/jpeg");
      const base64 = imageData.split(",")[1];
      const embedding = []; // Placeholder - would come from FaceAPI in production

      // Submit login with face
      const response = await apiClient.post("/auth/login", {
        email: formData.email,
        password: formData.password,
        embedding: embedding,
      });

      localStorage.setItem("inclass_token", response.data.token);
      localStorage.setItem("user_role", response.data.role);
      navigate("/student/dashboard");
    } catch (err) {
      const errorMsg =
        err.response?.data?.error?.message || "Face verification failed";
      setServerError(errorMsg);
    } finally {
      setCapturingFace(false);
      stopCamera();
      setShowFaceCapture(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setLoading(true);
    setServerError("");

    try {
      // Check if email exists and get user role
      const checkRes = await apiClient.get("/auth/check-email", {
        params: { email: formData.email },
      });

      if (!checkRes.data.exists) {
        setValidationErrors({
          email: "Email not found. Please register first.",
        });
        setLoading(false);
        return;
      }

      // Attempt login (password verification)
      try {
        const loginRes = await apiClient.post("/auth/login", {
          email: formData.email,
          password: formData.password,
        });

        // Success path
        if (loginRes.data?.token) {
          localStorage.setItem("inclass_token", loginRes.data.token);
          localStorage.setItem("user_role", loginRes.data.role);
          if (rememberMe) {
            localStorage.setItem("rememberEmail", formData.email);
          }
          navigate("/student/dashboard");
          return;
        }
      } catch (loginError) {
        // If backend requires face verification it responds with 400 and a flag
        const resp = loginError.response;
        if (
          resp &&
          resp.status === 400 &&
          (resp.data?.requiresFaceVerification || resp.data?.requiresFaceEnrollment)
        ) {
          setPasswordVerified(true);
          setFaceVerificationRequired(true);
          setShowFaceCapture(true);
          await startCamera();
          setLoading(false);
          return;
        }

        // Otherwise rethrow to be handled by outer catch
        throw loginError;
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please try again.";
      setServerError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <Navigation />
      <div className={styles.loginContainer}>
        {/* Left Side - Form */}
        <div className={styles.formSection}>
          <div className={styles.formContent}>
            <div className={styles.header}>
              <h1 className={styles.title}>Welcome Back</h1>
              <p className={styles.subtitle}>Sign in to your InClass account</p>
            </div>

            {serverError && (
              <div className={styles.alert} role="alert">
                <i className="bx bx-exclamation-circle"></i>
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Email Field */}
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email Address
                </label>
                <div className={styles.inputWrapper}>
                  <i className="bx bx-envelope"></i>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={validationErrors.email ? styles.inputError : ""}
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
                {validationErrors.email && (
                  <span className={styles.errorText}>
                    {validationErrors.email}
                  </span>
                )}
              </div>

              {/* Password Field */}
              <div className={styles.formGroup}>
                <div className={styles.labelWrapper}>
                  <label htmlFor="password" className={styles.label}>
                    Password
                  </label>
                  <button
                    type="button"
                    className={styles.forgotLink}
                    onClick={() => navigate("/forgot")}
                  >
                    Forgot?
                  </button>
                </div>
                <div className={styles.inputWrapper}>
                  <i className="bx bx-lock-alt"></i>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={
                      validationErrors.password ? styles.inputError : ""
                    }
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    disabled={loading}
                  >
                    <i
                      className={`bx ${showPassword ? "bx-hide-alt" : "bx-show-alt"}`}
                    ></i>
                  </button>
                </div>
                {validationErrors.password && (
                  <span className={styles.errorText}>
                    {validationErrors.password}
                  </span>
                )}
              </div>

              {/* Remember Me */}
              <div className={styles.rememberWrapper}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  <span>Remember me</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading || showFaceCapture}
              >
                {loading ? (
                  <>
                    <span className={styles.spinner}></span>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <i className="bx bx-log-in"></i>
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className={styles.divider}>
              <span>New here?</span>
            </div>

            {/* Register Link */}
            <button
              className={styles.registerButton}
              onClick={() => navigate("/register")}
              disabled={loading}
            >
              <i className="bx bx-user-plus"></i>
              <span>Create Account</span>
            </button>
          </div>
        </div>

        {/* Right Side - Illustration */}
        <div className={styles.illustrationSection}>
          <div className={styles.illustrationContent}>
            <div className={styles.illustrationIcon}>
              <i className="bx bx-book-reader"></i>
            </div>
            <h2>Smart Attendance System</h2>
            <p>
              Secure, efficient, and reliable attendance management for modern
              education
            </p>
            <ul className={styles.featureList}>
              <li>
                <i className="bx bx-check-circle"></i>
                <span>Time-restricted codes</span>
              </li>
              <li>
                <i className="bx bx-check-circle"></i>
                <span>Biometric verification</span>
              </li>
              <li>
                <i className="bx bx-check-circle"></i>
                <span>Real-time tracking</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Face Capture Modal */}
      {showFaceCapture && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Face Verification Required</h3>
            <p className={styles.modalDescription}>
              Look at the camera to verify your identity
            </p>

            <div className={styles.videoContainer}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={styles.videoPreview}
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => {
                  stopCamera();
                  setShowFaceCapture(false);
                  setPasswordVerified(false);
                  setFaceVerificationRequired(false);
                }}
                disabled={capturingFace}
              >
                <i className="bx bx-x"></i>
                Cancel
              </button>
              <button
                type="button"
                className={styles.captureButton}
                onClick={captureAndVerifyFace}
                disabled={capturingFace || !modelsLoaded}
              >
                {capturingFace ? (
                  <>
                    <span className={styles.spinner}></span>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <i className="bx bx-camera"></i>
                    <span>Verify Face</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default InClassLoginModern;
