import React, { useState, useCallback, useRef, useEffect } from "react";
import apiClient from "../../utils/apiClient";
import { recognizeFace } from "../../services/faceRecognitionApi";
import LoadingSpinner from "../shared/LoadingSpinner";
import ToastContainer from "../shared/ToastContainer";
import styles from "./AttendanceMarking.module.css";

/**
 * AttendanceMarking - Component for students to mark attendance
 * 
 * Handles:
 * - Face verification
 * - Code submission
 * - Error handling and retry
 */
const AttendanceMarking = ({
  session,
  onSuccess,
  onCancel,
  hasFaceEnrolled = false,
}) => {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState("code"); // 'code', 'face', 'submitting'
  const [toasts, setToasts] = useState([]);
  
  // Face verification state
  const [modelsLoaded] = useState(true);
  const [showFaceCapture, setShowFaceCapture] = useState(false);
  const [capturingFace, setCapturingFace] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // FaceNet runs on backend; no client-side model loading needed.

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

  // Start camera for face capture
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("Failed to access camera. Please allow camera permissions.");
      showToast("Camera access denied", "error");
    }
  }, [showToast]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Capture and extract server-side embedding
  const captureAndVerifyFace = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError("Camera not ready.");
      return null;
    }

    setCapturingFace(true);
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      const resp = await fetch(dataUrl);
      const blob = await resp.blob();

      const result = await recognizeFace({ imageBlob: blob });

      if (!result.match) {
        setError(
          `Face verification failed. (Best distance: ${result.distance.toFixed(
            3
          )})`
        );
        return null;
      }

      // For attendance, we only need to know that face matches the logged-in user.
      // Backend will re-validate using pgvector; here we pass embedding as opaque signal.
      return result;
    } catch (err) {
      console.error("Face capture error:", err);
      setError("Failed to capture face. Please try again.");
      return null;
    } finally {
      setCapturingFace(false);
    }
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      setError("Please enter a valid 6-character code.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Face verification
      setStep("face");
      setShowFaceCapture(true);
      await startCamera();

      await new Promise((resolve) => setTimeout(resolve, 500));

      const recognitionResult = await captureAndVerifyFace();
      stopCamera();
      setShowFaceCapture(false);

      if (!recognitionResult) {
        throw new Error("Face verification failed. Please try again.");
      }

      setStep("submitting");
      
      const response = await apiClient.post("/attendance/mark", {
        code,
        faceEmbedding: recognitionResult.embedding,
      });

      if (response.data?.message) {
        showToast("Attendance recorded.", "success");
        onSuccess?.(response.data);
      } else {
        throw new Error("Attendance submission failed.");
      }
    } catch (err) {
      console.error("Attendance marking error:", err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
        showToast(err.response.data.message, "error");
      } else if (err.message) {
        setError(err.message);
        showToast(err.message, "error");
      } else {
        setError("Failed to mark attendance. Please try again.");
        showToast("Failed to mark attendance", "error");
      }
      
      // Reset to code step on error
      setStep("code");
    } finally {
      setSubmitting(false);
      stopCamera();
      setShowFaceCapture(false);
    }
  }, [
    code,
    startCamera,
    captureAndVerifyFace,
    stopCamera,
    showToast,
    onSuccess,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return (
    <div className={styles.attendanceMarking}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <div className={styles.header}>
        <h2>Mark Attendance</h2>
        {session && (
          <div className={styles.sessionInfo}>
            <p className={styles.courseName}>{session.courseName}</p>
            <p className={styles.facultyName}>Professor: {session.facultyName}</p>
          </div>
        )}
      </div>

      {error && (
        <div className={styles.errorMessage} role="alert">
          {error}
        </div>
      )}

      {step === "code" && (
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="attendance-code">Enter Session Code</label>
            <input
              id="attendance-code"
              type="text"
              value={code}
              onChange={(e) => {
                const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                setCode(value.slice(0, 6));
                setError("");
              }}
              placeholder="XXXXXX"
              maxLength={6}
              className={styles.codeInput}
              autoComplete="off"
              autoFocus
            />
          </div>

          <div className={styles.infoBanner}>
            <i className="bx bx-info-circle" aria-hidden="true"></i>
            <span>Face verification will be required.</span>
          </div>

          <div className={styles.buttonGroup}>
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting || code.length !== 6}
            >
              Submit
            </button>
          </div>
        </form>
      )}

      {step === "face" && showFaceCapture && (
        <div className={styles.faceCaptureStep}>
          <p>Please look at the camera for face verification...</p>
          <div className={styles.videoContainer}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={styles.videoPreview}
            />
            <canvas ref={canvasRef} className={styles.canvas} />
          </div>
          {capturingFace && (
            <div className={styles.capturingOverlay}>
              <LoadingSpinner size="large" />
              <p>Capturing face...</p>
            </div>
          )}
        </div>
      )}

      {step === "submitting" && (
        <div className={styles.submittingStep}>
          <LoadingSpinner size="large" />
          <p>Submitting attendance...</p>
        </div>
      )}
    </div>
  );
};

export default React.memo(AttendanceMarking);

