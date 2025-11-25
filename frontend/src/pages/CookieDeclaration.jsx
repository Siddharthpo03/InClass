import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import {
  getCookieConsent,
  getConsentDate,
  setCookieConsent,
  setEssentialCookie,
  getCookie,
} from "../utils/cookieUtils";
import styles from "./CookieDeclaration.module.css";

const CookieDeclaration = () => {
  const navigate = useNavigate();
  const [currentConsent, setCurrentConsent] = useState(null);
  const [consentDate, setConsentDate] = useState(null);
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false,
    functional: false,
  });
  const [activeCookies, setActiveCookies] = useState([]);

  // Initialize dark mode from localStorage on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const shouldBeDark =
      savedDarkMode !== null ? savedDarkMode === "true" : prefersDark;

    if (shouldBeDark) {
      document.body.classList.add("darkMode");
    } else {
      document.body.classList.remove("darkMode");
    }

    // Load current consent status
    setCurrentConsent(getCookieConsent());
    setConsentDate(getConsentDate());

    // Load saved preferences
    const savedPreferences = localStorage.getItem("cookiePreferences");
    if (savedPreferences) {
      try {
        const prefs = JSON.parse(savedPreferences);
        setCookiePreferences(prefs);
      } catch (e) {
        // If parsing fails, use defaults
      }
    }

    // Check which cookies are currently active
    updateActiveCookies();
  }, []);

  const updateActiveCookies = () => {
    const active = [];
    if (getCookie("session_id")) active.push({ name: "session_id", type: "essential" });
    if (getCookie("analytics_id")) active.push({ name: "analytics_id", type: "analytics" });
    if (getCookie("marketing_id")) active.push({ name: "marketing_id", type: "marketing" });
    if (getCookie("functional_id")) active.push({ name: "functional_id", type: "functional" });
    setActiveCookies(active);
  };

  const handleToggle = (cookieType) => {
    if (cookieType === "essential") return; // Essential cannot be disabled

    const newPreferences = {
      ...cookiePreferences,
      [cookieType]: !cookiePreferences[cookieType],
    };
    setCookiePreferences(newPreferences);
    localStorage.setItem("cookiePreferences", JSON.stringify(newPreferences));

    // Update cookies immediately
    if (newPreferences[cookieType]) {
      // Enable cookie
      const cookieId = `${cookieType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const maxAge = cookieType === "analytics" || cookieType === "marketing" ? 63072000 : 31536000;
      document.cookie = `${cookieType}_id=${cookieId}; path=/; max-age=${maxAge}; SameSite=Lax`;
    } else {
      // Disable cookie
      document.cookie = `${cookieType}_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }

    // Determine consent type
    const hasOptional = newPreferences.analytics || newPreferences.marketing || newPreferences.functional;
    const consentType = hasOptional ? "all" : "essential";
    setCookieConsent(consentType);
    setCurrentConsent(consentType);
    setConsentDate(new Date().toISOString());

    // Update active cookies list
    setTimeout(updateActiveCookies, 100);
  };

  const handleUpdateConsent = (consentType) => {
    let newPreferences;
    if (consentType === "essential") {
      newPreferences = { essential: true, analytics: false, marketing: false, functional: false };
    } else if (consentType === "all") {
      newPreferences = { essential: true, analytics: true, marketing: true, functional: true };
    } else {
      newPreferences = { essential: true, analytics: false, marketing: false, functional: false };
    }

    setCookiePreferences(newPreferences);
    localStorage.setItem("cookiePreferences", JSON.stringify(newPreferences));
    setCookieConsent(consentType);
    setCurrentConsent(consentType);
    setConsentDate(new Date().toISOString());

    // Initialize cookies based on preferences
    if (!getCookie("session_id")) {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setEssentialCookie("session_id", sessionId, 3600);
    }

    if (newPreferences.analytics) {
      const analyticsId = `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      document.cookie = `analytics_id=${analyticsId}; path=/; max-age=63072000; SameSite=Lax`;
    } else {
      document.cookie = "analytics_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    if (newPreferences.marketing) {
      const marketingId = `marketing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      document.cookie = `marketing_id=${marketingId}; path=/; max-age=63072000; SameSite=Lax`;
    } else {
      document.cookie = "marketing_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    if (newPreferences.functional) {
      const functionalId = `functional_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      document.cookie = `functional_id=${functionalId}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      document.cookie = "functional_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }

    setTimeout(updateActiveCookies, 100);
  };

  return (
    <div className={styles.cookiePageWrapper}>
      <Navigation />

      <div className={styles.cookieContainer}>
        <section className={styles.heroSection}>
          <div className={styles.heroBadge}>Cookies</div>
          <h1>Cookie Declaration</h1>
          <p className={styles.subtitle}>
            We use cookies to enhance your experience, analyze site usage, and
            assist in our security efforts. Learn more about how we use cookies.
          </p>
          <div className={styles.lastUpdated}>
            Last Updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </div>
        </section>

        <div className={styles.contentSection}>
          <section className={styles.cookieSection}>
            <h2>What Are Cookies?</h2>
            <p>
              Cookies are small text files that are placed on your device when you
              visit a website. They are widely used to make websites work more
              efficiently and provide information to website owners.
            </p>
          </section>

          <section className={styles.cookieSection}>
            <h2>Types of Cookies We Use</h2>
            
            <div className={styles.cookieType}>
              <h3>Essential Cookies</h3>
              <p>
                These cookies are necessary for the website to function properly.
                They enable core functionality such as security, network management,
                and accessibility.
              </p>
              <div className={styles.cookieDetails}>
                <p><strong>Purpose:</strong> Authentication, session management, security</p>
                <p><strong>Duration:</strong> Session / Persistent</p>
              </div>
            </div>

            <div className={styles.cookieType}>
              <h3>Analytics Cookies</h3>
              <p>
                These cookies help us understand how visitors interact with our
                website by collecting and reporting information anonymously.
              </p>
              <div className={styles.cookieDetails}>
                <p><strong>Purpose:</strong> Website analytics, usage statistics</p>
                <p><strong>Duration:</strong> Persistent (up to 2 years)</p>
              </div>
            </div>

            <div className={styles.cookieType}>
              <h3>Preference Cookies</h3>
              <p>
                These cookies allow the website to remember information that changes
                the way the website behaves or looks, such as your preferred language
                or dark mode preference.
              </p>
              <div className={styles.cookieDetails}>
                <p><strong>Purpose:</strong> User preferences, settings</p>
                <p><strong>Duration:</strong> Persistent (up to 1 year)</p>
              </div>
            </div>
          </section>

          <section className={styles.cookieSection}>
            <h2>Your Cookie Preferences</h2>
            {currentConsent ? (
              <div className={styles.preferenceStatus}>
                <div className={styles.statusBadge}>
                  <i className="fas fa-check-circle" />
                  <span>
                    Current Setting:{" "}
                    <strong>
                      {currentConsent === "essential"
                        ? "Essential Only"
                        : currentConsent === "all"
                        ? "All Cookies"
                        : "Rejected Non-Essential"}
                    </strong>
                  </span>
                </div>
                {consentDate && (
                  <p className={styles.consentDate}>
                    Last updated: {new Date(consentDate).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <div className={styles.preferenceStatus}>
                <div className={styles.statusBadge}>
                  <i className="fas fa-exclamation-circle" />
                  <span>No preference set yet</span>
                </div>
              </div>
            )}

            {/* Active Cookies Display */}
            <div className={styles.activeCookiesSection}>
              <h3>
                <i className="fas fa-list" />
                Currently Active Cookies ({activeCookies.length})
              </h3>
              {activeCookies.length > 0 ? (
                <div className={styles.activeCookiesList}>
                  {activeCookies.map((cookie, index) => (
                    <div key={index} className={styles.activeCookieItem}>
                      <div className={styles.cookieName}>
                        <i className="fas fa-cookie" />
                        <strong>{cookie.name}</strong>
                        <span className={styles.cookieTypeBadge}>{cookie.type}</span>
                      </div>
                      <div className={styles.cookieStatus}>
                        <i className="fas fa-circle" />
                        Active
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noCookies}>No cookies are currently active.</p>
              )}
            </div>

            {/* Granular Cookie Management */}
            <div className={styles.preferenceActions}>
              <h3>
                <i className="fas fa-sliders-h" />
                Manage Individual Cookie Types
              </h3>
              <div className={styles.granularControls}>
                {/* Essential Cookies */}
                <div className={styles.cookieControl}>
                  <div className={styles.controlHeader}>
                    <div className={styles.controlInfo}>
                      <i className="fas fa-shield-alt" />
                      <div>
                        <strong>Essential Cookies</strong>
                        <span>Required for website functionality</span>
                      </div>
                    </div>
                    <div className={styles.toggleContainer}>
                      <input
                        type="checkbox"
                        id="essential-pref"
                        checked={true}
                        disabled={true}
                        className={styles.toggle}
                      />
                      <label htmlFor="essential-pref" className={styles.toggleLabel}>
                        <span className={styles.toggleSlider} />
                      </label>
                    </div>
                  </div>
                  <p className={styles.controlDescription}>
                    These cookies are necessary for the website to function and cannot be disabled.
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className={styles.cookieControl}>
                  <div className={styles.controlHeader}>
                    <div className={styles.controlInfo}>
                      <i className="fas fa-chart-line" />
                      <div>
                        <strong>Analytics Cookies</strong>
                        <span>Help us improve our website</span>
                      </div>
                    </div>
                    <div className={styles.toggleContainer}>
                      <input
                        type="checkbox"
                        id="analytics-pref"
                        checked={cookiePreferences.analytics}
                        onChange={() => handleToggle("analytics")}
                        className={styles.toggle}
                      />
                      <label htmlFor="analytics-pref" className={styles.toggleLabel}>
                        <span className={styles.toggleSlider} />
                      </label>
                    </div>
                  </div>
                  <p className={styles.controlDescription}>
                    These cookies help us understand how visitors interact with our website.
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className={styles.cookieControl}>
                  <div className={styles.controlHeader}>
                    <div className={styles.controlInfo}>
                      <i className="fas fa-bullhorn" />
                      <div>
                        <strong>Marketing Cookies</strong>
                        <span>Personalized ads and content</span>
                      </div>
                    </div>
                    <div className={styles.toggleContainer}>
                      <input
                        type="checkbox"
                        id="marketing-pref"
                        checked={cookiePreferences.marketing}
                        onChange={() => handleToggle("marketing")}
                        className={styles.toggle}
                      />
                      <label htmlFor="marketing-pref" className={styles.toggleLabel}>
                        <span className={styles.toggleSlider} />
                      </label>
                    </div>
                  </div>
                  <p className={styles.controlDescription}>
                    These cookies are used to deliver personalized advertisements.
                  </p>
                </div>

                {/* Functional Cookies */}
                <div className={styles.cookieControl}>
                  <div className={styles.controlHeader}>
                    <div className={styles.controlInfo}>
                      <i className="fas fa-cog" />
                      <div>
                        <strong>Functional Cookies</strong>
                        <span>Enhanced features and preferences</span>
                      </div>
                    </div>
                    <div className={styles.toggleContainer}>
                      <input
                        type="checkbox"
                        id="functional-pref"
                        checked={cookiePreferences.functional}
                        onChange={() => handleToggle("functional")}
                        className={styles.toggle}
                      />
                      <label htmlFor="functional-pref" className={styles.toggleLabel}>
                        <span className={styles.toggleSlider} />
                      </label>
                    </div>
                  </div>
                  <p className={styles.controlDescription}>
                    These cookies enable enhanced functionality and personalization.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
              <h3>
                <i className="fas fa-bolt" />
                Quick Actions
              </h3>
              <div className={styles.preferenceButtons}>
                <button
                  className={styles.prefButton}
                  onClick={() => handleUpdateConsent("essential")}
                >
                  <i className="fas fa-shield-alt" />
                  <div>
                    <strong>Essential Only</strong>
                    <span>Only necessary cookies for website functionality</span>
                  </div>
                </button>
                <button
                  className={styles.prefButton}
                  onClick={() => handleUpdateConsent("all")}
                >
                  <i className="fas fa-check-circle" />
                  <div>
                    <strong>Accept All</strong>
                    <span>Essential + Analytics & Tracking cookies</span>
                  </div>
                </button>
                <button
                  className={styles.prefButton}
                  onClick={() => handleUpdateConsent("rejected")}
                >
                  <i className="fas fa-times-circle" />
                  <div>
                    <strong>Reject Non-Essential</strong>
                    <span>Only essential cookies, reject all others</span>
                  </div>
                </button>
              </div>
            </div>
          </section>

          <section className={styles.cookieSection}>
            <h2>Managing Cookies</h2>
            <p>
              You can control and manage cookies in various ways. Please keep in
              mind that removing or blocking cookies can impact your user experience
              and parts of our website may no longer be fully accessible.
            </p>
            <ul>
              <li>Browser settings: Most browsers allow you to refuse or accept cookies</li>
              <li>Browser extensions: Use privacy-focused extensions</li>
              <li>Our settings: Adjust preferences using the options above</li>
            </ul>
          </section>

          <section className={styles.cookieSection}>
            <h2>Third-Party Cookies</h2>
            <p>
              Some cookies are placed by third-party services that appear on our
              pages. We do not control the setting of these cookies, so please check
              the third-party websites for more information about their cookies and
              how to manage them.
            </p>
          </section>

          <section className={styles.cookieSection}>
            <h2>Contact Us</h2>
            <p>
              If you have questions about our use of cookies, please contact us:
            </p>
            <div className={styles.contactInfo}>
              <p><strong>Email:</strong> privacy@inclass.edu</p>
              <p><strong>Phone:</strong> +1 (555) 123-4567</p>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CookieDeclaration;

