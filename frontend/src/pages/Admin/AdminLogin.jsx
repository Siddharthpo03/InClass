import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import styles from "./AdminLogin.module.css";

const AdminLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // Pre-fill email if coming from regular login page
  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [showPassphraseGate, setShowPassphraseGate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setRequiresPassphrase] = useState(false);

  // Check if passphrase is required
  React.useEffect(() => {
    const checkPassphrase = async () => {
      try {
        // Use full URL for admin routes (not /api prefix)
        const adminBaseUrl = import.meta.env.VITE_API_BASE_URL 
          ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
          : 'http://localhost:4000';
        const response = await axios.get(`${adminBaseUrl}/inclass/admin/login`);
        if (response.data.requiresPassphrase) {
          setRequiresPassphrase(true);
          setShowPassphraseGate(true);
        }
        
        // Warn if no admin accounts exist
        if (response.data.adminAccountsExist === false) {
          console.warn("⚠️ No admin accounts found in database. Create one using: node scripts/createAdmin.js");
        }
      } catch (error) {
        console.error("Failed to check passphrase requirement:", error);
        // Don't show error to user, just log it
      }
    };
    checkPassphrase();
  }, []);

  const handlePassphraseSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Use full URL for admin routes (not /api prefix)
      const adminBaseUrl = import.meta.env.VITE_API_BASE_URL 
        ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
        : 'http://localhost:4000';
      const response = await axios.post(`${adminBaseUrl}/inclass/admin/login/verify-gate`, {
        passphrase,
      });

      if (response.data.success) {
        setShowPassphraseGate(false);
      }
    } catch (error) {
      setError(
        error.response?.data?.error?.message ||
        error.response?.data?.message || 
        "Invalid passphrase. Access denied."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Use full URL for admin routes (not /api prefix from apiClient)
      // Admin routes are mounted at /inclass/admin, not /api/inclass/admin
      const adminBaseUrl = import.meta.env.VITE_API_BASE_URL 
        ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
        : 'http://localhost:4000';
      
      console.log(`[Admin Login] Calling: ${adminBaseUrl}/inclass/admin/login`);
      
      const response = await axios.post(`${adminBaseUrl}/inclass/admin/login`, {
        email,
        password,
      });

      console.log(`[Admin Login] Response:`, response.data);

      if (response.data.success && response.data.token) {
        // Store token and role
        localStorage.setItem("inclass_token", response.data.token);
        localStorage.setItem("user_role", "admin");

        // Redirect to admin dashboard
        navigate("/admin/dashboard", { replace: true });
      }
    } catch (error) {
      console.error(`[Admin Login] Error:`, {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      // Backend returns: { success: false, error: { message: "...", code: "..." } }
      // Extract error message from the correct path
      const errorMessage = 
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        (error.response?.status === 401 
          ? "Invalid email or password. Please check your credentials."
          : error.response?.status === 404
          ? "Admin account not found. Please contact InClass to create an admin account."
          : error.message || "Unable to connect to server. Please try again later.");
      
      setError(errorMessage);
      
      // Log for debugging
      if (import.meta.env.DEV) {
        console.error("Admin login error:", {
          status: error.response?.status,
          data: error.response?.data,
          extractedMessage: errorMessage,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (showPassphraseGate) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.loginHeader}>
            <i className="bx bx-shield-quarter"></i>
            <h1>Admin Access Gate</h1>
            <p>Enter the passphrase to continue</p>
          </div>

          <form onSubmit={handlePassphraseSubmit} className={styles.loginForm}>
            {error && <div className={styles.errorMessage}>{error}</div>}

            <div className={styles.formGroup}>
              <label htmlFor="passphrase">Passphrase</label>
              <input
                id="passphrase"
                type="password"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="Enter admin passphrase"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? "Verifying..." : "Continue"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.loginHeader}>
          <i className="bx bx-shield-quarter"></i>
          <h1>Admin Login</h1>
          <p>Sign in to access the admin dashboard</p>
        </div>

        <form onSubmit={handleLogin} className={styles.loginForm}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className={styles.loginFooter}>
          <p>
            <i className="bx bx-lock"></i>
            Secure admin access only
          </p>
          <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "var(--text-secondary, #6b7280)", textAlign: "center" }}>
            Admin accounts can only be created by "InClass".
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

