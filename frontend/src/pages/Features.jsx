import React from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import styles from "./Features.module.css";

const classNames = (...classes) =>
  classes
    .filter(Boolean)
    .map((cls) => {
      if (typeof cls === "string") {
        const camelCase = cls.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        return styles[camelCase] || styles[cls] || cls;
      }
      return null;
    })
    .filter(Boolean)
    .join(" ");

const Features = () => {
  const navigate = useNavigate();

  return (
    <PageLayout
      heroBadge="Features"
      heroTitle="Powerful Features for Modern Education"
      heroSubtitle="Discover how InClass transforms attendance management with cutting-edge technology and user-friendly design."
    >
      <section className={classNames("feature-section")}>
        <h2>What InClass Offers</h2>
        <div className={classNames("feature-grid")}>
          <div className={classNames("feature-card")}>
            <div className={classNames("feature-icon")}>
              <i className="fas fa-shield-alt" />
            </div>
            <h4>Anti-Proxy Security</h4>
            <p>
              Advanced browser-locked sessions prevent proxy attendance.
              Full-screen mode ensures students are physically present in the classroom.
            </p>
          </div>
          <div className={classNames("feature-card")}>
            <div className={classNames("feature-icon")}>
              <i className="fas fa-clock" />
            </div>
            <h4>Time-Restricted Sessions</h4>
            <p>
              Faculty creates time-sensitive attendance codes. Students must mark
              attendance within the specified window, preventing late entries.
            </p>
          </div>
          <div className={classNames("feature-card")}>
            <div className={classNames("feature-icon")}>
              <i className="fas fa-users" />
            </div>
            <h4>Role-Based Dashboards</h4>
            <p>
              Customized interfaces for Students, Faculty, and Administrators.
              Each role sees only relevant information and actions.
            </p>
          </div>
          <div className={classNames("feature-card")}>
            <div className={classNames("feature-icon")}>
              <i className="fas fa-chart-line" />
            </div>
            <h4>Real-Time Analytics</h4>
            <p>
              Instant attendance tracking and reporting. Faculty can see live
              attendance status as students mark their presence.
            </p>
          </div>
          <div className={classNames("feature-card")}>
            <div className={classNames("feature-icon")}>
              <i className="fas fa-database" />
            </div>
            <h4>Secure Data Storage</h4>
            <p>
              PostgreSQL database ensures data integrity and reliability. All
              attendance records are securely stored and easily accessible.
            </p>
          </div>
          <div className={classNames("feature-card")}>
            <div className={classNames("feature-icon")}>
              <i className="fas fa-mobile-alt" />
            </div>
            <h4>Responsive Design</h4>
            <p>
              Works seamlessly on desktop, tablet, and mobile devices. Access
              your attendance system from anywhere, anytime.
            </p>
          </div>
        </div>
      </section>

      <section className={classNames("cta-section")}>
        <h2>Experience These Features Today</h2>
        <button
          className={classNames("register-cta-btn")}
          onClick={() => navigate("/register")}
        >
          Get Started Today
        </button>
      </section>
    </PageLayout>
  );
};

export default Features;
