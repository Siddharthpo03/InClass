import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import styles from "./About.module.css";

const InClassAbout = () => {
  const navigate = useNavigate();

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
    <div className="about-page-wrapper">
      <Navigation />

      <div
        className="about-container"
        style={{ marginTop: "80px", marginBottom: "80px" }}
      >
        <section className="hero-section">
          <h1>Our Mission: Secure, Seamless Presence.</h1>
          <p className={classNames("subtitle")}>
            InClass revolutionizes university attendance tracking by replacing
            outdated paper sheets and unreliable proximity methods with a
            modern, secure session-based system.
          </p>
        </section>

        <section className={classNames("feature-section")}>
          <h2>Core Features & Technology</h2>
          <div className={classNames("feature-grid")}>
            <div className={classNames("feature-card")}>
              <i className="bx bx-shield-alt-2" />
              <h4>Anti-Proxy Security</h4>
              <p>
                Attendance is marked via a time-sensitive session code within a
                browser-locked, full-screen environment. Any attempt to switch
                tabs or exit fullscreen immediately invalidates the attendance,
                ensuring true presence.
              </p>
            </div>
            <div className="feature-card">
              <i className="bx bx-server" />
              <h4>Robust Backend</h4>
              <p>
                Built with Node.js, Express, and PostgreSQL, ensuring high data
                integrity, reliability, and scalability for university-level
                operations.
              </p>
            </div>
            <div className="feature-card">
              <i className="bx bx-check-shield" />
              <h4>Role-Based Access</h4>
              <p>
                Dedicated portals for Students, Faculty, and Administrators
                ensure users only access the tools and data relevant to their
                role.
              </p>
            </div>
            <div className="feature-card">
              <i className="bx bx-time" />
              <h4>Real-Time Tracking</h4>
              <p>
                Faculty receive instant feedback on attendance submission, and
                students have a limited, displayed window of time to mark their
                presence.
              </p>
            </div>
          </div>
        </section>

        <section className={classNames("cta-section")}>
          <h2>Ready to Experience Smart Attendance?</h2>
          <button
            className={classNames("register-cta-btn")}
            onClick={() => navigate("/register")}
          >
            Get Started Today
          </button>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default InClassAbout;
