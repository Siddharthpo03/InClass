import * as faceapi from "face-api.js";

/**
 * Load face-api.js models with retry logic
 * @param {number} retries - Number of retry attempts (default: 2)
 * @param {number} delay - Delay between retries in ms (default: 1000)
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function loadFaceModels(retries = 2, delay = 1000) {
  const modelsPath = "/models";

  // Skip pre-check and go straight to loading - let face-api.js handle errors
  // The pre-check was causing false positives when the dev server wasn't ready

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Load models - MUST match the detector used in detection
      // Using SSD MobileNet v1, so load ssdMobilenetv1 models
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(modelsPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelsPath),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelsPath),
      ]);

      console.log("Face-api.js models loaded successfully (SSD MobileNet v1 + Landmarks + Recognition)");
      return { ok: true };
    } catch (error) {
      console.error(`Face model loading attempt ${attempt + 1} failed:`, error);

      // Check if error is HTML response (404 page or similar)
      const isHtmlError =
        error.message?.includes("<!DOCTYPE") ||
        error.message?.includes("Unexpected token '<'") ||
        error.message?.includes("is not valid JSON") ||
        error.message?.includes("SyntaxError");

      // Check if it's a network/404 error
      if (error.message?.includes("404") || error.message?.includes("Failed to fetch") || isHtmlError) {
        const errorMsg =
          attempt === retries
            ? `Models not found at ${modelsPath}. The server returned an error page (HTML) instead of model files. Please ensure:\n1. Dev server is running (npm run dev)\n2. Models folder exists: frontend/public/models/\n3. All model files are present (check Network tab in DevTools F12)\n4. Verify files are accessible at http://localhost:5173/models/ssd_mobilenetv1_model-weights_manifest.json`
            : `Models not found (attempt ${attempt + 1}/${retries + 1}). Retrying...`;
        console.error(errorMsg);

        // If this was the last attempt, return error
        if (attempt === retries) {
          return {
            ok: false,
            error: `Models directory not found. The server returned HTML instead of model files. Please ensure:\n1. Dev server is running (npm run dev)\n2. Create folder: frontend/public/models/\n3. Place all model files there\n4. Check DevTools Network tab (F12) to see which files failed`,
          };
        }
      } else {
        // Other errors (parsing, etc.)
        const errorMsg =
          attempt === retries
            ? `Failed to load models: ${error.message || "Unknown error"}`
            : `Model loading error (attempt ${attempt + 1}/${retries + 1}). Retrying...`;
        console.error(errorMsg);

        if (attempt === retries) {
          return { ok: false, error: errorMsg };
        }
      }

      // Wait before retrying (except on last attempt)
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  return { ok: false, error: "Failed to load models after all retry attempts." };
}
