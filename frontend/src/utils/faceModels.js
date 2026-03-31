// @ts-check
// frontend/src/utils/faceModels.js
// FaceNet model loading and verification utilities for biometric attendance.

import * as tf from "@tensorflow/tfjs";

// Optional CDN base URL for model assets. In production, point this at your CDN
// (e.g. https://cdn.example.com). In development, leave unset so assets load
// from the local Vite dev server.
const CDN_BASE = import.meta.env.VITE_CDN_BASE_URL || "";

// Normalize base so `${CDN_BASE}/models/...` works for both "" and "https://cdn".
const BASE_PREFIX = CDN_BASE.endsWith("/")
  ? CDN_BASE.slice(0, -1)
  : CDN_BASE;

const FACENET_MODEL_URL = `${BASE_PREFIX}/models/facenet/model.json`;
const FACENET_BASE_PATH = `${BASE_PREFIX}/models/facenet/`;
const CRITICAL_MODEL_ERROR_MESSAGE =
  "CRITICAL: FaceNet biometric model files missing. Contact administrator.";

let faceNetVerificationPromise = null;
let faceNetModelPromise = null;

/**
 * Verify that the FaceNet model.json and all referenced shard files exist.
 * This function is safe to call multiple times: the underlying verification
 * work runs only once per page load via a cached promise.
 */
export async function verifyFaceNetModel() {
  if (!faceNetVerificationPromise) {
    faceNetVerificationPromise = (async () => {
      try {
        const response = await fetch(FACENET_MODEL_URL, {
          method: "GET",
          cache: "no-cache",
        });

        if (!response.ok) {
          console.error(
            "[FaceNet] Failed to fetch model.json:",
            FACENET_MODEL_URL,
            "status=",
            response.status
          );
          throw new Error(CRITICAL_MODEL_ERROR_MESSAGE);
        }

        const modelConfig = await response.json();

        if (
          !modelConfig ||
          !Array.isArray(modelConfig.weightsManifest) ||
          modelConfig.weightsManifest.length === 0
        ) {
          console.error(
            "[FaceNet] Invalid or missing weightsManifest in model.json"
          );
          throw new Error(CRITICAL_MODEL_ERROR_MESSAGE);
        }

        // Verify every shard path listed in the weights manifest.
        for (const manifestEntry of modelConfig.weightsManifest) {
          if (!manifestEntry || !Array.isArray(manifestEntry.paths)) {
            continue;
          }

          const checks = manifestEntry.paths.map(async (relativePath) => {
            const shardUrl = FACENET_BASE_PATH + relativePath;
            try {
              // Use HEAD to avoid downloading the full binary contents.
              const shardResponse = await fetch(shardUrl, {
                method: "HEAD",
                cache: "no-cache",
              });

              if (!shardResponse.ok) {
                console.error(
                  "[FaceNet] Missing shard file:",
                  shardUrl,
                  "status=",
                  shardResponse.status
                );
                throw new Error(CRITICAL_MODEL_ERROR_MESSAGE);
              }
            } catch (err) {
              console.error(
                "[FaceNet] Error while verifying shard file:",
                shardUrl,
                err
              );
              throw new Error(CRITICAL_MODEL_ERROR_MESSAGE);
            }
          });

          await Promise.all(checks);
        }

        return true;
      } catch (err) {
        if (err instanceof Error) {
          console.error("[FaceNet] Model verification failed:", err.message);
        } else {
          console.error("[FaceNet] Model verification failed with unknown error");
        }
        // Always throw a clean, user-facing error message upward.
        throw new Error(CRITICAL_MODEL_ERROR_MESSAGE);
      }
    })();
  }

  return faceNetVerificationPromise;
}

/**
 * Load the FaceNet GraphModel after first verifying that all required files
 * exist. The model is loaded only once and cached for subsequent calls.
 *
 * Callers should catch errors and display a user-friendly message using the
 * error's message (which will be CRITICAL_MODEL_ERROR_MESSAGE).
 */
export async function getFaceNetModel() {
  if (!faceNetModelPromise) {
    faceNetModelPromise = (async () => {
      // Ensure underlying model files are present and reachable.
      await verifyFaceNetModel();

      try {
        const model = await tf.loadGraphModel(FACENET_MODEL_URL);
        return model;
      } catch (err) {
        console.error("[FaceNet] Failed to load GraphModel:", err);
        // Propagate a stable, user-facing error message.
        throw new Error(CRITICAL_MODEL_ERROR_MESSAGE);
      }
    })();
  }

  return faceNetModelPromise;
}

