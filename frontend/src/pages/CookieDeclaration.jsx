import React, { useEffect } from "react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import styles from "./CookieDeclaration.module.css";

const CookieDeclaration = () => {
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
            <h2>Managing Cookies</h2>
            <p>
              You can control and manage cookies in various ways. Please keep in
              mind that removing or blocking cookies can impact your user experience
              and parts of our website may no longer be fully accessible.
            </p>
            <ul>
              <li>Browser settings: Most browsers allow you to refuse or accept cookies</li>
              <li>Browser extensions: Use privacy-focused extensions</li>
              <li>Our settings: Adjust preferences in your account settings</li>
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

