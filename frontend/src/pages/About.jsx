import React from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import styles from "./About.module.css";

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

const InClassAbout = () => {
  const navigate = useNavigate();

  return (
    <PageLayout
      heroBadge="About InClass"
      heroTitle="Our Mission: Secure, Seamless Presence"
      heroSubtitle="InClass revolutionizes university attendance tracking by replacing outdated paper sheets and unreliable proximity methods with a modern, secure session-based system."
    >
      <section className={classNames("feature-section")}>
        <h2>Core Features & Technology</h2>
        <div className={classNames("feature-grid")}>
          <div className={classNames("feature-card")}>
            <div className={classNames("feature-icon")}>
              <i className="fas fa-shield-alt" />
            </div>
            <h4>Anti-Proxy Security</h4>
            <p>
              Attendance is marked via a time-sensitive session code within a
              browser-locked, full-screen environment. Any attempt to switch
              tabs or exit fullscreen immediately invalidates the attendance,
              ensuring true presence.
            </p>
          </div>
          <div className={classNames("feature-card")}>
            <div className={classNames("feature-icon")}>
              <i className="fas fa-server" />
            </div>
            <h4>Robust Backend</h4>
            <p>
              Built with Node.js, Express, and PostgreSQL, ensuring high data
              integrity, reliability, and scalability for university-level
              operations.
            </p>
          </div>
          <div className={classNames("feature-card")}>
            <div className={classNames("feature-icon")}>
              <i className="fas fa-user-shield" />
            </div>
            <h4>Role-Based Access</h4>
            <p>
              Dedicated portals for Students, Faculty, and Administrators
              ensure users only access the tools and data relevant to their
              role.
            </p>
          </div>
          <div className={classNames("feature-card")}>
            <div className={classNames("feature-icon")}>
              <i className="fas fa-clock" />
            </div>
            <h4>Real-Time Tracking</h4>
            <p>
              Faculty receive instant feedback on attendance submission, and
              students have a limited, displayed window of time to mark their
              presence.
            </p>
          </div>
        </div>
      </section>

      <section className={classNames("ownership-section")}>
        <h2>Software Ownership & Business Rules</h2>
        <div className={classNames("ownership-grid")}>
          <div className={classNames("ownership-card")}>
            <h3>Ownership (BR02)</h3>
            <p>
              This Software Completely Belongs to <strong>InClass Powered By Variance Technologies</strong>.
              All patents and copyrights are reserved on Variance Technologies. If found any
              malpractices with the software, strict actions can be taken by our team on the
              college and the user.
            </p>
          </div>
          <div className={classNames("ownership-card")}>
            <h3>No Selling Policy (BR01)</h3>
            <p>
              The software is proprietary and may not be sold, distributed, or transferred
              without explicit written permission from Variance Technologies. Study purpose
              breakdowns and clones are only accepted by the approval on Variance Technologies only.
            </p>
          </div>
        </div>
        <p className={classNames("ownership-note")}>
          For questions about licensing, partnerships, or study purposes, please contact
          <a href="/contact">Variance Technologies</a>.
        </p>
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
    </PageLayout>
  );
};

export default InClassAbout;
