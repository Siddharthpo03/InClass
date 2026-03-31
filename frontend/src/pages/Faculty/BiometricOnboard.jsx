import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { startRegistration } from "@simplewebauthn/browser";
import apiClient from "../../utils/apiClient";
import TopNav from "../../components/faculty/TopNav";
import Sidebar from "../../components/faculty/Sidebar";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ToastContainer from "../../components/shared/ToastContainer";
import Modal from "../../components/shared/Modal";
import { enrollFace, recognizeFace } from "../../services/faceRecognitionApi";
import useDeviceChecks from "../../hooks/useDeviceChecks";
import styles from "./BiometricOnboard.module.css";

const BiometricOnboard = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [facultyProfile, setFacultyProfile] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // 1: Consent, 2: OTP, 3: Face, 4: WebAuthn, 5: Complete
  const [consentChecked, setConsentChecked] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState({
    webauthn: false,
    face: false,
    consent: false,
  });
  const [toasts, setToasts] = useState([]);

  // OTP flow state
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Face capture state
  const [modelsLoaded] = useState(true);
  const [modelsLoading] = useState(false);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [capturedDescriptor, setCapturedDescriptor] = useState(null);
  const [enrollmentProgress, setEnrollmentProgress] = useState("");

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const deviceChecks = useDeviceChecks();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, show: true }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch profile and userId
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("inclass_token");
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await apiClient.get("/auth/profile");
        if (response.data?.userId) {
          setUserId(response.data.userId.toString());
        }
        if (response.data?.role !== "faculty") {
          showToast("This page is for faculty only.", "error");
          navigate("/faculty/dashboard");
          return;
        }
        setFacultyProfile(response.data);
        checkBiometricStatus();
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate("/login");
        }
      }
    };
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when userId/profile available
  }, [navigate, showToast]);

  // FaceNet is handled on the backend; no client-side model loading needed.

  // Check existing enrollment status
  const checkBiometricStatus = async () => {
    if (!userId) return;
    try {
      const response = await apiClient.get(`/biometrics/status?userId=${userId}`);
      if (response.data) {
        setEnrollmentStatus({
          webauthn: response.data.webauthn || false,
          face: response.data.face || false,
          consent: response.data.consent || false,
        });
        // Auto-advance steps if already enrolled
        if (response.data.consent && !otpVerified) {
          setCurrentStep(2);
        }
        if (response.data.face && !enrollmentStatus.webauthn) {
          setCurrentStep(4);
        }
      }
    } catch (error) {
      console.log("Biometric status check failed:", error);
    }
  };

  // Step 1: Consent
  const handleConsentSubmit = async () => {
    if (!consentChecked) {
      showToast("Please check the consent checkbox to proceed.", "error");
      return;
    }
    if (!userId) {
      showToast("User ID not found. Please refresh the page.", "error");
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
      setCurrentStep(2);
      showToast("Consent submitted successfully.", "success");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to submit consent.",
        "error"
      );
    }
  };

  // Step 2: OTP
  const handleSendOtp = async () => {
    if (!userId) {
      showToast("User ID not found.", "error");
      return;
    }
    setSendingOtp(true);
    try {
      await apiClient.post("/auth/send-otp", { userId });
      setOtpSent(true);
      showToast("OTP sent to your registered mobile number.", "success");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to send OTP.",
        "error"
      );
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length < 4) {
      showToast("Please enter a valid OTP code.", "error");
      return;
    }
    setVerifyingOtp(true);
    try {
      await apiClient.post("/auth/verify-otp", { userId, otp: otpCode });
      setOtpVerified(true);
      setCurrentStep(3);
      showToast("OTP verified successfully!", "success");
    } catch (error) {
      showToast(
        error.response?.data?.message || "Invalid OTP. Please try again.",
        "error"
      );
      setOtpCode("");
    } finally {
      setVerifyingOtp(false);
    }
  };

  // Step 3: Face Enrollment
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      showToast("Failed to access camera. Please check permissions.", "error");
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

  const captureFaceImage = async () => {
    if (!videoRef.current || !canvasRef.current) {
      showToast("Camera not ready.", "error");
      return;
    }
    setEnrollmentProgress("Capturing image...");
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setCapturedImage(imageDataUrl);
      setEnrollmentProgress("");
      stopCamera();
    } catch (error) {
      showToast(error.message || "Failed to capture face.", "error");
      setEnrollmentProgress("");
      setCapturedImage(null);
      setCapturedDescriptor(null);
    }
  };

  const enrollCapturedFace = async () => {
    if (!capturedImage || !userId) {
      showToast("No face image available.", "error");
      return;
    }
    setIsEnrolling(true);
    setEnrollmentProgress("Sending to server...");
    try {
      const resp = await fetch(capturedImage);
      const blob = await resp.blob();

      await enrollFace({ userId, imageBlob: blob });

      setEnrollmentStatus((prev) => ({ ...prev, face: true }));
      setShowFaceCapture(false);
      setCapturedImage(null);
      setCapturedDescriptor(null);
      setCurrentStep(4);
      showToast("Face enrolled successfully!", "success");
      await checkBiometricStatus();
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to enroll face.",
        "error"
      );
    } finally {
      setIsEnrolling(false);
      setEnrollmentProgress("");
    }
  };

  // Step 4: WebAuthn (MANDATORY for faculty)
  const handleWebAuthnEnroll = async () => {
    if (!deviceChecks.platformAuthenticatorAvailable) {
      showToast("Device biometric is not available on this device.", "error");
      return;
    }
    setIsEnrolling(true);
    try {
      const optionsResponse = await apiClient.post(
        "/biometrics/webauthn/register/options",
        { userId }
      );
      const options = optionsResponse.data;
      const registrationResponse = await startRegistration(options);
      const completeResponse = await apiClient.post(
        "/biometrics/webauthn/register/complete",
        {
          userId,
          registrationResponse,
        }
      );
      if (completeResponse.data?.verified) {
        setEnrollmentStatus((prev) => ({ ...prev, webauthn: true }));
        setCurrentStep(5);
        showToast("Device biometric enrolled successfully!", "success");
      }
    } catch (error) {
      showToast(
        error.response?.data?.message || "Failed to enroll device biometric.",
        "error"
      );
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleComplete = () => {
    showToast("Biometric onboarding completed!", "success");
    navigate("/faculty/dashboard");
  };

  const handleLogout = useCallback(() => {
    localStorage.removeItem("inclass_token");
    localStorage.removeItem("user_role");
    navigate("/login");
  }, [navigate]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  if (!facultyProfile) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }

  return (
    <div className={styles.onboardWrapper}>
      <TopNav profile={facultyProfile} onLogout={handleLogout} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.onboardContainer}>
        <div className={styles.onboardCard}>
          <div className={styles.header}>
            <h1 className={styles.title}>Biometric Onboarding</h1>
            <p className={styles.subtitle}>
              Complete all steps to secure your account with biometric authentication.
            </p>
          </div>

          {/* Progress Indicator */}
          <div className={styles.progressSection}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className={styles.stepIndicator}>
              Step {currentStep} of {totalSteps}
            </div>
          </div>

          {/* Step 1: Consent */}
          {currentStep === 1 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Step 1: Biometric Consent</h2>
              <div className={styles.consentText}>
                <p>
                  I consent to the collection and use of my biometric data (face
                  and device biometric) for identity verification and attendance
                  marking. I understand that encrypted templates will be stored
                  securely.
                </p>
              </div>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className={styles.checkbox}
                />
                <span>I consent to biometric data collection and use</span>
              </label>
              <button
                className={styles.primaryButton}
                onClick={handleConsentSubmit}
                disabled={!consentChecked}
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: OTP Verification */}
          {currentStep === 2 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Step 2: OTP Verification</h2>
              <p className={styles.stepDescription}>
                Verify your mobile number with an OTP code.
              </p>
              {!otpSent ? (
                <button
                  className={styles.primaryButton}
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                >
                  {sendingOtp ? "Sending..." : "Send OTP"}
                </button>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className={styles.otpInput}
                    maxLength={8}
                  />
                  <button
                    className={styles.primaryButton}
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp || !otpCode}
                  >
                    {verifyingOtp ? "Verifying..." : "Verify OTP"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Step 3: Face Enrollment */}
          {currentStep === 3 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>Step 3: Face Enrollment</h2>
              <p className={styles.stepDescription}>
                Capture your face for identity verification.
              </p>
              {!showFaceCapture ? (
                <button
                  className={styles.primaryButton}
                  onClick={() => {
                    setShowFaceCapture(true);
                    startCamera();
                  }}
                  disabled={!modelsLoaded || modelsLoading}
                >
                  {modelsLoading ? "Loading models..." : "Start Face Capture"}
                </button>
              ) : (
                <div className={styles.faceCaptureContainer}>
                  {!capturedImage ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className={styles.videoPreview}
                      />
                      <canvas ref={canvasRef} style={{ display: "none" }} />
                      <div className={styles.captureButtons}>
                        <button
                          className={styles.captureButton}
                          onClick={captureFaceImage}
                          disabled={!!enrollmentProgress}
                        >
                          {enrollmentProgress || "Capture Face"}
                        </button>
                        <button
                          className={styles.cancelButton}
                          onClick={() => {
                            setShowFaceCapture(false);
                            stopCamera();
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <img
                        src={capturedImage}
                        alt="Captured face"
                        className={styles.capturedImage}
                      />
                      <div className={styles.captureButtons}>
                        <button
                          className={styles.primaryButton}
                          onClick={enrollCapturedFace}
                          disabled={isEnrolling}
                        >
                          {isEnrolling ? "Enrolling..." : "Enroll Face"}
                        </button>
                        <button
                          className={styles.cancelButton}
                          onClick={() => {
                            setCapturedImage(null);
                            setCapturedDescriptor(null);
                            startCamera();
                          }}
                        >
                          Retake
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: WebAuthn (MANDATORY) */}
          {currentStep === 4 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>
                Step 4: Device Biometric (Required)
              </h2>
              <p className={styles.stepDescription}>
                Enroll your face for secure
                authentication.
              </p>
              {!deviceChecks.platformAuthenticatorAvailable ? (
                <div className={styles.errorBox}>
                  Device biometric is not available on this device. Please use
                  a device with a camera for face recognition.
                </div>
              ) : enrollmentStatus.webauthn ? (
                <div className={styles.successBox}>
                  ✅ Device biometric already enrolled!
                  <button
                    className={styles.primaryButton}
                    onClick={() => setCurrentStep(5)}
                  >
                    Continue
                  </button>
                </div>
              ) : (
                <button
                  className={styles.primaryButton}
                  onClick={handleWebAuthnEnroll}
                  disabled={isEnrolling}
                >
                  {isEnrolling ? "Enrolling..." : "Enroll Device Biometric"}
                </button>
              )}
            </div>
          )}

          {/* Step 5: Complete */}
          {currentStep === 5 && (
            <div className={styles.stepContent}>
              <h2 className={styles.stepTitle}>✅ Onboarding Complete!</h2>
              <p className={styles.stepDescription}>
                You have successfully completed biometric onboarding. You can
                now use biometric authentication for login and attendance.
              </p>
              <button
                className={styles.primaryButton}
                onClick={handleComplete}
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default React.memo(BiometricOnboard);



