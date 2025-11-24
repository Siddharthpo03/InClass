import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./About.module.css";

// Assuming you have a reusable Footer or Header, but we keep the JSX self-contained here.
// In a real app, you would reuse the Header/Footer components from InClassHomepage.jsx.

const InClassAbout = () => {
  const navigate = useNavigate();

  const classNames = (...classes) =>
    classes
      .flat()
      .filter(Boolean)
      .map((cls) => styles[cls] || cls)
      .join(" ")
      .trim();

  const handleBackToHome = () => {
    navigate("/");
  };

  return (
    <div className={classNames("about-page-wrapper")}>
      <header className={classNames("about-header")}>
        <div className={classNames("header-content")}>
          <span className={classNames("brand-name")}>
            InClass Attendance System
          </span>
          <button className={classNames("back-btn")} onClick={handleBackToHome}>
            <i className="bx bx-arrow-back" /> Back to Home
          </button>
        </div>
      </header>

      <div className={classNames("about-container")}>
        <section className={classNames("hero-section")}>
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

      <footer className={classNames("about-footer")}>
        <p>InClass | Driving efficiency for the Smart Campus.</p>
      </footer>
    </div>
  );
};

export default InClassAbout;
