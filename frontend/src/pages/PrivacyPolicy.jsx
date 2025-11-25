import React, { useEffect } from "react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import styles from "./PrivacyPolicy.module.css";

const PrivacyPolicy = () => {
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
  }, []);

  return (
    <div className={styles.privacyPageWrapper}>
      <Navigation />

      <div className={styles.privacyContainer}>
        <section className={styles.heroSection}>
          <div className={styles.heroBadge}>Privacy</div>
          <h1>Privacy Policy</h1>
          <p className={styles.subtitle}>
            Your privacy is important to us. This policy explains how we collect,
            use, and protect your personal information.
          </p>
          <div className={styles.lastUpdated}>
            Last Updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </div>
        </section>

        <div className={styles.contentSection}>
          <section className={styles.policySection}>
            <h2>Information We Collect</h2>
            <p>
              We collect information that you provide directly to us, including:
            </p>
            <ul>
              <li>Name, email address, and contact information</li>
              <li>Student ID, Faculty ID, or Admin credentials</li>
              <li>College and department information</li>
              <li>Attendance records and session data</li>
            </ul>
          </section>

          <section className={styles.policySection}>
            <h2>How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide and maintain our attendance management service</li>
              <li>Process and track attendance records</li>
              <li>Send you important updates and notifications</li>
              <li>Improve our services and user experience</li>
              <li>Ensure security and prevent fraud</li>
            </ul>
          </section>

          <section className={styles.policySection}>
            <h2>Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to
              protect your personal information against unauthorized access,
              alteration, disclosure, or destruction. This includes:
            </p>
            <ul>
              <li>Encrypted data transmission (SSL/TLS)</li>
              <li>Secure database storage</li>
              <li>Regular security audits</li>
              <li>Access controls and authentication</li>
            </ul>
          </section>

          <section className={styles.policySection}>
            <h2>Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to
              provide our services and comply with legal obligations. Attendance
              records are maintained according to institutional requirements.
            </p>
          </section>

          <section className={styles.policySection}>
            <h2>Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
            </ul>
          </section>

          <section className={styles.policySection}>
            <h2>Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to enhance your experience,
              analyze usage, and assist with security. You can control cookies
              through your browser settings.
            </p>
          </section>

          <section className={styles.policySection}>
            <h2>Third-Party Services</h2>
            <p>
              We may use third-party services for analytics, hosting, and other
              functions. These services have their own privacy policies governing
              the use of your information.
            </p>
          </section>

          <section className={styles.policySection}>
            <h2>Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us:
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

export default PrivacyPolicy;

