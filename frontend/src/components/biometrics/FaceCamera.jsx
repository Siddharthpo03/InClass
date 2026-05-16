import React, { useEffect, useRef, useState } from "react";
import styles from "./FaceCamera.module.css";

const FaceCamera = ({
  active = true,
  title = "Face capture",
  instruction = "Center your face inside the guide",
  statusMessage = "",
  captureLabel = "Capture face",
  cancelLabel = "Cancel",
  submitting = false,
  onCapture,
  onCancel,
}) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    const stopCamera = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    const startCamera = async () => {
      try {
        setErrorMessage("");
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Camera access is not supported in this browser.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play?.();
        }
        setCameraReady(true);
      } catch (err) {
        setErrorMessage(
          err?.message ||
            "Failed to access the camera. Please check permissions.",
        );
        setCameraReady(false);
      }
    };

    if (active) {
      void startCamera();
    }

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [active]);

  const capture = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setErrorMessage("Camera is not ready yet.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error("Unable to capture frame from camera."));
          }
        },
        "image/jpeg",
        0.92,
      );
    });

    if (onCapture) {
      onCapture(blob);
    }
  };

  return (
    <div className={styles.cameraShell}>
      <div className={styles.header}>
        <h3>{title}</h3>
        <p>{instruction}</p>
      </div>

      <div className={styles.previewFrame}>
        <video
          ref={videoRef}
          className={styles.video}
          autoPlay
          playsInline
          muted
        />
        <div className={styles.guideOverlay} aria-hidden="true">
          <div className={styles.guideRing} />
          <div className={styles.guideCrosshair} />
        </div>
      </div>

      <canvas ref={canvasRef} className={styles.hiddenCanvas} />

      {(statusMessage || errorMessage) && (
        <div
          className={errorMessage ? styles.errorMessage : styles.statusMessage}
          role="status"
        >
          {errorMessage || statusMessage}
        </div>
      )}

      <div className={styles.actions}>
        {onCancel && (
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onCancel}
            disabled={submitting}
          >
            {cancelLabel}
          </button>
        )}
        <button
          type="button"
          className={styles.primaryButton}
          onClick={capture}
          disabled={!cameraReady || submitting}
        >
          {submitting ? "Processing..." : captureLabel}
        </button>
      </div>
    </div>
  );
};

export default FaceCamera;
