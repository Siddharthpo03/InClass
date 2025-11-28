import React, { useRef, useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import styles from "./FaceEnrollmentModal.module.css";

/**
 * Modal component for face enrollment with liveness checks
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback to close modal
 * @param {string|number} props.userId - User ID for enrollment
 * @param {Function} props.onSuccess - Callback when enrollment succeeds
 */
const FaceEnrollmentModal = ({ isOpen, onClose, userId, onSuccess }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImages, setCapturedImages] = useState([]);
  const [step, setStep] = useState("instructions"); // 'instructions' | 'capture' | 'uploading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState(null);
  const [livenessStep, setLivenessStep] = useState(0); // 0: ready, 1: blink, 2: turn head

  // Cleanup stream on unmount or close
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen && step === "capture") {
      startCamera();
    } else if (!isOpen) {
      stopCamera();
      resetState();
    }
  }, [isOpen, step]);

  const resetState = () => {
    setStep("instructions");
    setCapturedImages([]);
    setLivenessStep(0);
    setErrorMessage(null);
  };

  const startCamera = async () => {
    try {
      setErrorMessage(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      streamRef.current = stream;
      setIsStreaming(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setErrorMessage(err.message || "Failed to access camera. Please check permissions.");
      setStep("error");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) {
      setErrorMessage("Video not ready. Please wait.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImages((prev) => [...prev, imageData]);

    // Move to next liveness step or complete
    if (livenessStep === 0) {
      setLivenessStep(1);
      // Show message to blink
      setTimeout(() => {
        setLivenessStep(2);
      }, 2000);
    } else if (livenessStep === 2 && capturedImages.length === 0) {
      // Second capture after head turn instruction
      setLivenessStep(3);
    }
  };

  const handleEnroll = async () => {
    if (capturedImages.length < 1) {
      setErrorMessage("Please capture at least one image.");
      return;
    }

    setStep("uploading");
    setErrorMessage(null);

    try {
      // Convert data URLs to base64 strings (remove data:image/jpeg;base64, prefix)
      const base64Images = capturedImages.map((dataUrl) => {
        return dataUrl.split(",")[1];
      });

      const response = await apiClient.post("/api/biometrics/face/enroll", {
        userId: userId,
        images: base64Images,
      });

      if (response.data?.success) {
        setStep("success");
        setTimeout(() => {
          stopCamera();
          if (onSuccess) {
            onSuccess();
          }
          onClose();
        }, 1500);
      } else {
        throw new Error(response.data?.error || "Enrollment failed");
      }
    } catch (error) {
      console.error("Face enrollment error:", error);
      setErrorMessage(
        error.response?.data?.message ||
        error.message ||
        "Failed to enroll face. Please try again."
      );
      setStep("error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <i className="bx bx-x"></i>
        </button>

        <h2 className={styles.modalTitle}>Face Enrollment</h2>

        {step === "instructions" && (
          <div className={styles.stepContent}>
            <p className={styles.instructions}>
              To enroll your face, we'll capture 2 images with liveness checks:
            </p>
            <ul className={styles.instructionsList}>
              <li>First image: Look directly at the camera</li>
              <li>Second image: After blinking, turn your head slightly left or right</li>
            </ul>
            <button
              className={styles.primaryButton}
              onClick={() => setStep("capture")}
            >
              Start Face Capture
            </button>
          </div>
        )}

        {step === "capture" && (
          <div className={styles.stepContent}>
            <div className={styles.videoContainer}>
              {isStreaming ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={styles.video}
                  />
                  <canvas ref={canvasRef} style={{ display: "none" }} />
                </>
              ) : (
                <div className={styles.videoPlaceholder}>Starting camera...</div>
              )}
            </div>

            <div className={styles.captureInstructions}>
              {livenessStep === 0 && (
                <p>Look directly at the camera and click "Capture"</p>
              )}
              {livenessStep === 1 && (
                <p className={styles.highlight}>Please blink naturally, then click "Capture"</p>
              )}
              {livenessStep === 2 && (
                <p className={styles.highlight}>Turn your head slightly left or right, then click "Capture"</p>
              )}
              {livenessStep === 3 && (
                <p>Ready to enroll. Click "Enroll Face" below.</p>
              )}
            </div>

            <div className={styles.capturedPreview}>
              {capturedImages.map((img, idx) => (
                <img key={idx} src={img} alt={`Capture ${idx + 1}`} className={styles.previewImage} />
              ))}
            </div>

            <div className={styles.buttonGroup}>
              <button
                className={styles.secondaryButton}
                onClick={captureImage}
                disabled={!isStreaming || livenessStep === 3}
              >
                {capturedImages.length === 0 ? "Capture First Image" : "Capture Second Image"}
              </button>
              {capturedImages.length >= 1 && (
                <button
                  className={styles.primaryButton}
                  onClick={handleEnroll}
                  disabled={capturedImages.length < 1}
                >
                  Enroll Face
                </button>
              )}
            </div>
          </div>
        )}

        {step === "uploading" && (
          <div className={styles.stepContent}>
            <div className={styles.loadingSpinner}></div>
            <p>Uploading and processing your face images...</p>
          </div>
        )}

        {step === "success" && (
          <div className={styles.stepContent}>
            <i className="bx bx-check-circle" style={{ fontSize: "3rem", color: "#10b981" }}></i>
            <p>Face enrollment successful!</p>
          </div>
        )}

        {step === "error" && (
          <div className={styles.stepContent}>
            <i className="bx bx-error-circle" style={{ fontSize: "3rem", color: "#ef4444" }}></i>
            <p className={styles.errorText}>{errorMessage}</p>
            <button className={styles.primaryButton} onClick={() => setStep("capture")}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FaceEnrollmentModal;

