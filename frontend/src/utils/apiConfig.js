import { API_BASE_URL, BASE_URL } from "../config/api";

function normalizeBaseUrl(url) {
  return url ? url.replace(/\/$/, "") : "";
}

export function getBackendOrigin() {
  return normalizeBaseUrl(BASE_URL);
}

export function getApiBaseUrl() {
  return normalizeBaseUrl(API_BASE_URL);
}

export function getSocketUrl() {
  return getBackendOrigin();
}

export function getAdminBaseUrl() {
  return getBackendOrigin();
}

export function buildImageUrl(imagePath) {
  if (!imagePath) {
    return "";
  }

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  const backendOrigin = getBackendOrigin();
  return imagePath.startsWith("/")
    ? `${backendOrigin}${imagePath}`
    : `${backendOrigin}/${imagePath}`;
}
