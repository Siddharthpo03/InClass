import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  startRegistration,
  startAuthentication,
} from "@simplewebauthn/browser";
import apiClient from "../../utils/apiClient";
import { enrollFace, recognizeFace } from "../../services/faceRecognitionApi";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import useDeviceChecks from "../../hooks/useDeviceChecks";
import styles from "./OnboardBiometrics.module.css";

const OnboardBiometrics = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState({
    webauthn: false,
    face: false,
    consent: false,
  });
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isTesting, setIsTesting] = useState({ webauthn: false, face: false });
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [enrollmentProgress, setEnrollmentProgress] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState(null);

  // OTP flow state
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const deviceChecks = useDeviceChecks();

  // Get userId from query params or localStorage
  useEffect(() => {
    const userIdFromParams = searchParams.get("userId");
    const token = localStorage.getItem("inclass_token");

    if (userIdFromParams) {
      setUserId(userIdFromParams);
    } else if (token) {
      apiClient
        .get("/auth/profile")
        .then((response) => {
          if (response.data?.userId) {
            setUserId(response.data.userId.toString());
          }
          if (response.data?.role) {
            setUserRole(response.data.role);
          }
        })
        .catch((err) => {
          console.error("Failed to get user profile:", err);
          setErrorMessage("Unable to identify user. Please log in again.");
        });
    } else {
      setErrorMessage("User ID not found. Please complete registration first.");
    }
  }, [searchParams]);

  const [modelsLoaded] = useState(true);
  const [modelsLoading] = useState(false);
  const [modelError] = useState(null);

  // Check existing biometric status and get user role
  useEffect(() => {
    if (userId) {
      checkBiometricStatus();
      // Also fetch user role if not already set
      if (!userRole) {
        const token = localStorage.getItem("inclass_token");
        if (token) {
          apiClient
            .get("/auth/profile")
            .then((response) => {
              if (response.data?.role) {
                setUserRole(response.data.role);
              }
            })
            .catch((err) => {
              console.error("Failed to get user profile:", err);
            });
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- checkBiometricStatus is stable, run when userId/userRole change
  }, [userId, userRole]);

  const checkBiometricStatus = async () => {
    try {
      const response = await apiClient.get(
        `/biometrics/status?userId=${userId}`
      );
      if (response.data) {
        setEnrollmentStatus({
          webauthn: response.data.webauthn || false,
          face: response.data.face || false,
          consent: response.data.consent || false,
        });
      }
    } catch (error) {
      console.log("Biometric status check failed:", error);
    }
  };

  // Handle consent submission
  const handleConsentSubmit = async () => {
    if (!consentChecked) {
      setErrorMessage("Please check the consent checkbox to proceed.");
      return;
    }

    if (!userId) {
      setErrorMessage("User ID not found. Please refresh the page.");
      return;
    }

    try {
      await apiClient.post("/biometrics/consent", {
        userId: userId,
        method: "both",
        ip: "",
        userAgent: navigator.userAgent,
      });

      setEnrollmentStatus((prev) => ({ ...prev, consent: true }));
      setErrorMessage(null);
    } catch (error) {
      console.error("Consent submission error:", error);
      setErrorMessage(
        error.response?.data?.message ||
          "Failed to submit consent. Please try again."
      );
    }
  };

  // Helper: Convert base64url string to ArrayBuffer
  const base64URLToArrayBuffer = (base64url) => {
    // Convert base64url to base64
    let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    // Add padding if needed
    while (base64.length % 4) {
      base64 += "=";
    }
    // Decode base64 to binary string
    const binaryString = atob(base64);
    // Convert binary string to ArrayBuffer
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // Helper: Convert ArrayBuffer to base64url string
  const arrayBufferToBase64URL = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    // Convert base64 to base64url
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  };

  // Handle WebAuthn enrollment
  const handleWebAuthnEnrollment = async () => {
    if (!consentChecked) {
      setErrorMessage("Please check the consent checkbox first.");
      return;
    }

    if (!userId) {
      setErrorMessage("User ID not found.");
      return;
    }

    setIsEnrolling(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Step 1: Get registration options
      console.log(
        "[WebAuthn] Requesting registration options for userId:",
        userId
      );
      const optionsResponse = await apiClient.post(
        "/biometrics/webauthn/register/options",
        {
          userId: userId,
        }
      );

      if (!optionsResponse.data) {
        throw new Error("Invalid response from server. Check backend logs.");
      }

      const serverOptions = optionsResponse.data;
      console.log("[WebAuthn] Received options from server:", {
        hasChallenge: !!serverOptions.challenge,
        rpId: serverOptions.rp?.id,
        userId: serverOptions.user?.id,
      });

      // Convert base64url strings to ArrayBuffers for browser API
      const options = {
        ...serverOptions,
        challenge:
          typeof serverOptions.challenge === "string"
            ? base64URLToArrayBuffer(serverOptions.challenge)
            : serverOptions.challenge,
        user: {
          ...serverOptions.user,
          id:
            typeof serverOptions.user?.id === "string"
              ? base64URLToArrayBuffer(serverOptions.user.id)
              : serverOptions.user?.id,
        },
        excludeCredentials: serverOptions.excludeCredentials?.map((cred) => ({
          ...cred,
          id:
            typeof cred.id === "string"
              ? base64URLToArrayBuffer(cred.id)
              : cred.id,
        })),
      };

      console.log("[WebAuthn] Starting browser registration...");
      // Step 2: Start registration using @simplewebauthn/browser
      const registrationResponse = await startRegistration(options);

      console.log(
        "[WebAuthn] Browser registration successful, sending to server..."
      );

      // Convert ArrayBuffers to base64url for transmission
      const responseToSend = {
        id: registrationResponse.id,
        rawId: arrayBufferToBase64URL(registrationResponse.rawId),
        type: registrationResponse.type,
        response: {
          clientDataJSON: arrayBufferToBase64URL(
            registrationResponse.response.clientDataJSON
          ),
          attestationObject: arrayBufferToBase64URL(
            registrationResponse.response.attestationObject
          ),
        },
      };

      // Step 3: Complete registration
      const completeResponse = await apiClient.post(
        "/biometrics/webauthn/register/complete",
        {
          userId: userId,
          registrationResponse: responseToSend,
          deviceName: navigator.userAgent,
        }
      );

      if (completeResponse.data?.success) {
        setSuccessMessage("✅ Device biometric enrolled successfully!");
        setEnrollmentStatus((prev) => ({ ...prev, webauthn: true }));
        await checkBiometricStatus();
      } else {
        throw new Error(
          completeResponse.data?.error ||
            completeResponse.data?.message ||
            "Enrollment failed"
        );
      }
    } catch (error) {
      console.error("[WebAuthn] Enrollment error:", error);
      console.error("[WebAuthn] Error details:", {
        name: error.name,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      if (error.response?.status === 500) {
        const serverMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Server error";
        setErrorMessage(
          `Server error (500): ${serverMessage}. Check backend console logs for detailed stack trace. Common issues: missing userId, rpID mismatch, or database table not created.`
        );
      } else if (error.name === "NotSupportedError") {
        setErrorMessage("Device biometric is not supported on this device.");
      } else if (error.name === "NotAllowedError") {
        setErrorMessage("Biometric enrollment was cancelled or denied.");
      } else {
        setErrorMessage(
          error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            "Failed to enroll device biometric. Please try again."
        );
      }
    } finally {
      setIsEnrolling(false);
    }
  };

  // OTP Flow Handlers
  const handleSendOtp = useCallback(async () => {
    if (!userId) {
      setErrorMessage("User ID not found.");
      return;
    }

    setSendingOtp(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await apiClient.post("/auth/send-otp", { userId });
      setOtpSent(true);
      const phoneNumber = response.data?.phoneNumber || "your mobile number";
      setSuccessMessage(
        `✅ OTP sent to ${phoneNumber}. Please check your SMS.`
      );
    } catch (error) {
      console.error("Send OTP error:", error);
      setErrorMessage(
        error.response?.data?.message || "Failed to send OTP. Please try again."
      );
    } finally {
      setSendingOtp(false);
    }
  }, [userId]);

  // For students: only face is required. For faculty/admin: both are required.
  const isStudent = userRole === "student";
  const isFaculty = userRole === "faculty";

  // Auto-send OTP when consent is checked (for both students and faculty)
  useEffect(() => {
    if (
      (isStudent || isFaculty) &&
      consentChecked &&
      !otpVerified &&
      !otpSent &&
      !sendingOtp &&
      userId
    ) {
      handleSendOtp();
    }
  }, [
    isStudent,
    isFaculty,
    consentChecked,
    otpVerified,
    otpSent,
    sendingOtp,
    userId,
    handleSendOtp,
  ]);

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 4 || otpCode.length > 8) {
      setErrorMessage("Please enter a valid OTP code (4-8 digits).");
      return;
    }

    if (!userId) {
      setErrorMessage("User ID not found.");
      return;
    }

    setVerifyingOtp(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await apiClient.post("/auth/verify-otp", { userId, otp: otpCode });
      setOtpVerified(true);
      setSuccessMessage(
        "✅ OTP verified successfully! You can now enroll your face."
      );
    } catch (error) {
      console.error("Verify OTP error:", error);
      setErrorMessage(
        error.response?.data?.message || "Invalid OTP. Please try again."
      );
      setOtpCode("");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Handle Face enrollment
  const startFaceCapture = () => {
    if (!consentChecked) {
      setErrorMessage("Please check the consent checkbox first.");
      return;
    }

    // For students and faculty, require OTP verification first
    if ((isStudent || isFaculty) && !otpVerified) {
      setErrorMessage("Please verify OTP first to unlock face enrollment.");
      return;
    }

    if (!modelsLoaded) {
      setErrorMessage(
        "Face recognition models are still loading. Please wait."
      );
      return;
    }

    setShowFaceCapture(true);
    setCapturedImage(null);
    setCapturedDescriptor(null);
    setErrorMessage(null);
    startCamera();
  };

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
      setErrorMessage("Failed to access camera. Please check permissions.");
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

  // Capture face image (without enrolling)
  const captureFaceImage = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setErrorMessage("Camera not ready.");
      return;
    }

    setEnrollmentProgress("Capturing image...");
    setErrorMessage(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      // Set canvas dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to image data URL for preview
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setCapturedImage(imageDataUrl);

      setEnrollmentProgress("Detecting face...");

      // For FaceNet backend, we only need the captured image.
      // Embedding and liveness checks are handled server-side.
      setEnrollmentProgress("");

      // Stop video stream to show captured image
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    } catch (error) {
      console.error("[Face Capture] Error:", error);
      console.error("[Face Capture] Error details:", {
        message: error.message,
        name: error.name,
      });

      let errorMsg =
        error.message || "Failed to capture face. Please try again.";

      // Provide helpful error messages
      if (
        error.message?.includes("TinyYolov2") ||
        error.message?.includes("load model")
      ) {
        errorMsg =
          "Face detection model not loaded. Please wait for models to load completely, then try again.";
      } else if (error.message?.includes("not loaded")) {
        errorMsg =
          "Face recognition models are still loading. Please wait and try again.";
      }

      setErrorMessage(errorMsg);
      setEnrollmentProgress("");
      setCapturedImage(null);
      setCapturedDescriptor(null);
    }
  };

  // Retake picture - reset capture state
  const retakePicture = () => {
    setCapturedImage(null);
    setCapturedDescriptor(null);
    setEnrollmentProgress("");
    setErrorMessage(null);
    // Restart camera
    startCamera();
  };

  // Enroll with captured face
  const enrollCapturedFace = async () => {
    if (!capturedImage) {
      setErrorMessage("No face image available. Please capture again.");
      return;
    }

    setIsEnrolling(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setEnrollmentProgress("Sending to server...");

    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      const result = await enrollFace({ userId, imageBlob: blob });

      setEnrollmentProgress("Finalizing...");
      setSuccessMessage("✅ Face enrolled successfully!");
      setEnrollmentStatus((prev) => ({ ...prev, face: true }));
      setShowFaceCapture(false);
      setCapturedImage(null);
      setCapturedDescriptor(null);
      stopCamera();
      setEnrollmentProgress("");

      // Refresh biometric status to get latest enrollment state
      await checkBiometricStatus();
    } catch (error) {
      console.error("Face enrollment error:", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to enroll face. Please try again.";
      setErrorMessage(message);
      setEnrollmentProgress("");
    } finally {
      setIsEnrolling(false);
    }
  };

  // EAR-based liveness logic removed; liveness can be handled server-side if needed.

  // Test WebAuthn
  const handleTestWebAuthn = async () => {
    setIsTesting((prev) => ({ ...prev, webauthn: true }));
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // Get authentication options
      const optionsResponse = await apiClient.post(
        "/biometrics/webauthn/auth/options",
        {
          userId: userId,
        }
      );

      const options = optionsResponse.data;

      // Start authentication
      const authenticationResponse = await startAuthentication(options);

      // Complete authentication
      const completeResponse = await apiClient.post(
        "/biometrics/webauthn/auth/complete",
        {
          userId: userId,
          authenticationResponse: authenticationResponse,
        }
      );

      if (completeResponse.data?.verified) {
        setSuccessMessage("✅ Biometric test successful!");
      } else {
        throw new Error("Verification failed");
      }
    } catch (error) {
      console.error("WebAuthn test error:", error);
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Biometric test failed. Please try again."
      );
    } finally {
      setIsTesting((prev) => ({ ...prev, webauthn: false }));
    }
  };

  // Test Face
  const handleTestFace = async () => {
    setIsTesting((prev) => ({ ...prev, face: true }));
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (!videoRef.current || !canvasRef.current) {
        throw new Error("Camera not ready.");
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      const resp = await fetch(dataUrl);
      const blob = await resp.blob();

      const result = await recognizeFace({ imageBlob: blob });

      if (result.match) {
        setSuccessMessage(
          `✅ Face test successful! (Distance: ${result.distance.toFixed(3)})`
        );
      } else {
        throw new Error(
          `Verification failed (Best distance: ${result.distance.toFixed(3)})`
        );
      }
    } catch (error) {
      console.error("Face test error:", error);
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Face test failed. Please try again."
      );
    } finally {
      setIsTesting((prev) => ({ ...prev, face: false }));
    }
  };

  // Handle skip
  const handleSkip = () => {
    localStorage.setItem("biometricSkipped", "true");
    navigate("/login");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

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

  // For students and faculty: only face is required. For admin: both are required.
  const hasEnrolledBoth =
    isStudent || isFaculty
      ? enrollmentStatus.face
      : enrollmentStatus.webauthn && enrollmentStatus.face;
  const canEnrollDevice =
    !isStudent &&
    !isFaculty &&
    consentChecked &&
    !isEnrolling &&
    deviceChecks.checksDone &&
    deviceChecks.platformAuthenticatorAvailable;
  const canEnrollFace =
    consentChecked &&
    !isEnrolling &&
    deviceChecks.checksDone &&
    deviceChecks.cameraAvailable &&
    modelsLoaded &&
    (isStudent || isFaculty ? otpVerified : true);

  // Determine status messages
  const deviceBiometricStatus = !deviceChecks.checksDone
    ? "Checking..."
    : !deviceChecks.platformAuthenticatorAvailable
    ? "❌ Device biometric unavailable"
    : enrollmentStatus.webauthn
    ? "✅ Enrolled"
    : "❌ Not Enrolled";

  const faceRecognitionStatus = !deviceChecks.checksDone
    ? "Checking..."
    : !deviceChecks.cameraAvailable
    ? "⚠️ Camera unavailable"
    : modelsLoading
    ? "⏳ Loading models..."
    : modelError
    ? "⚠️ Models failed to load"
    : !modelsLoaded
    ? "⏳ Models loading..."
    : enrollmentStatus.face
    ? "✅ Models loaded & Enrolled"
    : "❌ Not Enrolled";

  return (
    <div className={styles.onboardPageWrapper}>
      <Navigation />

      <div className={styles.onboardContainer}>
        <div className={styles.onboardCard}>
          <div className={styles.header}>
            <h1 className={styles.title}>Biometric Onboarding</h1>
            <p className={styles.subtitle}>
              Secure your account with biometric authentication. Both
              face enrollment is required for attendance.
            </p>
          </div>

          {errorMessage && (
            <div className={`${styles.messageBox} ${styles.errorBox}`}>
              <i className="bx bx-error-circle"></i>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className={`${styles.messageBox} ${styles.successBox}`}>
              <i className="bx bx-check-circle"></i>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Model Loading Error Banner */}
          {modelError && (
            <div className={`${styles.messageBox} ${styles.errorBox}`}>
              <i className="bx bx-error-circle"></i>
              <span>{modelError}</span>
              <button
                onClick={handleRetryModels}
                disabled={modelsLoading}
                className={styles.retryButton}
                style={{
                  marginLeft: "10px",
                  padding: "4px 12px",
                  fontSize: "0.9rem",
                }}
              >
                {modelsLoading ? "Retrying..." : "Retry"}
              </button>
              <div
                style={{ marginTop: "8px", fontSize: "0.85rem", opacity: 0.8 }}
              >
                💡 Open DevTools (F12) → Network tab to see failed model
                requests
              </div>
            </div>
          )}

          {/* Consent Section */}
          <div className={styles.consentSection}>
            <h2 className={styles.sectionTitle}>Biometric Consent</h2>
            <div className={styles.consentText}>
              <p>
                I consent to the collection and use of my biometric data (face
                for identity verification and attendance
                marking by InClass (Variance Technologies). I understand raw
                biometric images will not be stored; only encrypted templates or
                device-managed credentials will be used. I can revoke this
                consent and delete biometric data anytime from my profile.
              </p>
            </div>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => {
                  setConsentChecked(e.target.checked);
                  if (e.target.checked && !enrollmentStatus.consent) {
                    handleConsentSubmit();
                  }
                }}
                className={styles.checkbox}
              />
              <span>I consent to biometric data collection and use</span>
            </label>
          </div>

          {/* Enrollment Status */}
          <div className={styles.statusSection}>
            {!isStudent && !isFaculty && (
              <div className={styles.statusItem}>
                <i
                  className={`bx ${
                    enrollmentStatus.webauthn
                      ? "bx-check-circle"
                      : deviceChecks.platformAuthenticatorAvailable
                      ? "bx-x-circle"
                      : "bx-error-circle"
                  }`}
                  style={{
                    color: enrollmentStatus.webauthn
                      ? "#10b981"
                      : deviceChecks.platformAuthenticatorAvailable
                      ? "#ef4444"
                      : "#f59e0b",
                  }}
                ></i>
                <span>Device Biometric: {deviceBiometricStatus}</span>
              </div>
            )}
            <div className={styles.statusItem}>
              <i
                className={`bx ${
                  enrollmentStatus.face
                    ? "bx-check-circle"
                    : modelsLoaded && deviceChecks.cameraAvailable
                    ? "bx-x-circle"
                    : "bx-error-circle"
                }`}
                style={{
                  color: enrollmentStatus.face
                    ? "#10b981"
                    : modelsLoaded && deviceChecks.cameraAvailable
                    ? "#ef4444"
                    : "#f59e0b",
                }}
              ></i>
              <span>Face Recognition: {faceRecognitionStatus}</span>
            </div>
          </div>

          {/* OTP Flow for Students and Faculty */}
          {(isStudent || isFaculty) && !otpVerified && (
            <div className={styles.otpSection}>
              <h2 className={styles.sectionTitle}>OTP Verification</h2>
              <p className={styles.sectionDescription}>
                {sendingOtp
                  ? "Sending OTP to your mobile number..."
                  : otpSent
                  ? "Please enter the OTP code sent to your mobile number via SMS."
                  : "Please check the consent checkbox above to receive OTP."}
              </p>

              {sendingOtp && (
                <div className={styles.otpStep}>
                  <div
                    className={styles.spinner}
                    style={{ margin: "20px auto" }}
                  ></div>
                  <p className={styles.statusText}>Sending OTP...</p>
                </div>
              )}

              {otpSent && !sendingOtp && (
                <div className={styles.otpStep}>
                  <div className={styles.otpInputGroup}>
                    <label className={styles.formLabel}>
                      Enter OTP Code (4-8 digits)
                    </label>
                    <input
                      type="text"
                      className={styles.otpInput}
                      value={otpCode}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 8);
                        setOtpCode(value);
                      }}
                      placeholder="Enter OTP"
                      maxLength={8}
                      disabled={verifyingOtp}
                    />
                  </div>
                  <button
                    className={styles.enrollButton}
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp || otpCode.length < 4}
                  >
                    {verifyingOtp ? (
                      <>
                        <div className={styles.spinner}></div>
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <i className="bx bx-check"></i>
                        <span>Verify OTP</span>
                      </>
                    )}
                  </button>
                  <button
                    className={styles.cancelButton}
                    onClick={() => {
                      setOtpCode("");
                      setOtpSent(false);
                      handleSendOtp();
                    }}
                    disabled={verifyingOtp || sendingOtp}
                    style={{ marginTop: "10px" }}
                  >
                    <i className="bx bx-refresh"></i>
                    <span>Resend OTP</span>
                  </button>
                </div>
              )}

              {!consentChecked && !sendingOtp && (
                <p
                  className={styles.statusText}
                  style={{ color: "#f59e0b", marginTop: "10px" }}
                >
                  ⚠️ Please check the consent checkbox above first
                </p>
              )}
            </div>
          )}

          {/* Enrollment Options */}
          {!hasEnrolledBoth && (
            <div className={styles.enrollmentOptions}>
              {/* Device Biometric Panel - Only for Admin (not for Faculty) */}
              {!isStudent && !isFaculty && (
                <div className={styles.enrollmentPanel}>
                  <div className={styles.panelHeader}>
                    <i className="bx bx-face"></i>
                    <h3>Device Biometric (Required)</h3>
                  </div>
                  <div className={styles.panelBody}>
                    {!deviceChecks.checksDone ? (
                      <p>Checking device capabilities...</p>
                    ) : deviceChecks.webAuthnSupported ? (
                      <>
                        <p className={styles.statusText}>
                          {deviceChecks.platformAuthenticatorAvailable
                            ? "✅ Biometric sensor available"
                            : "❌ Device biometric unavailable on this device"}
                        </p>
                        {!enrollmentStatus.webauthn ? (
                          <>
                            {!consentChecked && (
                              <p
                                className={styles.statusText}
                                style={{
                                  color: "#f59e0b",
                                  marginBottom: "10px",
                                }}
                              >
                                ⚠️ Please check the consent checkbox above to
                                enable enrollment
                              </p>
                            )}
                            <button
                              className={styles.enrollButton}
                              onClick={handleWebAuthnEnrollment}
                              disabled={!canEnrollDevice || isEnrolling}
                              title={
                                !consentChecked
                                  ? "Please check consent checkbox first"
                                  : !deviceChecks.checksDone
                                  ? "Checking device capabilities..."
                                  : ""
                              }
                            >
                              {isEnrolling ? (
                                <>
                                  <div className={styles.spinner}></div>
                                  <span>Enrolling...</span>
                                </>
                              ) : (
                                <>
                                  <i className="bx bx-face"></i>
                                  <span>Register Device Biometric</span>
                                </>
                              )}
                            </button>
                          </>
                        ) : (
                          <button
                            className={styles.testButton}
                            onClick={handleTestWebAuthn}
                            disabled={isTesting.webauthn}
                          >
                            {isTesting.webauthn ? (
                              <>
                                <div className={styles.spinner}></div>
                                <span>Testing...</span>
                              </>
                            ) : (
                              <>
                                <i className="bx bx-check"></i>
                                <span>Test Biometric</span>
                              </>
                            )}
                          </button>
                        )}
                      </>
                    ) : (
                      <p className={styles.statusText}>
                        ❌ WebAuthn not supported on this device
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Face Enrollment Panel */}
              <div className={styles.enrollmentPanel}>
                <div className={styles.panelHeader}>
                  <i className="bx bx-camera"></i>
                  <h3>Face Recognition (Required)</h3>
                </div>
                <div className={styles.panelBody}>
                  {!deviceChecks.checksDone ? (
                    <p>Checking camera availability...</p>
                  ) : !deviceChecks.cameraAvailable ? (
                    <p className={styles.statusText}>
                      ❌ Camera not detected. Face enrollment unavailable on
                      this device.
                    </p>
                  ) : modelsLoading ? (
                    <>
                      <div
                        className={styles.spinner}
                        style={{ margin: "10px auto" }}
                      ></div>
                      <p className={styles.statusText}>
                        ⏳ Loading face recognition models...
                      </p>
                    </>
                  ) : modelError ? (
                    <>
                      <p
                        className={styles.statusText}
                        style={{ color: "#ef4444" }}
                      >
                        ⚠️ {modelError}
                      </p>
                      <button
                        className={styles.enrollButton}
                        onClick={handleRetryModels}
                        disabled={modelsLoading}
                      >
                        {modelsLoading ? (
                          <>
                            <div className={styles.spinner}></div>
                            <span>Retrying...</span>
                          </>
                        ) : (
                          <>
                            <i className="bx bx-refresh"></i>
                            <span>Retry Loading Models</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : !modelsLoaded ? (
                    <p className={styles.statusText}>
                      Face recognition models failed to load. Please ensure
                      models are in /public/models directory.
                    </p>
                  ) : (
                    <>
                      <p className={styles.statusText}>
                        ✅ Camera and models ready
                      </p>
                      {!enrollmentStatus.face ? (
                        <>
                          {!showFaceCapture ? (
                            <>
                              {!consentChecked && (
                                <p
                                  className={styles.statusText}
                                  style={{
                                    color: "#f59e0b",
                                    marginBottom: "10px",
                                  }}
                                >
                                  ⚠️ Please check the consent checkbox above to
                                  enable enrollment
                                </p>
                              )}
                              {(isStudent || isFaculty) && !otpVerified && (
                                <p
                                  className={styles.statusText}
                                  style={{
                                    color: "#f59e0b",
                                    marginBottom: "10px",
                                  }}
                                >
                                  ⚠️ Please verify OTP first to unlock face
                                  enrollment
                                </p>
                              )}
                              <button
                                className={styles.enrollButton}
                                onClick={startFaceCapture}
                                disabled={!canEnrollFace || isEnrolling}
                                title={
                                  !consentChecked
                                    ? "Please check consent checkbox first"
                                    : (isStudent || isFaculty) && !otpVerified
                                    ? "Please verify OTP first"
                                    : !deviceChecks.checksDone
                                    ? "Checking device capabilities..."
                                    : !modelsLoaded
                                    ? "Models still loading..."
                                    : ""
                                }
                              >
                                <i className="bx bx-camera"></i>
                                <span>Enroll Face</span>
                              </button>
                            </>
                          ) : (
                            <div className={styles.faceCaptureContainer}>
                              {capturedImage ? (
                                // Show captured image preview with retake option
                                <>
                                  <div
                                    style={{
                                      position: "relative",
                                      width: "100%",
                                      maxWidth: "500px",
                                    }}
                                  >
                                    <img
                                      src={capturedImage}
                                      alt="Captured face"
                                      className={styles.capturedPreview}
                                    />
                                    <div
                                      style={{
                                        position: "absolute",
                                        top: "10px",
                                        right: "10px",
                                        background: "rgba(0, 0, 0, 0.7)",
                                        color: "white",
                                        padding: "8px 12px",
                                        borderRadius: "8px",
                                        fontSize: "0.85rem",
                                        fontWeight: "600",
                                      }}
                                    >
                                      📸 Captured
                                    </div>
                                  </div>
                                  {enrollmentProgress && (
                                    <div className={styles.progressMessage}>
                                      <div className={styles.spinner}></div>
                                      <span>{enrollmentProgress}</span>
                                    </div>
                                  )}
                                  {!enrollmentProgress && !isEnrolling && (
                                    <div
                                      style={{
                                        padding: "12px",
                                        background: "#fef3c7",
                                        borderRadius: "8px",
                                        marginBottom: "8px",
                                        textAlign: "center",
                                        fontSize: "0.9rem",
                                        color: "#92400e",
                                      }}
                                    >
                                      <strong>Review your photo</strong>
                                      <br />
                                      <span style={{ fontSize: "0.85rem" }}>
                                        Not satisfied? Click "Retake Picture" to
                                        capture again
                                      </span>
                                    </div>
                                  )}
                                  <div className={styles.faceCaptureButtons}>
                                    <button
                                      className={styles.retakeButton}
                                      onClick={retakePicture}
                                      disabled={isEnrolling}
                                    >
                                      <i className="bx bx-refresh"></i>
                                      <span>Retake Picture</span>
                                    </button>
                                    <button
                                      className={styles.captureButton}
                                      onClick={enrollCapturedFace}
                                      disabled={isEnrolling}
                                    >
                                      {isEnrolling ? (
                                        <>
                                          <div className={styles.spinner}></div>
                                          <span>Enrolling...</span>
                                        </>
                                      ) : (
                                        <>
                                          <i className="bx bx-check"></i>
                                          <span>Confirm & Enroll</span>
                                        </>
                                      )}
                                    </button>
                                    <button
                                      className={styles.cancelButton}
                                      onClick={() => {
                                        setShowFaceCapture(false);
                                        setCapturedImage(null);
                                        setCapturedDescriptor(null);
                                        stopCamera();
                                        setEnrollmentProgress("");
                                      }}
                                      disabled={isEnrolling}
                                    >
                                      <i className="bx bx-x"></i>
                                      <span>Cancel</span>
                                    </button>
                                  </div>
                                </>
                              ) : (
                                // Show live video feed for capture
                                <>
                                  <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={styles.videoPreview}
                                  />
                                  <canvas
                                    ref={canvasRef}
                                    style={{ display: "none" }}
                                  />
                                  {enrollmentProgress && (
                                    <div className={styles.progressMessage}>
                                      <div className={styles.spinner}></div>
                                      <span>{enrollmentProgress}</span>
                                    </div>
                                  )}
                                  <div className={styles.faceCaptureButtons}>
                                    <button
                                      className={styles.captureButton}
                                      onClick={captureFaceImage}
                                      disabled={
                                        isEnrolling ||
                                        !!enrollmentProgress ||
                                        !modelsLoaded
                                      }
                                      title={
                                        !modelsLoaded
                                          ? "Face recognition models are still loading. Please wait."
                                          : ""
                                      }
                                    >
                                      {enrollmentProgress ? (
                                        <>
                                          <div className={styles.spinner}></div>
                                          <span>Processing...</span>
                                        </>
                                      ) : (
                                        <>
                                          <i className="bx bx-camera"></i>
                                          <span>Capture Picture</span>
                                        </>
                                      )}
                                    </button>
                                    <button
                                      className={styles.cancelButton}
                                      onClick={() => {
                                        setShowFaceCapture(false);
                                        setCapturedImage(null);
                                        setCapturedDescriptor(null);
                                        stopCamera();
                                        setEnrollmentProgress("");
                                      }}
                                      disabled={!!enrollmentProgress}
                                    >
                                      <i className="bx bx-x"></i>
                                      <span>Cancel</span>
                                    </button>
                                  </div>
                                  {!enrollmentProgress && (
                                    <p
                                      style={{
                                        fontSize: "0.85rem",
                                        color: "#6b7280",
                                        textAlign: "center",
                                        margin: "8px 0 0 0",
                                      }}
                                    >
                                      💡 Ensure good lighting and look directly
                                      at the camera
                                    </p>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {showFaceCapture ? (
                            <div className={styles.faceCaptureContainer}>
                              <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={styles.videoPreview}
                              />
                              <canvas
                                ref={canvasRef}
                                style={{ display: "none" }}
                              />
                              <button
                                className={styles.testButton}
                                onClick={handleTestFace}
                                disabled={isTesting.face}
                              >
                                {isTesting.face ? (
                                  <>
                                    <div className={styles.spinner}></div>
                                    <span>Testing...</span>
                                  </>
                                ) : (
                                  <>
                                    <i className="bx bx-check"></i>
                                    <span>Test Face</span>
                                  </>
                                )}
                              </button>
                              <button
                                className={styles.cancelButton}
                                onClick={() => {
                                  setShowFaceCapture(false);
                                  setCapturedImage(null);
                                  setCapturedDescriptor(null);
                                  stopCamera();
                                }}
                              >
                                Close
                              </button>
                            </div>
                          ) : (
                            <button
                              className={styles.testButton}
                              onClick={() => {
                                setShowFaceCapture(true);
                                setCapturedImage(null);
                                setCapturedDescriptor(null);
                                startCamera();
                              }}
                              disabled={isTesting.face}
                            >
                              <i className="bx bx-check"></i>
                              <span>Test Face</span>
                            </button>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Success State */}
          {hasEnrolledBoth && (
            <div className={styles.successSection}>
              <div className={styles.successIcon}>
                <i className="bx bx-check-circle"></i>
              </div>
              <p className={styles.successText}>
                Biometric enrollment complete! You can now use biometric
                authentication for attendance.
              </p>
              <button
                className={styles.continueButton}
                onClick={() => {
                  // Redirect based on role
                  if (isFaculty) {
                    navigate("/faculty/dashboard", { replace: true });
                  } else if (isStudent) {
                    navigate("/student/dashboard", { replace: true });
                  } else {
                    navigate("/login", { replace: true });
                  }
                }}
              >
                Continue to Dashboard
              </button>
            </div>
          )}

          {/* Skip Button */}
          {!hasEnrolledBoth && (
            <div className={styles.skipSection}>
              <button
                className={styles.skipButton}
                onClick={handleSkip}
                disabled={isEnrolling}
              >
                Skip for now
              </button>
              <p className={styles.skipNote}>
                Note:{" "}
                {isStudent || isFaculty
                  ? "Face enrollment is required to mark attendance. You can enroll later from your profile."
                  : "Both biometrics are required to mark attendance. You can enroll later from your profile."}
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default OnboardBiometrics;
