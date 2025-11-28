// src/utils/apiClient.js

import axios from "axios";

// Resolve API base URL from Vite environment at build time.
// Fallbacks: localhost in dev, relative "/api" in production if not provided.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:4000/api"
    : "/api");

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach the JWT token before every request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("inclass_token");
    if (token) {
      // Standard JWT Authorization header format
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    
    // If FormData is being sent, let axios set Content-Type automatically (with boundary)
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle session expiration (e.g., 401/403)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      console.error(
        "Authentication expired or failed. Forcing user to re-login."
      );
      localStorage.removeItem("inclass_token");
      localStorage.removeItem("user_role");
      // Note: We avoid calling navigate here; the component using apiClient must handle
      // the state change (or use a global context/hook for automatic redirection).
    }
    return Promise.reject(error);
  }
);

export default apiClient;
