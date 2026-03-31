// src/services/faceRecognitionApi.js
// Frontend API helper for FaceNet-based enrollment and recognition

import apiClient from "../utils/apiClient";

async function blobToFormData(imageBlob, extraFields = {}) {
  const formData = new FormData();
  formData.append("image", imageBlob, "face.jpg");
  Object.entries(extraFields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });
  return formData;
}

/**
 * Enroll a user's face by sending a captured image to the backend.
 */
export async function enrollFace({ userId, imageBlob }) {
  const formData = await blobToFormData(imageBlob, { userId });
  const response = await apiClient.post("/face/enroll", formData);
  return response.data;
}

/**
 * Recognize a user from a captured image.
 * Returns best match with distance and match flag.
 */
export async function recognizeFace({ imageBlob }) {
  const formData = await blobToFormData(imageBlob);
  const response = await apiClient.post("/face/recognize", formData);
  return response.data;
}

