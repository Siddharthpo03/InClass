import React, { useRef, useState, useEffect } from "react";
import styles from "./FaceCapture.module.css";

const FaceCapture = ({ onFaceCapture, error }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const streamRef = useRef(null);

  useEffect(() => {
    console.log("🎬 FaceCapture component mounted");
    return () => {
      console.log("🧹 FaceCapture component unmounting, cleaning up...");
      // Cleanup: stop video stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
          console.log("🛑 Stopped track:", track.kind);
        });
      }
    };
  }, []);

  const startCamera = async () => {
    console.log("📹 startCamera called");
    try {
      setErrorMessage(null);
      
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        const errorMsg = "Camera access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Edge.";
        console.error("❌", errorMsg);
        setErrorMessage(errorMsg);
        return;
      }

      console.log("📹 Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      console.log("✅ Camera access granted, stream received:", stream);
      console.log("📹 Stream tracks:", stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));

      streamRef.current = stream;
      
      // Set streaming state first so video element renders
      setIsStreaming(true);
      
      // Wait for next render cycle to ensure video element exists
      setTimeout(() => {
        if (videoRef.current) {
          console.log("📹 Setting video srcObject...");
          videoRef.current.srcObject = stream;
        
          // Wait for video to be ready
          const video = videoRef.current;
          
          const handleLoadedMetadata = () => {
            console.log("✅ Video metadata loaded");
            console.log("📹 Video dimensions:", video.videoWidth, "x", video.videoHeight);
            console.log("📹 Video readyState:", video.readyState);
            
            // Wait a bit more for video to actually start playing
            setTimeout(() => {
              if (video && video.readyState >= video.HAVE_CURRENT_DATA) {
                setIsVideoReady(true);
                console.log("✅ Video is ready for capture!");
              } else {
                console.warn("⚠️ Video not ready after timeout, readyState:", video.readyState);
              }
            }, 500);
          };

          const handlePlaying = () => {
            console.log("▶️ Video is playing");
            setIsVideoReady(true);
          };

          const handleError = (err) => {
            console.error("❌ Video error:", err);
            setErrorMessage("Error loading video stream. Please try again.");
            setIsStreaming(false);
            setIsVideoReady(false);
          };

          video.addEventListener("loadedmetadata", handleLoadedMetadata);
          video.addEventListener("playing", handlePlaying);
          video.addEventListener("error", handleError);
        } else {
          console.error("❌ videoRef.current is still null after timeout!");
          setErrorMessage("Failed to initialize video element. Please try again.");
          setIsStreaming(false);
        }
      }, 100); // Small delay to ensure DOM is updated
    } catch (err) {
      console.error("❌ Error accessing camera:", err);
      let errorMsg = "Failed to access camera. Please check your camera permissions.";
      
      if (err.name === "NotAllowedError") {
        errorMsg = "Camera access denied. Please allow camera access in your browser settings.";
      } else if (err.name === "NotFoundError") {
        errorMsg = "No camera found. Please connect a camera and try again.";
      } else if (err.name === "NotReadableError") {
        errorMsg = "Camera is already in use by another application.";
      }
      
      setErrorMessage(errorMsg);
    }
  };

  const stopCamera = () => {
    console.log("🛑 stopCamera called");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("🛑 Stopped track:", track.kind);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setIsVideoReady(false);
  };

  const captureFace = () => {
    console.log("🔵 ========== CAPTURE BUTTON CLICKED ==========");
    console.log("🔵 captureFace called");
    console.log("🔵 videoRef.current:", videoRef.current);
    console.log("🔵 canvasRef.current:", canvasRef.current);
    console.log("🔵 isCapturing:", isCapturing);
    console.log("🔵 isStreaming:", isStreaming);
    console.log("🔵 isVideoReady:", isVideoReady);
    
    if (!videoRef.current) {
      console.error("❌ videoRef.current is null!");
      alert("Video element is not available. Please refresh the page.");
      return;
    }

    if (!canvasRef.current) {
      console.error("❌ canvasRef.current is null!");
      alert("Canvas element is not available. Please refresh the page.");
      return;
    }

    if (isCapturing) {
      console.log("⚠️ Already capturing, please wait...");
      return;
    }

    if (!isStreaming || !isVideoReady) {
      console.error("❌ Video is not ready. isStreaming:", isStreaming, "isVideoReady:", isVideoReady);
      setErrorMessage("Please wait for the video to be ready before capturing.");
      return;
    }

    console.log("✅ Starting capture process...");
    setIsCapturing(true);
    setErrorMessage(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    console.log("📹 Video readyState:", video.readyState, "(HAVE_ENOUGH_DATA =", video.HAVE_ENOUGH_DATA, ")");
    console.log("📹 Video dimensions:", video.videoWidth, "x", video.videoHeight);
    console.log("📹 Video playing:", !video.paused);
    console.log("📹 Video paused:", video.paused);

    // Check if video is ready and has valid dimensions
    if (video.readyState < video.HAVE_CURRENT_DATA) {
      console.error("❌ Video is not ready yet, readyState:", video.readyState);
      setErrorMessage("Video is not ready. Please wait a moment and try again.");
      setIsCapturing(false);
      return;
    }

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error("❌ Video dimensions are invalid:", video.videoWidth, video.videoHeight);
      setErrorMessage("Unable to capture image. Please ensure your camera is working properly.");
      setIsCapturing(false);
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      console.error("❌ Could not get 2D context from canvas!");
      setErrorMessage("Failed to initialize canvas. Please try again.");
      setIsCapturing(false);
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    console.log("🎨 Canvas dimensions set to:", canvas.width, "x", canvas.height);

    try {
      console.log("🎨 Drawing image to canvas...");
      // Draw current video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      console.log("✅ Drew image to canvas successfully");

      // Use toDataURL first as it's more reliable, then convert to blob
      console.log("📸 Converting canvas to image...");
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      console.log("📸 Data URL created, length:", dataUrl.length, "characters");
      console.log("📸 Data URL preview:", dataUrl.substring(0, 50) + "...");
      
      if (!dataUrl || dataUrl === "data:," || dataUrl.length < 100) {
        console.error("❌ Invalid data URL generated");
        setErrorMessage("Failed to capture image. Please try again.");
        setIsCapturing(false);
        return;
      }

      // Convert data URL to blob
      console.log("🔄 Converting data URL to blob...");
      fetch(dataUrl)
        .then(res => {
          console.log("📥 Fetch response received, status:", res.status);
          return res.blob();
        })
        .then(blob => {
          console.log("📦 Blob created successfully!");
          console.log("📦 Blob size:", blob.size, "bytes");
          console.log("📦 Blob type:", blob.type);
          
          if (blob && blob.size > 0) {
            console.log("✅ Image captured successfully!");
            const imageUrl = URL.createObjectURL(blob);
            console.log("🖼️ Image URL created:", imageUrl);
            setCapturedImage(imageUrl);
            console.log("📤 Calling onFaceCapture callback with blob...");
            
            if (typeof onFaceCapture === "function") {
              onFaceCapture(blob);
              console.log("✅ onFaceCapture callback executed");
            } else {
              console.error("❌ onFaceCapture is not a function!", typeof onFaceCapture);
            }
            
            console.log("🛑 Stopping camera...");
            stopCamera();
            setErrorMessage(null);
            setIsCapturing(false);
            console.log("✅ ========== CAPTURE PROCESS COMPLETED ==========");
          } else {
            console.error("❌ Blob is empty or invalid");
            setErrorMessage("Failed to capture image. The image may be empty. Please try again.");
            setIsCapturing(false);
          }
        })
        .catch(err => {
          console.error("❌ Error converting to blob:", err);
          console.error("❌ Error stack:", err.stack);
          setErrorMessage("Failed to process captured image: " + err.message);
          setIsCapturing(false);
        });
    } catch (error) {
      console.error("❌ Error capturing face:", error);
      console.error("❌ Error stack:", error.stack);
      setErrorMessage("Error capturing image: " + error.message);
      setIsCapturing(false);
    }
  };

  const retakePhoto = () => {
    console.log("🔄 Retaking photo...");
    setCapturedImage(null);
    if (typeof onFaceCapture === "function") {
      onFaceCapture(null);
    }
    startCamera();
  };

  return (
    <div className={styles.faceCaptureWrapper}>
      <label className={styles.label}>
        <i className="bx bx-face"></i>
        Real-Time Face Capture
      </label>

      {errorMessage && (
        <div className={styles.errorMessage}>
          <i className="bx bx-error-circle"></i>
          <span>{errorMessage}</span>
        </div>
      )}

      {!capturedImage ? (
        <div className={styles.captureArea}>
          <div className={styles.videoContainer}>
            {!isStreaming ? (
              <div className={styles.placeholder}>
                <i className="bx bx-camera"></i>
                <p>Click "Start Camera" to capture your face</p>
                <button 
                  type="button" 
                  className={styles.startButton} 
                  onClick={() => {
                    console.log("🖱️ Start Camera button clicked");
                    startCamera();
                  }}
                >
                  <i className="bx bx-video"></i>
                  Start Camera
                </button>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className={styles.video}
                />
                <div className={styles.faceGuide}></div>
                <div className={styles.controls}>
                  <button 
                    type="button" 
                    className={styles.captureButton} 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("🖱️ Capture button clicked!");
                      captureFace();
                    }}
                    disabled={!isStreaming || !isVideoReady || isCapturing}
                  >
                    {isCapturing ? (
                      <>
                        <div className={styles.spinner}></div>
                        <span>Capturing...</span>
                      </>
                    ) : (
                      <>
                        <i className="bx bx-camera"></i>
                        <span>{isVideoReady ? "Capture" : "Loading..."}</span>
                      </>
                    )}
                  </button>
                  <button 
                    type="button" 
                    className={styles.cancelButton} 
                    onClick={() => {
                      console.log("🖱️ Cancel button clicked");
                      stopCamera();
                    }}
                  >
                    <i className="bx bx-x"></i>
                    Cancel
                  </button>
                </div>
                {isVideoReady && (
                  <div className={styles.readyIndicator}>
                    <i className="bx bx-check-circle"></i>
                    <span>Ready to capture</span>
                  </div>
                )}
              </>
            )}
          </div>
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      ) : (
        <div className={styles.previewContainer}>
          <img src={capturedImage} alt="Captured face" className={styles.previewImage} />
          <button type="button" className={styles.retakeButton} onClick={retakePhoto}>
            <i className="bx bx-refresh"></i>
            Retake
          </button>
        </div>
      )}

      {error && (
        <span className={styles.errorText}>
          <i className="bx bx-error-circle"></i>
          {error}
        </span>
      )}
    </div>
  );
};

export default FaceCapture;
