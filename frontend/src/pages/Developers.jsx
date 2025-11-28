import React from "react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import styles from "./Developers.module.css";

const Developers = () => {
  return (
    <div className={styles.developersWrapper}>
      <Navigation />
      <div className={styles.developersContainer}>
        <div className={styles.developersHeader}>
          <h1>Developer Resources</h1>
          <p>API documentation, SDKs, and integration guides</p>
        </div>

        <div className={styles.resourcesGrid}>
          <div className={styles.resourceCard}>
            <div className={styles.resourceIcon}>
              <i className="bx bx-code-alt"></i>
            </div>
            <h3>REST API</h3>
            <p>Complete REST API documentation with examples and authentication guides.</p>
            <a href="#" className={styles.resourceLink}>View API Docs →</a>
          </div>

          <div className={styles.resourceCard}>
            <div className={styles.resourceIcon}>
              <i className="bx bx-plug"></i>
            </div>
            <h3>Webhooks</h3>
            <p>Set up webhooks to receive real-time notifications for attendance events.</p>
            <a href="#" className={styles.resourceLink}>Learn More →</a>
          </div>

          <div className={styles.resourceCard}>
            <div className={styles.resourceIcon}>
              <i className="bx bx-key"></i>
            </div>
            <h3>Authentication</h3>
            <p>Learn how to authenticate and secure your API requests.</p>
            <a href="#" className={styles.resourceLink}>Get Started →</a>
          </div>

          <div className={styles.resourceCard}>
            <div className={styles.resourceIcon}>
              <i className="bx bx-git-branch"></i>
            </div>
            <h3>GitHub</h3>
            <p>Access our open-source SDKs and example integrations.</p>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>Visit GitHub →</a>
          </div>
        </div>

        <div className={styles.apiSection}>
          <h2>Quick Start</h2>
          <div className={styles.codeBlock}>
            <pre>
{`// Example API Request
const response = await fetch('https://api.inclass.com/attendance', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    student_id: 123,
    session_id: 456,
    code: 'ABC123'
  })
});`}
            </pre>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Developers;

