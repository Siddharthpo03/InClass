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

    // Public endpoints that NEVER need a token – don't warn for these
    const publicEndpoints = [
      "/auth/colleges",
      "/auth/departments",
      "/auth/check-email",
      "/auth/register",
      "/auth/login",
      "/auth/send-otp",
      "/auth/verify-otp",
    ];

    const isPublicEndpoint = config.url
      ? publicEndpoints.some((endpoint) => config.url.startsWith(endpoint))
      : false;

    if (token && !isPublicEndpoint) {
      // Standard JWT Authorization header format
      config.headers["Authorization"] = `Bearer ${token}`;
    } else if (!token && !isPublicEndpoint) {
      // Log if token is missing only for protected endpoints (for debugging)
      console.warn("⚠️ Request made without token (likely needs auth):", {
        url: config.url,
        method: config.method,
      });
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
    if (error.response) {
      const status = error.response.status;
      const errorMessage = error.response.data?.message || error.response.data?.error?.message || "";
      
      // ONLY clear token on EXACT error messages from auth middleware
      // Be extremely conservative - only clear on known token expiration messages
      if (status === 401) {
        // ONLY match the exact error messages from auth.js middleware
        const exactTokenErrors = [
          "Invalid or expired token.",
          "Missing token",
          "Token expired. Please login again.",
          "Invalid token format."
        ];
        
        const isTokenError = exactTokenErrors.includes(errorMessage);
        
        if (isTokenError) {
          const tokenExists = !!localStorage.getItem("inclass_token");
          console.warn(
            "🔒 Token expired or invalid. Clearing session and redirecting to login.",
            { 
              errorMessage, 
              status, 
              url: error.config?.url,
              method: error.config?.method,
              tokenExists,
              timestamp: new Date().toISOString()
            }
          );
          
          // Only clear if token actually exists (safety check)
          if (tokenExists) {
            localStorage.removeItem("inclass_token");
            localStorage.removeItem("user_role");
            
            // Only redirect if we're not already on the login page
            if (!window.location.pathname.includes("/login")) {
              // Use setTimeout to avoid navigation during render
              setTimeout(() => {
                window.location.href = "/login";
              }, 100);
            }
          }
        } else {
          // It's a 401 but not a known token error - DON'T clear token
          console.log("401 error (not a known token error, keeping session):", {
            errorMessage,
            url: error.config?.url,
            status
          });
        }
      } else if (status === 403) {
        // 403 is permission-related, NOT token expiration - NEVER clear token
        console.warn("403 Forbidden (permission issue, not token):", {
          errorMessage,
          url: error.config?.url
        });
      }
    } else if (error.request) {
      // Network error - don't clear token
      console.warn("Network error (not clearing token):", error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
