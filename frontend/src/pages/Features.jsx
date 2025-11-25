import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import "./Features.css";

const Features = () => {
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
    <div className="features-page-wrapper">
      <Navigation />

      <div
        className="features-container"
        style={{ marginTop: "80px", marginBottom: "80px" }}
      >
        <section className="hero-section">
          <h1>Powerful Features for Modern Education</h1>
          <p className="subtitle">
            Discover how InClass transforms attendance management with
            cutting-edge technology and user-friendly design.
          </p>
        </section>

        <section className="features-grid-section">
          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-shield-alt" />
            </div>
            <h3>Anti-Proxy Security</h3>
            <p>
              Advanced browser-locked sessions prevent proxy attendance. Full-screen
              mode ensures students are physically present in the classroom.
            </p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-clock" />
            </div>
            <h3>Time-Restricted Sessions</h3>
            <p>
              Faculty creates time-sensitive attendance codes. Students must mark
              attendance within the specified window, preventing late entries.
            </p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-users" />
            </div>
            <h3>Role-Based Dashboards</h3>
            <p>
              Customized interfaces for Students, Faculty, and Administrators.
              Each role sees only relevant information and actions.
            </p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-chart-line" />
            </div>
            <h3>Real-Time Analytics</h3>
            <p>
              Instant attendance tracking and reporting. Faculty can see live
              attendance status as students mark their presence.
            </p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-database" />
            </div>
            <h3>Secure Data Storage</h3>
            <p>
              PostgreSQL database ensures data integrity and reliability. All
              attendance records are securely stored and easily accessible.
            </p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-mobile-alt" />
            </div>
            <h3>Responsive Design</h3>
            <p>
              Works seamlessly on desktop, tablet, and mobile devices. Access
              your attendance system from anywhere, anytime.
            </p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-bell" />
            </div>
            <h3>Instant Notifications</h3>
            <p>
              Get notified when attendance sessions start, end, or when students
              mark their presence. Stay updated in real-time.
            </p>
          </div>

          <div className="feature-item">
            <div className="feature-icon">
              <i className="fas fa-file-export" />
            </div>
            <h3>Export Reports</h3>
            <p>
              Generate comprehensive attendance reports. Export data in various
              formats for record-keeping and analysis.
            </p>
          </div>
        </section>

        <section className="cta-section">
          <h2>Experience These Features Today</h2>
          <button
            className="register-cta-btn"
            onClick={() => navigate("/register")}
          >
            Get Started
          </button>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Features;

