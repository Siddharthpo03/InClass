import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import useDarkMode from "../../hooks/useDarkMode";
import styles from "./InClassLogin.module.css";

const InClassLogin = () => {
  useDarkMode();
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});
  const [loginMessage, setLoginMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const emailCheckTimeoutRef = useRef(null);

  // Minimal state to keep existing face capture UI wiring without using face-api.js
  const [faceVerificationRequired, setFaceVerificationRequired] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [capturingFace, setCapturingFace] = useState(false);
  const [modelsLoaded] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Check if email belongs to an admin account (with debounce)
  const checkEmailForAdmin = async (email) => {
    // Clear any existing timeout
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }

    // Validate email format first
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setIsAdmin(false);
      // Only clear role if it was auto-set to "Admin", not if user manually selected Student/Faculty
      if (role === "Admin") {
        setRole("");
      }
      setCheckingEmail(false);
      return;
    }

    // Show checking indicator immediately
    setCheckingEmail(true);

    // Debounce: wait 200ms after user stops typing for faster real-time response
    emailCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await apiClient.get(
          `/auth/check-email?email=${encodeURIComponent(email)}`
        );

        // Debug log
        if (import.meta.env.DEV) {
          console.log("Email check response:", response.data);
        }

        if (
          response.data &&
          response.data.exists &&
          response.data.role === "admin"
        ) {
          // Admin detected - redirect to admin login page
          console.log("✅ Admin account detected - redirecting to admin login");
          setIsAdmin(true);
          setLoginMessage("ℹ️ Admin account detected. Redirecting to admin login...");
          
          // Redirect to admin login page after a short delay
          setTimeout(() => {
            navigate("/inclass/admin/login", { 
              replace: true,
              state: { email: email } // Pre-fill email if possible
            });
          }, 1500);
          return;
        } else {
          // Not an admin - clear admin state
          setIsAdmin(false);
          // Only clear role if it was auto-set to "Admin", not if user manually selected Student/Faculty
          if (role === "Admin") {
            setRole("");
          }
        }
      } catch (error) {
        console.error("Error checking email:", error);
        console.error("Error details:", error.response?.data || error.message);
        setIsAdmin(false);
        // Only clear role if it was auto-set to "Admin", not if user manually selected Student/Faculty
        if (role === "Admin") {
          setRole("");
        }
      } finally {
        setCheckingEmail(false);
      }
    }, 200);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, []);

  const handleFormChange = (e) => {
    const newFormData = { ...formData, [e.target.name]: e.target.value };
    setFormData(newFormData);
    setLoginMessage("");
    setValidationErrors((prev) => ({ ...prev, [e.target.name]: "" }));

    // Check if email belongs to admin (only when email field changes)
    if (e.target.name === "email") {
      const emailValue = e.target.value.trim();
      if (emailValue) {
        // Check email format first, then check for admin
        if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
          checkEmailForAdmin(emailValue);
        } else {
          // Invalid email format - clear admin status only (don't clear manually selected role)
          setIsAdmin(false);
          // Only clear role if it was auto-set to "Admin", not if user manually selected Student/Faculty
          if (role === "Admin") {
            setRole("");
          }
          setCheckingEmail(false);
        }
      } else {
        // Email field is empty - clear admin status only (don't clear manually selected role)
        setIsAdmin(false);
        // Only clear role if it was auto-set to "Admin", not if user manually selected Student/Faculty
        if (role === "Admin") {
          setRole("");
        }
        setCheckingEmail(false);
      }
    }

    // If admin is detected and password is being entered, enable button immediately
    // Use newFormData to get the latest password value
    if (isAdmin && e.target.name === "password") {
      const emailValid =
        newFormData.email.trim() &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newFormData.email.trim());
      const passwordValid = e.target.value.trim().length > 0;
      if (emailValid && passwordValid) {
        setIsButtonDisabled(false);
        console.log(
          "✅ Button enabled immediately (admin + password entered in handleFormChange)"
        );
      } else {
        setIsButtonDisabled(true);
      }
    }
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

  // Update button disabled state whenever form data, role, or admin status changes
  useEffect(() => {
    const email = formData.email.trim();
    const password = formData.password.trim();

    // Validate email format
    const emailValid =
      email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    // Check if password is entered
    const passwordValid = password.length > 0;

    let shouldEnable = false;

    // For admin: only need valid email and password (role is auto-detected)
    if (isAdmin) {
      shouldEnable = emailValid && passwordValid;
    } else {
      // For student/faculty: need valid email, password, AND role selection
      shouldEnable = emailValid && passwordValid && role && role.length > 0;
    }

    // Force update button state - ALWAYS update to ensure state is correct
    setIsButtonDisabled(!shouldEnable);

    // Debug logging
    console.log("🔘 Button State Update (useEffect):", {
      email: email.substring(0, 30),
      hasPassword: password.length > 0,
      passwordLength: password.length,
      emailValid,
      passwordValid,
      isAdmin,
      role,
      shouldEnable,
      buttonDisabled: !shouldEnable,
    });
  }, [formData.email, formData.password, role, isAdmin]);

  const validateForm = () => {
    let isValid = true;
    let errors = {};

    if (!formData.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!formData.password.trim()) {
      errors.password = "Password is required";
      isValid = false;
    }

    // Admin doesn't need role selection (auto-detected), but student/faculty do
    if (!isAdmin && !role) {
      errors.role = "Please select a role";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Camera error:", error);
      setLoginMessage("❌ Failed to access camera. Please check permissions.");
      setShowFaceCapture(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Capture face and verify
  const captureAndVerifyFace = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setLoginMessage("❌ Camera not ready.");
      return;
    }

    if (!modelsLoaded) {
      setLoginMessage("❌ Face recognition models are not loaded yet.");
      return;
    }

    setCapturingFace(true);
    setLoginMessage("");

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Face login removed – keep camera capture for future use if needed.
    } catch (error) {
      console.error("Face capture error:", error);
      setLoginMessage(
        `❌ ${error.message || "Failed to capture face. Please try again."}`
      );
      setCapturingFace(false);
    }
  };

  // Complete login with face embedding
  const completeLoginWithFace = async (embedding) => {
    try {
      // Block admin login from regular endpoint
      if (isAdmin || role.toLowerCase() === "admin") {
        setLoginMessage("ℹ️ Admin accounts must use the admin login page. Redirecting...");
        setTimeout(() => {
          navigate("/inclass/admin/login", { 
            replace: true,
            state: { email: formData.email }
          });
        }, 1500);
        return;
      }

      const loginRole = role.toLowerCase();

      const response = await apiClient.post("/auth/login", {
        email: formData.email,
        password: formData.password,
        role: loginRole,
        embedding: embedding, // Include face embedding
      });

      const { token, role: userRole } = response.data;
      localStorage.setItem("inclass_token", token);
      localStorage.setItem("user_role", userRole);

      setLoginMessage("✅ Login successful! Redirecting...");

      let targetPath = "/";
      if (userRole === "student") {
        targetPath = "/student/dashboard";
      } else if (userRole === "faculty") {
        targetPath = "/faculty/dashboard";
      } else if (userRole === "admin") {
        targetPath = "/admin/dashboard";
      }

      setTimeout(() => navigate(targetPath, { replace: true }), 1000);
    } catch (error) {
      setCapturingFace(false);
      setLoading(false);
      let errorMessage = "Face verification failed.";

      if (error.response?.data) {
        if (error.response.data.error?.message) {
          errorMessage = error.response.data.error.message;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setLoginMessage(`❌ ${errorMessage}`);
      setFaceVerificationRequired(false);
      setPasswordVerified(false);
      console.error("Login Error:", error.response || error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginMessage("");

    if (!validateForm()) {
      setLoginMessage("❌ Please correct the errors above.");
      return;
    }

    setLoading(true);

    try {
      // Block admin login from regular endpoint
      if (isAdmin || role.toLowerCase() === "admin") {
        setLoginMessage("ℹ️ Admin accounts must use the admin login page. Redirecting...");
        setTimeout(() => {
          navigate("/inclass/admin/login", { 
            replace: true,
            state: { email: formData.email }
          });
        }, 1500);
        setLoading(false);
        return;
      }

      // Use selected role (student or faculty only)
      const loginRole = role.toLowerCase();

      // Try login with password only
      // Backend will check if face verification is needed
      console.log("[Login] Attempting login for:", {
        email: formData.email,
        role: loginRole,
      });

      let response;
      try {
        response = await apiClient.post("/auth/login", {
          email: formData.email,
          password: formData.password,
          role: loginRole,
        });
      } catch (loginError) {
        // Check if error is about admin account
        if (loginError.response?.data?.error?.message?.includes("admin")) {
          setLoginMessage("ℹ️ Admin accounts must use the admin login page. Redirecting...");
          setTimeout(() => {
            navigate("/inclass/admin/login", { 
              replace: true,
              state: { email: formData.email }
            });
          }, 1500);
          setLoading(false);
          return;
        }
        // Re-throw to be handled by outer catch block
        throw loginError;
      }

      console.log("[Login] Login response received:", {
        status: response.status,
        data: response.data,
        hasToken: !!response.data?.token,
      });

      // If we get here, login succeeded (no face verification needed or already provided)
      const { token, role: userRole } = response.data;
      localStorage.setItem("inclass_token", token);
      localStorage.setItem("user_role", userRole);

      setLoginMessage("✅ Login successful! Redirecting...");

      let targetPath = "/";
      if (userRole === "student") {
        targetPath = "/student/dashboard";
      } else if (userRole === "faculty") {
        targetPath = "/faculty/dashboard";
      } else if (userRole === "admin") {
        targetPath = "/admin/dashboard";
      }

      // Navigate immediately for admin, with delay for others
      if (userRole === "admin") {
        navigate(targetPath, { replace: true });
      } else {
        setTimeout(() => navigate(targetPath, { replace: true }), 1000);
      }
    } catch (error) {
      setLoading(false);
      let errorMessage = "Login failed. Please check your credentials.";

      // Log full error for debugging
      console.log("[Login] Full error object:", {
        hasResponse: !!error.response,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        errorObject: error,
      });

      // Check if this is a face verification requirement (400 status)
      if (error.response?.status === 400) {
        const responseData = error.response.data;

        // Check if backend is asking for face verification
        const requiresFaceVerification =
          responseData?.requiresFaceVerification === true ||
          responseData?.error?.code === "FACE_VERIFICATION_REQUIRED" ||
          responseData?.error?.message?.includes(
            "Face verification required"
          ) ||
          responseData?.error?.message?.includes("capture your face") ||
          responseData?.message?.includes("Face verification required") ||
          responseData?.message?.includes("capture your face");

        console.log("[Login] Face verification check (400 status):", {
          requiresFaceVerification,
          errorCode: responseData?.error?.code,
          errorMessage: responseData?.error?.message || responseData?.message,
          hasFlag: responseData?.requiresFaceVerification,
          fullData: responseData,
        });

        if (requiresFaceVerification) {
          // Password is verified, now need face
          console.log("[Login] Triggering face verification modal");
          setPasswordVerified(true);
          setFaceVerificationRequired(true);
          setShowFaceCapture(true);
          await startCamera();
          setLoginMessage("✅ Password verified. Please verify your face.");
          return;
        }
      }

      if (error.response?.data) {
        if (error.response.data.error?.message) {
          errorMessage = error.response.data.error.message;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setLoginMessage(`❌ ${errorMessage}`);
      console.error("Login Error:", error.response || error);
    }
  };

  return (
    <div className={styles.loginPageWrapper}>
      <Navigation />

      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <div className={styles.logoSection}>
              <div className={styles.logoIcon}>
                <img src="/favicon.png" alt="InClass Logo" />
              </div>
            </div>
            <h1 className={styles.loginTitle}>Welcome Back</h1>
            <p className={styles.loginSubtitle}>
              Sign in to continue to InClass
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.loginForm}>
            {loginMessage && (
              <div
                className={`${styles.messageBox} ${
                  loginMessage.startsWith("✅")
                    ? styles.messageSuccess
                    : styles.messageError
                }`}
              >
                <i
                  className={`bx ${
                    loginMessage.startsWith("✅")
                      ? "bx-check-circle"
                      : "bx-error-circle"
                  }`}
                ></i>
                <span>{loginMessage}</span>
              </div>
            )}

            {/* Role Selection - Hidden for Admin, Required for Student/Faculty */}
            {!isAdmin && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <i className="bx bx-user-circle"></i>
                  Select Your Role
                </label>
                <div className={styles.dropdownWrapper} ref={dropdownRef}>
                  <div
                    className={`${styles.dropdown} ${
                      validationErrors.role ? styles.inputError : ""
                    } ${dropdownOpen ? styles.dropdownOpen : ""}`}
                    onClick={() => setDropdownOpen((prev) => !prev)}
                  >
                    <div className={styles.dropdownContent}>
                      {role && (
                        <i
                          className={`bx ${
                            role === "Student" ? "bx-user" : "bx-user-circle"
                          }`}
                        ></i>
                      )}
                      <span>{role || "Select Role"}</span>
                    </div>
                    <i
                      className={`bx bx-chevron-down ${styles.chevronIcon} ${
                        dropdownOpen ? styles.rotate : ""
                      }`}
                    ></i>
                  </div>
                  {dropdownOpen && (
                    <ul className={styles.dropdownMenu}>
                      {["Student", "Faculty"].map((r) => (
                        <li
                          key={r}
                          className={styles.dropdownItem}
                          onClick={() => handleRoleSelect(r)}
                        >
                          <i
                            className={`bx ${
                              r === "Student" ? "bx-user" : "bx-user-circle"
                            }`}
                          ></i>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {validationErrors.role && (
                    <span className={styles.errorText}>
                      <i className="bx bx-error-circle"></i>
                      {validationErrors.role}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Admin Detection Message */}
            {isAdmin && (
              <div className={styles.adminDetected}>
                <i className="bx bx-shield"></i>
                <span>
                  Admin account detected. Role selection not required.
                </span>
              </div>
            )}

            {checkingEmail && (
              <div className={styles.checkingEmail}>
                <i className="bx bx-loader-alt bx-spin"></i>
                <span>Checking email...</span>
              </div>
            )}

            {/* Email Input */}
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
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className={validationErrors.email ? styles.inputError : ""}
                  required
                />
              </div>
              {validationErrors.email && (
                <span className={styles.errorText}>
                  <i className="bx bx-error-circle"></i>
                  {validationErrors.email}
                </span>
              )}
            </div>

            {/* Password Input */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <i className="bx bx-lock-alt"></i>
                Password
              </label>
              <div className={styles.inputWrapper}>
                <i className="bx bx-lock-alt"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleFormChange}
                  className={validationErrors.password ? styles.inputError : ""}
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPassword(!showPassword);
                  }}
                  tabIndex={0}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <i className="bx bx-hide-alt"></i>
                  ) : (
                    <i className="bx bx-show-alt"></i>
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <span className={styles.errorText}>
                  <i className="bx bx-error-circle"></i>
                  {validationErrors.password}
                </span>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className={styles.formOptions}>
              <label className={styles.checkboxLabel}>
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/forgot");
                }}
                className={styles.forgotLink}
              >
                Forgot Password?
              </a>
            </div>

            {/* Face Capture Modal */}
            {showFaceCapture && (
              <div className={styles.faceCaptureModal}>
                <div className={styles.faceCaptureContent}>
                  <h3>Face Verification Required</h3>
                  <p>Please look at the camera to verify your identity.</p>
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
                  <div className={styles.faceCaptureButtons}>
                    <button
                      type="button"
                      onClick={captureAndVerifyFace}
                      disabled={capturingFace || !modelsLoaded}
                      className={styles.captureButton}
                    >
                      {capturingFace ? (
                        <>
                          <div className={styles.spinner}></div>
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <i className="bx bx-camera"></i>
                          <span>Verify Face</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        setShowFaceCapture(false);
                        setFaceVerificationRequired(false);
                        setPasswordVerified(false);
                        setLoading(false);
                      }}
                      className={styles.cancelButton}
                      disabled={capturingFace}
                    >
                      <i className="bx bx-x"></i>
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={styles.submitButton}
              disabled={
                isButtonDisabled || loading || checkingEmail || showFaceCapture
              }
            >
              {loading ? (
                <>
                  <div className={styles.spinner}></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <i className="bx bx-log-in"></i>
                  <span>Sign In</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className={styles.divider}>
              <span>or</span>
            </div>

            {/* Register Link */}
            <div className={styles.registerLink}>
              <p>
                Don't have an account?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/register");
                  }}
                >
                  Create Account
                </a>
              </p>
            </div>
          </form>
        </div>

        {/* Side Illustration */}
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
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <i className="bx bx-check-circle"></i>
                <span>Time-restricted codes</span>
              </div>
              <div className={styles.featureItem}>
                <i className="bx bx-check-circle"></i>
                <span>Biometric verification</span>
              </div>
              <div className={styles.featureItem}>
                <i className="bx bx-check-circle"></i>
                <span>Real-time tracking</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default InClassLogin;
