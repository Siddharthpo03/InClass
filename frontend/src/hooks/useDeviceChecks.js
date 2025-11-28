import { useState, useEffect } from "react";

/**
 * Custom hook to check device capabilities for biometric enrollment
 * @returns {Object} Device capability flags and loading state
 */
export default function useDeviceChecks() {
  const [checks, setChecks] = useState({
    webAuthnSupported: false,
    platformAuthenticatorAvailable: false,
    cameraAvailable: false,
    checksDone: false,
  });

  useEffect(() => {
    const checkCapabilities = async () => {
      const results = {
        webAuthnSupported: false,
        platformAuthenticatorAvailable: false,
        cameraAvailable: false,
        checksDone: false,
      };

      // Check WebAuthn API presence
      if (window.PublicKeyCredential) {
        results.webAuthnSupported = true;

        // Check if platform authenticator (fingerprint/FaceID/Windows Hello) is actually available
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          results.platformAuthenticatorAvailable = available;
        } catch (err) {
          console.error("Error checking platform authenticator availability:", err);
          results.platformAuthenticatorAvailable = false;
        }
      }

      // Check camera availability using enumerateDevices
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasVideoInput = devices.some((device) => device.kind === "videoinput");
          results.cameraAvailable = hasVideoInput;
        } catch (err) {
          console.error("Camera check error:", err);
          results.cameraAvailable = false;
        }
      }

      // Mark checks as done
      results.checksDone = true;
      setChecks(results);
    };

    checkCapabilities();
  }, []);

  return checks;
}
