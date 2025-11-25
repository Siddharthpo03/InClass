import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setCookieConsent, setEssentialCookie } from "../utils/cookieUtils";
import styles from "./CookieConsent.module.css";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem("cookieConsent");
    
    if (!cookieConsent) {
      // Show banner after a short delay for better UX
      setTimeout(() => {
        setIsVisible(true);
      }, 1000);
    }
  }, []);

  const handleAcceptEssential = () => {
    // Only accept essential cookies
    setCookieConsent("essential");
    setIsVisible(false);
    
    // Initialize essential cookies only
    initializeEssentialCookies();
  };

  const handleAcceptAll = () => {
    // Accept all cookies (essential + optional)
    setCookieConsent("all");
    setIsVisible(false);
    
    // Initialize all cookies
    initializeEssentialCookies();
    // Note: Add analytics/tracking initialization here if needed in future
  };

  const handleReject = () => {
    // Reject all non-essential cookies
    setCookieConsent("rejected");
    setIsVisible(false);
    
    // Only initialize essential cookies
    initializeEssentialCookies();
  };

  const initializeEssentialCookies = () => {
    // Essential cookies only - these are necessary for the website to function
    // Examples: session management, authentication, preferences
    
    // Set a session identifier (essential for security)
    if (!document.cookie.includes("session_id")) {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setEssentialCookie("session_id", sessionId, 3600); // 1 hour
    }
    
    // Note: Add other essential cookies here as needed
    // These are cookies that are strictly necessary for the website to function
  };

  const handleManagePreferences = () => {
    navigate("/cookies");
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.cookieConsentOverlay}>
      <div className={styles.cookieConsentBanner}>
        <div className={styles.cookieConsentContent}>
          <div className={styles.cookieIcon}>
            <i className="fas fa-cookie-bite" />
          </div>
          
          <div className={styles.cookieText}>
            <h3>We Value Your Privacy</h3>
            <p>
              We use cookies to enhance your browsing experience, serve personalized content, 
              and analyze our traffic. By clicking "Accept Essential", you consent to our use of 
              <strong> essential cookies only</strong> (necessary for the website to function). 
              You can manage your preferences at any time.
            </p>
          </div>
        </div>

        <div className={styles.cookieActions}>
          <button
            className={styles.btnEssential}
            onClick={handleAcceptEssential}
            title="Accept only essential cookies (recommended)"
          >
            <i className="fas fa-shield-alt" />
            Accept Essential
          </button>
          
          <button
            className={styles.btnReject}
            onClick={handleReject}
            title="Reject all non-essential cookies"
          >
            <i className="fas fa-times-circle" />
            Reject
          </button>
          
          <button
            className={styles.btnAcceptAll}
            onClick={handleAcceptAll}
            title="Accept all cookies including analytics"
          >
            <i className="fas fa-check-circle" />
            Accept All
          </button>
        </div>

        <div className={styles.cookieFooter}>
          <button
            className={styles.linkButton}
            onClick={handleManagePreferences}
          >
            Manage Preferences
          </button>
          <span className={styles.separator}>|</span>
          <a
            href="/privacy"
            className={styles.linkButton}
            onClick={(e) => {
              e.preventDefault();
              navigate("/privacy");
            }}
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;

