import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import {
  getCookieConsent,
  getConsentDate,
  setCookieConsent,
  setEssentialCookie,
} from "../utils/cookieUtils";
import styles from "./CookieDeclaration.module.css";

const CookieDeclaration = () => {
  const navigate = useNavigate();
  const [currentConsent, setCurrentConsent] = useState(null);
  const [consentDate, setConsentDate] = useState(null);

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
  }, []);

  const handleUpdateConsent = (consentType) => {
    setCookieConsent(consentType);
    setCurrentConsent(consentType);
    setConsentDate(new Date().toISOString());
    
    // Initialize essential cookies
    if (!document.cookie.includes("session_id")) {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setEssentialCookie("session_id", sessionId, 3600);
    }
    
    // Show success message
    alert(`Cookie preferences updated! Your choice: ${consentType === "essential" ? "Essential Only" : consentType === "all" ? "All Cookies" : "Rejected Non-Essential"}`);
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

            <div className={styles.preferenceActions}>
              <h3>Update Your Preferences</h3>
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

