// src/utils/apiClient.js

import axios from "axios";

// Set the base URL to your running backend port

const API_BASE_URL = "http://localhost:4000/api";

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
