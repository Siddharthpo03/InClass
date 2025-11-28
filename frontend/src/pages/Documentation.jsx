import React from "react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import styles from "./Documentation.module.css";

const Documentation = () => {
  return (
    <div className={styles.docsWrapper}>
      <Navigation />
      <div className={styles.docsContainer}>
        <div className={styles.docsHeader}>
          <h1>Documentation</h1>
          <p>Complete guides for Students, Faculty, and Administrators</p>
        </div>

        <div className={styles.docsGrid}>
          <div className={styles.docCard}>
            <div className={styles.docIcon}>
              <i className="bx bx-user"></i>
            </div>
            <h3>Student Guide</h3>
            <ul>
              <li>How to mark attendance</li>
              <li>Viewing attendance records</li>
              <li>Biometric enrollment</li>
              <li>Troubleshooting</li>
            </ul>
            <a href="#" className={styles.docLink}>Read Guide →</a>
          </div>

          <div className={styles.docCard}>
            <div className={styles.docIcon}>
              <i className="bx bx-user-circle"></i>
            </div>
            <h3>Faculty Guide</h3>
            <ul>
              <li>Creating attendance sessions</li>
              <li>Managing classes</li>
              <li>Viewing reports</li>
              <li>Enrolling students</li>
            </ul>
            <a href="#" className={styles.docLink}>Read Guide →</a>
          </div>

          <div className={styles.docCard}>
            <div className={styles.docIcon}>
              <i className="bx bx-shield"></i>
            </div>
            <h3>Admin Guide</h3>
            <ul>
              <li>User management</li>
              <li>System configuration</li>
              <li>Reports and analytics</li>
              <li>Security settings</li>
            </ul>
            <a href="#" className={styles.docLink}>Read Guide →</a>
          </div>

          <div className={styles.docCard}>
            <div className={styles.docIcon}>
              <i className="bx bx-code-alt"></i>
            </div>
            <h3>API Documentation</h3>
            <ul>
              <li>Authentication</li>
              <li>Attendance endpoints</li>
              <li>Biometric APIs</li>
              <li>Webhooks</li>
            </ul>
            <a href="#" className={styles.docLink}>View API Docs →</a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Documentation;

