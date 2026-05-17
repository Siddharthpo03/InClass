import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import useDarkMode from "../../hooks/useDarkMode";
import { registerFace } from "../../services/biometricsApi";
import styles from "./OnboardBiometricsModern.module.css";

const FACE_POSES = ["front", "left", "right", "up"];

const POSE_INSTRUCTIONS = {
  front: "Look straight at the camera",
  left: "Turn your face to the LEFT",
  right: "Turn your face to the RIGHT",
  up: "Tilt your face UP",
};

const OnboardBiometricsModern = () => {
  useDarkMode();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userId, setUserId] = useState(null);
  const [step, setStep] = useState("consent");
  const [consentChecked, setConsentChecked] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [enrolledMethods, setEnrolledMethods] = useState({
    face: false,
    webauthn: false,
  });

  // OTP Flow State
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [capturedImages, setCapturedImages] = useState([]);
  const [countdown, setCountdown] = useState(null);
  const [isGetReady, setIsGetReady] = useState(false);
  const [nextPose, setNextPose] = useState(null);
  const [hasStartedCaptureSequence, setHasStartedCaptureSequence] =
    useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const cooldownTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const captureTimerRef = useRef(null);
  const isCaptureInProgress = useRef(false);

  // Get userId from params or token
  useEffect(() => {
    const userIdFromParams = searchParams.get("userId");
    if (userIdFromParams) {
      setUserId(userIdFromParams);
    } else {
      const token = localStorage.getItem("inclass_token");
      if (!token) {
        navigate("/login");
      }
    }
  }, [searchParams, navigate]);

  useEffect(
    () => () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (captureTimerRef.current) {
        clearInterval(captureTimerRef.current);
      }
      isCaptureInProgress.current = false;
    };
  }, []);

  const clearCaptureTimers = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (captureTimerRef.current) {
      clearInterval(captureTimerRef.current);
      captureTimerRef.current = null;
    }
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = null;
    }
  };

  // OTP Handlers
  const handleSendOtp = async () => {
    if (!userId) {
      setErrorMessage("User ID not found.");
      return;
    }

    if (sendingOtp || resendCooldown > 0) {
      return;
    }

    setSendingOtp(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await apiClient.post("/auth/send-otp", { userId });
      setOtpSent(true);
      setResendCooldown(60);
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
      cooldownTimerRef.current = setTimeout(() => {
        setResendCooldown(0);
      }, 60000);
      const deliveryAddress =
        response.data?.maskedEmail ||
        response.data?.email ||
        "your college email";
      setSuccessMessage(
        `✅ OTP sent to ${deliveryAddress}. Please check your inbox.`,
      );
    } catch (error) {
      console.error("Send OTP error:", error);
      setErrorMessage(
        error.response?.data?.message ||
          "Failed to send OTP. Please try again.",
      );
    } finally {
      setSendingOtp(false);
    }
  };

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
      setSuccessMessage("✅ OTP verified! You can now enroll your face.");
      // Move to face capture step after 1 second
      setTimeout(() => {
        setStep("face");
        setCapturedImages([]);
        setCountdown(null);
        setIsGetReady(false);
        setNextPose(null);
        setHasStartedCaptureSequence(false);
        isCaptureInProgress.current = false;
        setTimeout(startCamera, 100);
      }, 1000);
    } catch (error) {
      console.error("Verify OTP error:", error);
      setErrorMessage(
        error.response?.data?.message || "Invalid OTP. Please try again.",
      );
      setOtpCode("");
    } finally {
      setVerifyingOtp(false);
    }
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
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setErrorMessage("Camera access denied. Please check your permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const captureFaceImage = async () => {
    if (!isCaptureInProgress.current) return;
    if (!canvasRef.current || !videoRef.current) {
      isCaptureInProgress.current = false;
      return;
    }
    setIsEnrolling(true);

    try {
      const ctx = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);

      const imageBlob = await new Promise((resolve, reject) => {
        canvasRef.current.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to capture face image."));
          },
          "image/jpeg",
          0.92,
        );
      });
      const imageDataUrl = canvasRef.current.toDataURL("image/jpeg", 0.92);
      const nextImages = [...capturedImages, imageDataUrl];
      setCapturedImages(nextImages);

      if (nextImages.length >= FACE_POSES.length) {
        clearCaptureTimers();
        setCountdown(null);
        setIsGetReady(false);
        setNextPose(null);
        setHasStartedCaptureSequence(false);
        isCaptureInProgress.current = false;
        stopCamera();
        setSuccessMessage("All poses captured. Click Enroll Face to continue.");
      } else {
        setSuccessMessage(
          `Captured ${nextImages.length}/${FACE_POSES.length}. Next pose: ${FACE_POSES[nextImages.length]}.`,
        );
        isCaptureInProgress.current = false;
        setIsGetReady(true);
        setNextPose(FACE_POSES[nextImages.length]);
        // after a short get-ready transition, start the next countdown automatically
        clearCaptureTimers();
        captureTimerRef.current = setTimeout(() => {
          setIsGetReady(false);
          setNextPose(null);
          startPoseCapture(nextImages.length);
        }, 2000);
      }
    } catch (err) {
      const msg =
        err.response?.data?.error?.message || "Face enrollment failed";
      setErrorMessage(msg);
      setIsGetReady(false);
      setNextPose(null);
      setHasStartedCaptureSequence(false);
      isCaptureInProgress.current = false;
    } finally {
      setIsEnrolling(false);
    }
  };

  const startPoseCapture = (poseIndex = capturedImages.length) => {
    if (isCaptureInProgress.current) return;
    // If already counting down or finished, do nothing
    if (countdown !== null) return;
    if (isGetReady) return;
    if (poseIndex >= FACE_POSES.length) return;

    isCaptureInProgress.current = true;

    // Start a 3 second countdown
    clearCaptureTimers();
    setCountdown(3);
    let current = 3;
    countdownIntervalRef.current = setInterval(() => {
      current -= 1;
      if (current <= 0) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
        setCountdown(null);
        // Trigger capture
        captureFaceImage();
      } else {
        setCountdown(current);
      }
    }, 1000);
  };

  const handleStartCapture = () => {
    if (hasStartedCaptureSequence) return;
    setHasStartedCaptureSequence(true);
    setIsGetReady(false);
    setNextPose(null);
    startPoseCapture(capturedImages.length);
  };

  const handleSkip = () => {
    setStep("complete");
  };

  const handleEnrollFace = async () => {
    if (!userId || capturedImages.length === 0) {
      setErrorMessage("Capture at least one face image first.");
      return;
    }

    setIsEnrolling(true);
    setErrorMessage(null);

    try {
      const response = await registerFace({ userId, images: capturedImages });
      if (response?.success || response?.message) {
        setEnrolledMethods((prev) => ({ ...prev, face: true }));
        setSuccessMessage("Face enrolled successfully!");
        stopCamera();
        setStep("complete");
      } else {
        throw new Error(response?.message || "Face enrollment failed.");
      }
    } catch (error) {
      console.error("Face enrollment error:", error);
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Failed to enroll face.",
      );
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleContinueToDashboard = () => {
    navigate("/student/dashboard");
  };

  return (
    <div className={styles.wrapper}>
      <Navigation />
      <div className={styles.container}>
        {/* Consent Step */}
        {step === "consent" && (
          <div className={styles.card}>
            <div className={styles.header}>
              <div className={styles.icon}>
                <i className="bx bx-lock"></i>
              </div>
              <h1>Secure Your Account</h1>
              <p>Add biometric authentication for enhanced security</p>
            </div>

            <div className={styles.content}>
              {errorMessage && (
                <div className={styles.alert} role="alert">
                  <i className="bx bx-exclamation-circle"></i>
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className={styles.consentBox}>
                <h3>Biometric Data Agreement</h3>
                <div className={styles.consentText}>
                  <p>
                    <strong>Your Privacy & Security:</strong> We use biometric
                    data to verify your identity securely. Your face and device
                    credentials are:
                  </p>
                  <ul>
                    <li>
                      <i className="bx bx-check"></i>
                      <span>
                        Processed temporarily and stored only as an embedding
                      </span>
                    </li>
                    <li>
                      <i className="bx bx-check"></i>
                      <span>Never shared with third parties</span>
                    </li>
                    <li>
                      <i className="bx bx-check"></i>
                      <span>Used only for authentication on this platform</span>
                    </li>
                    <li>
                      <i className="bx bx-check"></i>
                      <span>
                        Protected by industry-standard security protocols
                      </span>
                    </li>
                  </ul>
                  <p style={{ marginTop: "1rem" }}>
                    By proceeding, you consent to the collection and use of your
                    biometric data for account security purposes.
                  </p>
                </div>
              </div>

              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                />
                <span>I agree to the biometric data collection and usage</span>
              </label>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.secondaryButton}
                onClick={() => navigate("/student/dashboard")}
              >
                <i className="bx bx-arrow-back"></i>
                Skip for Now
              </button>
              <button
                className={styles.primaryButton}
                onClick={() => {
                  setStep("otp");
                }}
                disabled={!consentChecked}
              >
                <i className="bx bx-camera"></i>
                Continue to Setup
              </button>
            </div>
          </div>
        )}

        {/* OTP Verification Step */}
        {step === "otp" && (
          <div className={styles.card}>
            <div className={styles.header}>
              <div className={styles.icon}>
                <i className="bx bx-lock-alt"></i>
              </div>
              <h1>Verify Your Identity</h1>
              <p>Enter the OTP code sent to your college email</p>
            </div>

            <div className={styles.content}>
              {errorMessage && (
                <div className={styles.alert} role="alert">
                  <i className="bx bx-exclamation-circle"></i>
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className={styles.successAlert}>
                  <i className="bx bx-check-circle"></i>
                  <span>{successMessage}</span>
                </div>
              )}

              <div className={styles.otpBox}>
                <p className={styles.otpLabel}>
                  {otpSent
                    ? "A 6-digit OTP has been sent to your registered email address."
                    : "Send an OTP to continue."}
                </p>
                {!otpSent ? (
                  <button
                    className={styles.primaryButton}
                    onClick={handleSendOtp}
                    disabled={sendingOtp || resendCooldown > 0}
                  >
                    {sendingOtp ? "Sending..." : "Send OTP"}
                  </button>
                ) : null}
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter OTP code"
                  value={otpCode}
                  onChange={(e) =>
                    setOtpCode(e.target.value.replace(/\D/g, ""))
                  }
                  className={styles.otpInput}
                  disabled={verifyingOtp}
                />
                <p className={styles.otpHint}>
                  {otpSent && (
                    <>
                      Didn't receive OTP?{" "}
                      <button
                        className={styles.resendButton}
                        onClick={handleSendOtp}
                        disabled={sendingOtp || resendCooldown > 0}
                      >
                        {sendingOtp
                          ? "Sending..."
                          : resendCooldown > 0
                            ? `Resend in ${resendCooldown}s`
                            : "Resend OTP"}
                      </button>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.secondaryButton}
                onClick={() => setStep("consent")}
              >
                <i className="bx bx-arrow-back"></i>
                Back
              </button>
              <button
                className={styles.primaryButton}
                onClick={handleVerifyOtp}
                disabled={verifyingOtp || !otpCode}
              >
                {verifyingOtp ? (
                  <>
                    <span className={styles.spinner}></span>
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <i className="bx bx-check"></i>
                    <span>Verify OTP</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Face Capture Step */}
        {step === "face" && (
          <div className={styles.card}>
            <div className={styles.header}>
              <div className={styles.icon}>
                <i className="bx bx-camera"></i>
              </div>
              <h1>Capture Your Face</h1>
              <p>Look directly at the camera for 3-5 seconds</p>
            </div>

            <div className={styles.content}>
              {errorMessage && (
                <div className={styles.alert} role="alert">
                  <i className="bx bx-exclamation-circle"></i>
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className={styles.successAlert}>
                  <i className="bx bx-check-circle"></i>
                  <span>{successMessage}</span>
                </div>
              )}

              <div className={styles.videoContainer}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={styles.video}
                />
                <canvas ref={canvasRef} style={{ display: "none" }} />
                <div className={styles.videoOverlay}>
                  {isGetReady ? (
                    <>
                      <div className={styles.countdownOverlay}>
                        <span className={styles.countdownNumber}>GET READY</span>
                      </div>
                      <div className={styles.poseInstruction}>
                        {`Now ${POSE_INSTRUCTIONS[nextPose] || "prepare for the next pose"} - Get Ready...`}
                      </div>
                    </>
                  ) : (
                    <div className={styles.poseInstruction}>
                      {POSE_INSTRUCTIONS[FACE_POSES[capturedImages.length]] || "Position your face"}
                    </div>
                  )}
                  <div className={styles.progressIndicator}>
                    Pose {Math.min(capturedImages.length + 1, FACE_POSES.length)}/{FACE_POSES.length}
                  </div>
                  {countdown !== null && !isGetReady && (
                    <div className={styles.countdownOverlay}>
                      <span className={styles.countdownNumber}>{countdown}</span>
                    </div>
                  )}
                </div>
                <div className={styles.frameGuide}>
                  <div className={styles.corner} style={{ top: 0, left: 0 }} />
                  <div className={styles.corner} style={{ top: 0, right: 0 }} />
                  <div
                    className={styles.corner}
                    style={{ bottom: 0, left: 0 }}
                  />
                  <div
                    className={styles.corner}
                    style={{ bottom: 0, right: 0 }}
                  />
                </div>
              </div>

              <div className={styles.instructions}>
                <h4>Tips for Best Results</h4>
                <ul>
                  <li>
                    <i className="bx bx-check"></i>
                    <span>Ensure good lighting on your face</span>
                  </li>
                  <li>
                    <i className="bx bx-check"></i>
                    <span>Capture front, left, right, and up poses</span>
                  </li>
                  <li>
                    <i className="bx bx-check"></i>
                    <span>Keep your face within the frame</span>
                  </li>
                  <li>
                    <i className="bx bx-check"></i>
                    <span>Remove sunglasses and obstructions</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.secondaryButton}
                onClick={() => {
                  clearCaptureTimers();
                  setCountdown(null);
                  setIsGetReady(false);
                  setNextPose(null);
                  setHasStartedCaptureSequence(false);
                  isCaptureInProgress.current = false;
                  setStep("otp");
                }}
              >
                <i className="bx bx-arrow-back"></i>
                Back
              </button>
              {!hasStartedCaptureSequence && capturedImages.length < FACE_POSES.length && (
                <button
                  className={styles.primaryButton}
                  onClick={handleStartCapture}
                  disabled={
                    countdown !== null ||
                    isEnrolling ||
                    capturedImages.length >= FACE_POSES.length ||
                    isCaptureInProgress.current
                  }
                >
                  {countdown !== null ? (
                    `Capturing in ${countdown}...`
                  ) : (
                    <>
                      <i className="bx bx-check"></i>
                      <span>Start Capture</span>
                    </>
                  )}
                </button>
              )}
              {capturedImages.length >= FACE_POSES.length && (
                <button
                  className={styles.secondaryButton}
                  onClick={handleEnrollFace}
                  disabled={isEnrolling}
                >
                  Enroll Face
                </button>
              )}
            </div>
            <div className={styles.previewStrip}>
              {capturedImages.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Captured pose ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completion Step */}
        {step === "complete" && (
          <div className={styles.card}>
            <div className={styles.header}>
              <div className={`${styles.icon} ${styles.success}`}>
                <i className="bx bx-check"></i>
              </div>
              <h1>Setup Complete!</h1>
              <p>Your account is now secured with biometric authentication</p>
            </div>

            <div className={styles.content}>
              <div className={styles.completionBox}>
                <h3>Enrolled Methods</h3>
                <div className={styles.methodsList}>
                  <div
                    className={`${styles.method} ${enrolledMethods.face ? styles.enabled : ""}`}
                  >
                    <div className={styles.methodIcon}>
                      <i className="bx bx-face"></i>
                    </div>
                    <div>
                      <p className={styles.methodName}>Face Recognition</p>
                      <p className={styles.methodStatus}>
                        {enrolledMethods.face ? "✓ Enrolled" : "Not enrolled"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.features}>
                <h4>What You Can Now Do</h4>
                <ul>
                  <li>
                    <i className="bx bx-check-circle"></i>
                    <span>Quick login with face recognition</span>
                  </li>
                  <li>
                    <i className="bx bx-check-circle"></i>
                    <span>Secure attendance marking</span>
                  </li>
                  <li>
                    <i className="bx bx-check-circle"></i>
                    <span>Protected account access</span>
                  </li>
                  <li>
                    <i className="bx bx-check-circle"></i>
                    <span>Update biometrics anytime in settings</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className={styles.actions}>
              <button
                className={styles.primaryButton}
                onClick={handleContinueToDashboard}
              >
                <i className="bx bx-arrow-right"></i>
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default OnboardBiometricsModern;
