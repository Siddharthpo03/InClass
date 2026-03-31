import React from "react";
import PageLayout from "../components/layout/PageLayout";
import styles from "./HelpCenter.module.css";

const HelpCenter = () => {
  return (
    <PageLayout
      heroTitle="Help Center"
      heroSubtitle="Find answers to common questions and get support"
    >
      <div className={styles.searchSection}>
        <div className={styles.searchBox}>
          <i className="bx bx-search"></i>
          <input type="text" placeholder="Search for help..." />
        </div>
      </div>

      <div className={styles.categoriesGrid}>
        <div className={styles.categoryCard}>
          <div className={styles.categoryIcon}>
            <i className="bx bx-user"></i>
          </div>
          <h3>For Students</h3>
          <p>Learn how to mark attendance, view your records, and more</p>
          <a href="#" className={styles.categoryLink}>View Guide →</a>
        </div>

        <div className={styles.categoryCard}>
          <div className={styles.categoryIcon}>
            <i className="bx bx-user-circle"></i>
          </div>
          <h3>For Faculty</h3>
          <p>Learn how to create sessions, manage classes, and track attendance</p>
          <a href="#" className={styles.categoryLink}>View Guide →</a>
        </div>

        <div className={styles.categoryCard}>
          <div className={styles.categoryIcon}>
            <i className="bx bx-shield"></i>
          </div>
          <h3>For Administrators</h3>
          <p>System management, user administration, and reports</p>
          <a href="#" className={styles.categoryLink}>View Guide →</a>
        </div>

        <div className={styles.categoryCard}>
          <div className={styles.categoryIcon}>
            <i className="bx bx-cog"></i>
          </div>
          <h3>Technical Support</h3>
          <p>Troubleshooting, system requirements, and technical issues</p>
          <a href="#" className={styles.categoryLink}>Get Support →</a>
        </div>
      </div>

      <div className={styles.faqSection}>
        <h2>Frequently Asked Questions</h2>
        <div className={styles.faqList}>
          <div className={styles.faqItem}>
            <h4>How do I mark my attendance as a student?</h4>
            <p>Go to your dashboard, enter the attendance code provided by your faculty, and submit. You will verify with face recognition.</p>
          </div>
          <div className={styles.faqItem}>
            <h4>How do I create an attendance session as faculty?</h4>
            <p>Navigate to your dashboard, select the class, click "Start Session", and share the generated code with your students.</p>
          </div>
          <div className={styles.faqItem}>
            <h4>What if I forget my password?</h4>
            <p>Click on "Forgot Password" on the login page and follow the instructions to reset your password.</p>
          </div>
          <div className={styles.faqItem}>
            <h4>How does biometric verification work?</h4>
            <p>You can enroll your face in your profile settings. During attendance, the system will verify your identity with face recognition.</p>
          </div>
        </div>
      </div>

      <div className={styles.contactSection}>
        <h2>Still Need Help?</h2>
        <p>Contact our support team</p>
        <div className={styles.contactButtons}>
          <a href="/contact" className={styles.contactButton}>
            <i className="bx bx-envelope"></i>
            Contact Support
          </a>
          <a href="/report" className={styles.contactButton}>
            <i className="bx bx-bug"></i>
            Report an Issue
          </a>
        </div>
      </div>
    </PageLayout>
  );
};

export default HelpCenter;
