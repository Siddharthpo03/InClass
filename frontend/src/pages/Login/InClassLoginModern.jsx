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
  const [faceModelState, setFaceModelState] = useState("loading");
  const [faceModelMessage, setFaceModelMessage] = useState(
    "Loading face models...",
  );
  const [faceError, setFaceError] = useState("");
  const FACE_MODEL_TIMEOUT_MS = 15000;

  const loadFaceModels = useCallback(async () => {
    setFaceModelState("loading");
    setFaceModelMessage("Loading face models...");

    const loadScript = (src) =>
      new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[data-face-api="${src}"]`);
        if (existingScript) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.dataset.faceApi = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load face-api.js from ${src}`));
        document.body.appendChild(script);
      });

    const loadModelSet = async (faceapi, baseUrl, label) => {
      let timeoutId;
      const loadPromise = Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(baseUrl),
        faceapi.nets.faceLandmark68Net.loadFromUri(baseUrl),
        faceapi.nets.faceRecognitionNet.loadFromUri(baseUrl),
      ]);

      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label} timed out after ${FACE_MODEL_TIMEOUT_MS / 1000}s`));
        }, FACE_MODEL_TIMEOUT_MS);
      });

      try {
        await Promise.race([loadPromise, timeoutPromise]);
      } finally {
        clearTimeout(timeoutId);
      }
    };

    try {
      const scriptSources = [
        "/vendor/face-api.min.js",
        "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js",
      ];

      let scriptLoaded = false;
      let faceapi = null;

      for (const scriptSource of scriptSources) {
        try {
          await loadScript(scriptSource);
          faceapi = window.faceapi;
          if (faceapi) {
            scriptLoaded = true;
            break;
          }
        } catch (error) {
          console.warn(error.message);
        }
      }

      if (!scriptLoaded || !faceapi) {
        throw new Error(
          "Face API library could not be loaded. Please refresh the page or clear cache.",
        );
      }

      const modelBases = [
        new URL("/models", window.location.origin).toString(),
        "https://justadudewhohacks.github.io/face-api.js/models",
      ];

      let loaded = false;
      let lastError = null;

      for (const modelBase of modelBases) {
        try {
          await loadModelSet(faceapi, modelBase, `Face models from ${modelBase}`);
          loaded = true;
          break;
        } catch (error) {
          lastError = error;
          console.warn(error.message);
        }
      }

      if (!loaded) {
        throw lastError || new Error("Face models could not be loaded.");
      }

      setFaceModelState("ready");
      setFaceModelMessage("Face models ready.");
    } catch (error) {
      console.error("Error initializing face-api models:", error);
      setFaceModelState("error");
      setFaceModelMessage(
        error.message || "Face models failed to load. Please try again.",
      );
    }
  }, []);

  // Load face-api models
  useEffect(() => {
    void loadFaceModels();
  }, [loadFaceModels]);

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
    setFaceError("");
    setServerError("");
    try {
      const ctx = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);

      // Compute embedding using face-api if available and models loaded
      let embedding = [];
      try {
        const faceapi = window.faceapi;
        if (!faceapi || faceModelState !== "ready") {
          throw new Error(faceModelMessage || "FaceAPI not available or models not loaded");
        }

        // Detect single face and compute descriptor
        const detection = await faceapi
          .detectSingleFace(canvasRef.current)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection || !detection.descriptor) {
          throw new Error("No face detected. Please try again.");
        }

        // descriptor is a Float32Array
        embedding = Array.from(detection.descriptor);
        console.log("Face descriptor extracted successfully", {
          descriptorLength: embedding.length,
        });
      } catch (embedErr) {
        console.error("Embedding extraction failed:", embedErr);
        setFaceError(embedErr.message || "Face embedding failed");
        setCapturingFace(false);
        stopCamera();
        return;
      }

      // SINGLE LOGIN API CALL with face descriptor
      console.log("Sending login request with face descriptor", {
        email: formData.email,
        hasPassword: !!formData.password,
        descriptorLength: embedding.length,
      });

      const response = await apiClient.post(
        "/auth/login",
        {
          email: formData.email,
          password: formData.password,
          embedding,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          validateStatus: (status) => status < 500,
        },
      );

      console.log("Login response received", {
        status: response.status,
        hasToken: !!response.data?.token,
        responseKeys: Object.keys(response.data || {}),
      });

      if (response.status >= 400) {
        const errorDetails = {
          status: response.status,
          errorMessage: response.data?.error?.message,
          message: response.data?.message,
          fullResponse: response.data,
        };
        console.error("Login failed with error response", errorDetails);

        const message =
          response.data?.error?.message ||
          response.data?.message ||
          `Login failed with status ${response.status}`;
        setFaceError(message);
        setServerError(message);
        return;
      }

      // Success: token received, log and navigate
      if (response.data?.token) {
        console.log("Login successful, storing token and navigating");
        localStorage.setItem("inclass_token", response.data.token);
        localStorage.setItem("user_role", response.data.role || "student");
        if (rememberMe) {
          localStorage.setItem("rememberEmail", formData.email);
        }
        stopCamera();
        setShowFaceCapture(false);
        navigate("/student/dashboard");
        return;
      }

      // No token in response (unexpected)
      console.warn("Login response received but no token present", response.data);
      setFaceError("Login succeeded but token was not provided. Please try again.");
    } catch (err) {
      console.error("Unexpected error during face verification", err);
      const errorMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        "Face verification failed";
      setFaceError(errorMsg);
      setServerError(errorMsg);
    } finally {
      setCapturingFace(false);
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
    setFaceError("");

    try {
      // Check if email exists
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

      // Email exists; open face verification modal
      // NO LOGIN API CALL HERE — face verification is required
      setPasswordVerified(true);
      setFaceVerificationRequired(true);
      setShowFaceCapture(true);
      await startCamera();
    } catch (error) {
      const errorMsg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        "Email verification failed. Please try again.";
      setServerError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <Navigation />
      <div className={styles.loginContainer}>
        <div className={styles.formSection}>
          <div className={styles.formContent}>
            <button
              type="button"
              className={styles.backButton}
              onClick={() => navigate("/")}
              aria-label="Go back to homepage"
              title="Back to homepage"
            >
              <i className="bx bx-arrow-back"></i>
            </button>

            <div className={styles.header}>
              <p className={styles.subtitle}>Sign in to your InClass account</p>
            </div>

            {serverError && (
              <div className={styles.alert} role="alert">
                <i className="bx bx-exclamation-circle"></i>
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
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
                  <span className={styles.errorText}>{validationErrors.email}</span>
                )}
              </div>

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
                    className={validationErrors.password ? styles.inputError : ""}
                    disabled={loading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    disabled={loading}
                  >
                    <i className={`bx ${showPassword ? "bx-hide-alt" : "bx-show-alt"}`}></i>
                  </button>
                </div>
                {validationErrors.password && (
                  <span className={styles.errorText}>{validationErrors.password}</span>
                )}
              </div>

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

            <div className={styles.divider}>
              <span>New here?</span>
            </div>

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

        <div className={styles.illustrationSection}>
          <div className={styles.illustrationContent}>
            <div className={styles.illustrationIcon}>
              <i className="bx bx-book-reader"></i>
            </div>
            <h2>Smart Attendance System</h2>
            <p>
              Secure, efficient, and reliable attendance management for modern education
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
                disabled={capturingFace || faceModelState !== "ready"}
              >
                {capturingFace ? (
                  <>
                    <span className={styles.spinner}></span>
                    <span>Verifying...</span>
                  </>
                ) : faceModelState !== "ready" ? (
                  <>
                    <i className="bx bx-loader-alt"></i>
                    <span>Loading Models...</span>
                  </>
                ) : (
                  <>
                    <i className="bx bx-camera"></i>
                    <span>Verify Face</span>
                  </>
                )}
              </button>
            </div>

            {(faceError || faceModelState !== "ready") && (
              <div className={styles.faceStatus} role="status">
                {faceError || faceModelMessage}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default InClassLoginModern;
