import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  setCookieConsent,
  setEssentialCookie,
  getCookie,
} from "../utils/cookieUtils";
import styles from "./CookieConsent.module.css";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const navigate = useNavigate();

  // Cookie preferences state
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true, // Always true, cannot be disabled
    analytics: false,
    marketing: false,
    functional: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem("cookieConsent");
    const savedPreferences = localStorage.getItem("cookiePreferences");

    // Load saved preferences if they exist
    if (savedPreferences) {
      try {
        const prefs = JSON.parse(savedPreferences);
        setCookiePreferences(prefs);
      } catch (e) {
        // If parsing fails, use defaults
        console.error("Error parsing cookie preferences:", e);
      }
    }

    // Show banner if no consent has been given
    // This will show on first visit or if consent was cleared
    if (!cookieConsent || cookieConsent === null || cookieConsent === "") {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
        console.log("Cookie consent banner displayed");
      }, 1000);
      
      // Cleanup timer on unmount
      return () => clearTimeout(timer);
    } else {
      console.log("Cookie consent already set:", cookieConsent);
    }
  }, []);

  const handleToggle = (cookieType) => {
    // Essential cookies cannot be disabled
    if (cookieType === "essential") return;

    setCookiePreferences((prev) => ({
      ...prev,
      [cookieType]: !prev[cookieType],
    }));
  };

  const handleSavePreferences = () => {
    // Save preferences
    localStorage.setItem("cookiePreferences", JSON.stringify(cookiePreferences));
    
    // Determine consent type based on preferences
    const hasOptional = cookiePreferences.analytics || cookiePreferences.marketing || cookiePreferences.functional;
    const consentType = hasOptional ? "all" : "essential";
    
    setCookieConsent(consentType);
    setIsVisible(false);

    // Initialize cookies based on preferences
    initializeCookies();
  };

  const handleAcceptEssential = () => {
    // Only accept essential cookies
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    
    localStorage.setItem("cookiePreferences", JSON.stringify(essentialOnly));
    setCookieConsent("essential");
    setIsVisible(false);
    
    // Initialize essential cookies only
    initializeCookies();
  };

  const handleAcceptAll = () => {
    // Accept all cookies
    const allAccepted = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    
    localStorage.setItem("cookiePreferences", JSON.stringify(allAccepted));
    setCookieConsent("all");
    setIsVisible(false);
    
    // Initialize all cookies
    initializeCookies();
  };

  const handleReject = () => {
    // Reject all non-essential cookies
    const essentialOnly = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    
    localStorage.setItem("cookiePreferences", JSON.stringify(essentialOnly));
    setCookieConsent("rejected");
    setIsVisible(false);
    
    // Only initialize essential cookies
    initializeCookies();
  };

  const initializeCookies = () => {
    // Essential cookies - always set
    if (!getCookie("session_id")) {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setEssentialCookie("session_id", sessionId, 3600); // 1 hour
    }

    // Analytics cookies - only if enabled
    if (cookiePreferences.analytics) {
      // Initialize analytics cookies
      const analyticsId = `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      document.cookie = `analytics_id=${analyticsId}; path=/; max-age=63072000; SameSite=Lax`; // 2 years
    } else {
      // Remove analytics cookies if disabled
      document.cookie = "analytics_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    // Marketing cookies - only if enabled
    if (cookiePreferences.marketing) {
      const marketingId = `marketing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      document.cookie = `marketing_id=${marketingId}; path=/; max-age=63072000; SameSite=Lax`; // 2 years
    } else {
      document.cookie = "marketing_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    // Functional cookies - only if enabled
    if (cookiePreferences.functional) {
      const functionalId = `functional_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      document.cookie = `functional_id=${functionalId}; path=/; max-age=31536000; SameSite=Lax`; // 1 year
    } else {
      document.cookie = "functional_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  };

  const handleManagePreferences = () => {
    navigate("/cookies");
    setIsVisible(false);
  };

  const getActiveCookiesCount = () => {
    let count = 1; // Essential is always active
    if (cookiePreferences.analytics) count++;
    if (cookiePreferences.marketing) count++;
    if (cookiePreferences.functional) count++;
    return count;
  };

  // Always render, but control visibility
  return (
    <div 
      className={styles.cookieConsentOverlay}
      style={{ 
        display: isVisible ? 'block' : 'none',
        opacity: isVisible ? 1 : 0,
        pointerEvents: isVisible ? 'auto' : 'none'
      }}
    >
      <div className={styles.cookieConsentBanner}>
        <div className={styles.cookieConsentHeader}>
          <div className={styles.cookieIcon}>
            <i className="fas fa-cookie-bite" />
          </div>
          <div className={styles.headerText}>
            <h3>Cookie Preferences</h3>
            <p>We respect your privacy. Choose which cookies you want to accept.</p>
          </div>
          <button
            className={styles.closeButton}
            onClick={() => setIsVisible(false)}
            aria-label="Close"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        {!showDetails ? (
          <>
            <div className={styles.cookieSummary}>
              <div className={styles.summaryItem}>
                <i className="fas fa-shield-alt" />
                <div>
                  <strong>Essential Cookies</strong>
                  <span>Always Active (Required)</span>
                </div>
                <div className={styles.badgeActive}>Active</div>
              </div>
              <div className={styles.summaryItem}>
                <i className="fas fa-chart-line" />
                <div>
                  <strong>Analytics Cookies</strong>
                  <span>Help us improve our website</span>
                </div>
                <div className={cookiePreferences.analytics ? styles.badgeActive : styles.badgeInactive}>
                  {cookiePreferences.analytics ? "Active" : "Inactive"}
                </div>
              </div>
              <div className={styles.summaryItem}>
                <i className="fas fa-bullhorn" />
                <div>
                  <strong>Marketing Cookies</strong>
                  <span>Personalized ads and content</span>
                </div>
                <div className={cookiePreferences.marketing ? styles.badgeActive : styles.badgeInactive}>
                  {cookiePreferences.marketing ? "Active" : "Inactive"}
                </div>
              </div>
              <div className={styles.summaryItem}>
                <i className="fas fa-cog" />
                <div>
                  <strong>Functional Cookies</strong>
                  <span>Enhanced features and preferences</span>
                </div>
                <div className={cookiePreferences.functional ? styles.badgeActive : styles.badgeInactive}>
                  {cookiePreferences.functional ? "Active" : "Inactive"}
                </div>
              </div>
            </div>

            <div className={styles.activeCookiesInfo}>
              <i className="fas fa-info-circle" />
              <span>
                <strong>{getActiveCookiesCount()} of 4</strong> cookie categories are currently active
              </span>
            </div>

            <div className={styles.cookieActions}>
              <button
                className={styles.btnDetails}
                onClick={() => setShowDetails(true)}
              >
                <i className="fas fa-sliders-h" />
                Customize Preferences
              </button>
              <button
                className={styles.btnEssential}
                onClick={handleAcceptEssential}
              >
                <i className="fas fa-shield-alt" />
                Essential Only
              </button>
              <button
                className={styles.btnReject}
                onClick={handleReject}
              >
                <i className="fas fa-times-circle" />
                Reject All
              </button>
              <button
                className={styles.btnAcceptAll}
                onClick={handleAcceptAll}
              >
                <i className="fas fa-check-circle" />
                Accept All
              </button>
            </div>
          </>
        ) : (
          <div className={styles.detailedView}>
            <div className={styles.detailedHeader}>
              <h4>Customize Your Cookie Preferences</h4>
              <p>Select which types of cookies you want to accept. Essential cookies are required and cannot be disabled.</p>
            </div>

            <div className={styles.cookieCategories}>
              {/* Essential Cookies */}
              <div className={styles.cookieCategory}>
                <div className={styles.categoryHeader}>
                  <div className={styles.categoryInfo}>
                    <i className="fas fa-shield-alt" />
                    <div>
                      <h5>Essential Cookies</h5>
                      <p>Required for the website to function properly</p>
                    </div>
                  </div>
                  <div className={styles.toggleContainer}>
                    <input
                      type="checkbox"
                      id="essential"
                      checked={true}
                      disabled={true}
                      className={styles.toggle}
                    />
                    <label htmlFor="essential" className={styles.toggleLabel}>
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
                <div className={styles.categoryDetails}>
                  <p><strong>Purpose:</strong> Authentication, session management, security</p>
                  <p><strong>Duration:</strong> Session / 1 hour</p>
                  <p><strong>Examples:</strong> session_id, csrf_token</p>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className={styles.cookieCategory}>
                <div className={styles.categoryHeader}>
                  <div className={styles.categoryInfo}>
                    <i className="fas fa-chart-line" />
                    <div>
                      <h5>Analytics Cookies</h5>
                      <p>Help us understand how visitors use our website</p>
                    </div>
                  </div>
                  <div className={styles.toggleContainer}>
                    <input
                      type="checkbox"
                      id="analytics"
                      checked={cookiePreferences.analytics}
                      onChange={() => handleToggle("analytics")}
                      className={styles.toggle}
                    />
                    <label htmlFor="analytics" className={styles.toggleLabel}>
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
                <div className={styles.categoryDetails}>
                  <p><strong>Purpose:</strong> Website analytics, usage statistics, performance monitoring</p>
                  <p><strong>Duration:</strong> Up to 2 years</p>
                  <p><strong>Examples:</strong> analytics_id, page_views, user_behavior</p>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className={styles.cookieCategory}>
                <div className={styles.categoryHeader}>
                  <div className={styles.categoryInfo}>
                    <i className="fas fa-bullhorn" />
                    <div>
                      <h5>Marketing Cookies</h5>
                      <p>Used to deliver personalized ads and track campaign performance</p>
                    </div>
                  </div>
                  <div className={styles.toggleContainer}>
                    <input
                      type="checkbox"
                      id="marketing"
                      checked={cookiePreferences.marketing}
                      onChange={() => handleToggle("marketing")}
                      className={styles.toggle}
                    />
                    <label htmlFor="marketing" className={styles.toggleLabel}>
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
                <div className={styles.categoryDetails}>
                  <p><strong>Purpose:</strong> Advertising, campaign tracking, personalization</p>
                  <p><strong>Duration:</strong> Up to 2 years</p>
                  <p><strong>Examples:</strong> marketing_id, ad_preferences, campaign_data</p>
                </div>
              </div>

              {/* Functional Cookies */}
              <div className={styles.cookieCategory}>
                <div className={styles.categoryHeader}>
                  <div className={styles.categoryInfo}>
                    <i className="fas fa-cog" />
                    <div>
                      <h5>Functional Cookies</h5>
                      <p>Enable enhanced features and remember your preferences</p>
                    </div>
                  </div>
                  <div className={styles.toggleContainer}>
                    <input
                      type="checkbox"
                      id="functional"
                      checked={cookiePreferences.functional}
                      onChange={() => handleToggle("functional")}
                      className={styles.toggle}
                    />
                    <label htmlFor="functional" className={styles.toggleLabel}>
                      <span className={styles.toggleSlider} />
                    </label>
                  </div>
                </div>
                <div className={styles.categoryDetails}>
                  <p><strong>Purpose:</strong> User preferences, settings, enhanced functionality</p>
                  <p><strong>Duration:</strong> Up to 1 year</p>
                  <p><strong>Examples:</strong> functional_id, language_pref, theme_pref</p>
                </div>
              </div>
            </div>

            <div className={styles.detailedActions}>
              <button
                className={styles.btnBack}
                onClick={() => setShowDetails(false)}
              >
                <i className="fas fa-arrow-left" />
                Back
              </button>
              <button
                className={styles.btnSave}
                onClick={handleSavePreferences}
              >
                <i className="fas fa-save" />
                Save Preferences
              </button>
            </div>
          </div>
        )}

        <div className={styles.cookieFooter}>
          <button
            className={styles.linkButton}
            onClick={handleManagePreferences}
          >
            <i className="fas fa-cog" />
            Manage All Preferences
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
            <i className="fas fa-shield-alt" />
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
