import React, { useState, useEffect } from "react";
import apiClient from "../utils/apiClient";
import styles from "./FingerprintCapture.module.css";

const FingerprintCapture = ({ userId, onFingerprintEnrolled, error, onFingerprintNotAvailable }) => {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [deviceName, setDeviceName] = useState("");
  const [fingerprintAvailable, setFingerprintAvailable] = useState(null); // null = checking, true = available, false = not available

  // Check if fingerprint is available
  useEffect(() => {
    const checkFingerprintAvailability = async () => {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        setFingerprintAvailable(false);
        if (onFingerprintNotAvailable) {
          onFingerprintNotAvailable();
        }
        return;
      }

      // Check if platform authenticator (fingerprint) is available
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        setFingerprintAvailable(available);
        if (!available && onFingerprintNotAvailable) {
          onFingerprintNotAvailable();
        }
      } catch (err) {
        console.error("Error checking fingerprint availability:", err);
        setFingerprintAvailable(false);
        if (onFingerprintNotAvailable) {
          onFingerprintNotAvailable();
        }
      }
    };

    checkFingerprintAvailability();
  }, [onFingerprintNotAvailable]);

  const startEnrollment = async () => {
    if (!userId) {
      setErrorMessage("User ID is required. Please complete other registration steps first.");
      return;
    }

    if (fingerprintAvailable === false) {
      setErrorMessage("Fingerprint sensor is not available on this device.");
      if (onFingerprintNotAvailable) {
        onFingerprintNotAvailable();
      }
      return;
    }

    setIsEnrolling(true);
    setErrorMessage(null);

    try {
      // Step 1: Get registration options from server
      // Note: userId is not needed in body - backend gets it from auth token
      const optionsResponse = await apiClient.post("/fingerprint/enroll/start", {});

      console.log("📥 Full options response:", optionsResponse);
      console.log("📥 Response data:", optionsResponse.data);

      // Check for error response
      if (optionsResponse.data.error) {
        throw new Error(optionsResponse.data.error || "Server error starting fingerprint enrollment");
      }

      // The backend returns options directly, not wrapped in options property
      const options = optionsResponse.data;

      // Step 2: Create credential using WebAuthn API
      // Validate options structure with detailed logging
      console.log("📥 Options structure:", {
        hasOptions: !!options,
        hasChallenge: !!options?.challenge,
        hasUser: !!options?.user,
        hasUserId: !!options?.user?.id,
        challengeType: typeof options?.challenge,
        userIdType: typeof options?.user?.id,
        optionsKeys: options ? Object.keys(options) : [],
        userKeys: options?.user ? Object.keys(options.user) : [],
      });

      if (!options) {
        throw new Error("No options received from server");
      }

      if (!options.challenge) {
        throw new Error("Missing challenge in registration options");
      }

      if (!options.user) {
        throw new Error("Missing user object in registration options");
      }

      if (!options.user.id) {
        throw new Error("Missing user.id in registration options");
      }

      // Convert base64url to base64 for atob (base64url uses - and _ instead of + and /)
      const base64Challenge = String(options.challenge).replace(/-/g, '+').replace(/_/g, '/');
      const base64UserId = String(options.user.id).replace(/-/g, '+').replace(/_/g, '/');
      
      // Add padding if needed
      const paddedChallenge = base64Challenge + '='.repeat((4 - base64Challenge.length % 4) % 4);
      const paddedUserId = base64UserId + '='.repeat((4 - base64UserId.length % 4) % 4);
      
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: Uint8Array.from(atob(paddedChallenge), (c) => c.charCodeAt(0)),
          rp: options.rp || { id: window.location.hostname, name: "InClass Attendance System" },
          user: {
            id: Uint8Array.from(atob(paddedUserId), (c) => c.charCodeAt(0)),
            name: options.user.name || options.user.email || "User",
            displayName: options.user.displayName || options.user.name || "User",
          },
          pubKeyCredParams: options.pubKeyCredParams || [{ alg: -7, type: "public-key" }],
          authenticatorSelection: options.authenticatorSelection || {
            authenticatorAttachment: "platform",
            userVerification: "required",
          },
          timeout: options.timeout || 60000,
          attestation: options.attestation || "none",
        },
      });

      // Step 3: Send credential to server for verification
      const verificationResponse = await apiClient.post("/fingerprint/enroll/complete", {
        registrationResponse: {
          id: credential.id,
          rawId: Array.from(new Uint8Array(credential.rawId)),
          response: {
            attestationObject: Array.from(new Uint8Array(credential.response.attestationObject)),
            clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
          },
          type: credential.type,
        },
        deviceName: deviceName || `${navigator.userAgentData?.brand || "Device"}`,
      });

      if (verificationResponse.data.message || verificationResponse.data.credentialId) {
        setIsEnrolled(true);
        onFingerprintEnrolled(true);
      }
    } catch (err) {
      console.error("Fingerprint enrollment error:", err);
      let errorMsg = "Failed to enroll fingerprint. Please try again.";

      if (err.response?.data?.error?.message) {
        errorMsg = err.response.data.error.message;
      } else if (err.message) {
        if (err.message.includes("NotAllowedError") || err.message.includes("NotSupportedError") || 
          err.name === "NotSupportedError" || err.name === "NotAllowedError") {
          errorMsg = "Fingerprint authentication is not supported or was cancelled. Please use a compatible device.";
          setFingerprintAvailable(false);
          if (onFingerprintNotAvailable) {
            onFingerprintNotAvailable();
          }
        } else {
          errorMsg = err.message;
        }
      }

      setErrorMessage(errorMsg);
    } finally {
      setIsEnrolling(false);
    }
  };

  const resetEnrollment = () => {
    setIsEnrolled(false);
    setErrorMessage(null);
    onFingerprintEnrolled(false);
  };

  return (
    <div className={styles.fingerprintWrapper}>
      <label className={styles.label}>
        <i className="bx bx-fingerprint"></i>
        Fingerprint Enrollment
      </label>

      {errorMessage && (
        <div className={styles.errorMessage}>
          <i className="bx bx-error-circle"></i>
          <span>{errorMessage}</span>
        </div>
      )}

      {fingerprintAvailable === false ? (
        <div className={styles.enrollmentArea}>
          <div className={styles.placeholder}>
            <i className="bx bx-error-circle"></i>
            <p>Fingerprint sensor is not available on this device</p>
            <p className={styles.hint}>Please use a device with fingerprint authentication or contact your faculty</p>
          </div>
        </div>
      ) : !isEnrolled ? (
        <div className={styles.enrollmentArea}>
          <div className={styles.placeholder}>
            <i className="bx bx-fingerprint"></i>
            <p>Enroll your fingerprint for secure authentication</p>
            {fingerprintAvailable === null && (
              <p className={styles.hint}>Checking fingerprint availability...</p>
            )}
            <div className={styles.deviceNameInput}>
              <input
                type="text"
                placeholder="Device name (optional)"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                disabled={isEnrolling}
              />
            </div>
            <button
              type="button"
              className={styles.enrollButton}
              onClick={startEnrollment}
              disabled={isEnrolling || !userId}
            >
              {isEnrolling ? (
                <>
                  <div className={styles.spinner}></div>
                  <span>Enrolling...</span>
                </>
              ) : (
                <>
                  <i className="bx bx-fingerprint"></i>
                  <span>Start Enrollment</span>
                </>
              )}
            </button>
            {!userId && (
              <p className={styles.hint}>Complete other registration steps first</p>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.successContainer}>
          <div className={styles.successIcon}>
            <i className="bx bx-check-circle"></i>
          </div>
          <p className={styles.successText}>Fingerprint enrolled successfully!</p>
          <button type="button" className={styles.resetButton} onClick={resetEnrollment}>
            <i className="bx bx-refresh"></i>
            Re-enroll
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

export default FingerprintCapture;

