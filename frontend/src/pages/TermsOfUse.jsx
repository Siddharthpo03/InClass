import React, { useEffect } from "react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import styles from "./TermsOfUse.module.css";

const TermsOfUse = () => {
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
    <div className={styles.termsPageWrapper}>
      <Navigation />

      <div className={styles.termsContainer}>
        <section className={styles.heroSection}>
          <div className={styles.heroBadge}>Legal</div>
          <h1>Terms of Use</h1>
          <p className={styles.subtitle}>
            Please read these terms carefully before using InClass. By using our
            service, you agree to be bound by these terms.
          </p>
          <div className={styles.lastUpdated}>
            Last Updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </div>
        </section>

        <div className={styles.contentSection}>
          <section className={styles.termsSection}>
            <div className={styles.sectionNumber}>01</div>
            <div className={styles.sectionContent}>
              <h2>Acceptance of Terms</h2>
              <p>
                By accessing and using InClass, you accept and agree to be bound
                by the terms and provision of this agreement. If you do not agree
                to abide by the above, please do not use this service.
              </p>
            </div>
          </section>

          <section className={styles.termsSection}>
            <div className={styles.sectionNumber}>02</div>
            <div className={styles.sectionContent}>
              <h2>Use License</h2>
              <p>
                Permission is granted to temporarily use InClass for personal,
                non-commercial transitory viewing only. This is the grant of a
                license, not a transfer of title, and under this license you may not:
              </p>
              <ul>
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose</li>
                <li>Attempt to reverse engineer any software contained in InClass</li>
                <li>Remove any copyright or other proprietary notations</li>
              </ul>
            </div>
          </section>

          <section className={styles.termsSection}>
            <div className={styles.sectionNumber}>03</div>
            <div className={styles.sectionContent}>
              <h2>User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your
                account credentials. You agree to accept responsibility for all
                activities that occur under your account.
              </p>
              <p>
                You must provide accurate, current, and complete information during
                registration and keep your account information updated.
              </p>
            </div>
          </section>

          <section className={styles.termsSection}>
            <div className={styles.sectionNumber}>04</div>
            <div className={styles.sectionContent}>
              <h2>Attendance System Rules</h2>
              <p>
                InClass uses advanced security measures to ensure accurate attendance
                tracking. Users must:
              </p>
              <ul>
                <li>Be physically present when marking attendance</li>
                <li>Not attempt to bypass security measures</li>
                <li>Not share session codes with unauthorized users</li>
                <li>Comply with all time restrictions for attendance sessions</li>
              </ul>
            </div>
          </section>

          <section className={styles.termsSection}>
            <div className={styles.sectionNumber}>05</div>
            <div className={styles.sectionContent}>
              <h2>Prohibited Activities</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Use InClass for any unlawful purpose</li>
                <li>Interfere with or disrupt the service</li>
                <li>Attempt to gain unauthorized access to any portion of the service</li>
                <li>Use automated systems to access the service without permission</li>
                <li>Impersonate any person or entity</li>
              </ul>
            </div>
          </section>

          <section className={styles.termsSection}>
            <div className={styles.sectionNumber}>06</div>
            <div className={styles.sectionContent}>
              <h2>Intellectual Property</h2>
              <p>
                All content, features, and functionality of InClass are owned by us
                and are protected by international copyright, trademark, patent, trade
                secret, and other intellectual property laws.
              </p>
            </div>
          </section>

          <section className={styles.termsSection}>
            <div className={styles.sectionNumber}>07</div>
            <div className={styles.sectionContent}>
              <h2>Limitation of Liability</h2>
              <p>
                In no event shall InClass or its suppliers be liable for any damages
                (including, without limitation, damages for loss of data or profit,
                or due to business interruption) arising out of the use or inability
                to use InClass.
              </p>
            </div>
          </section>

          <section className={styles.termsSection}>
            <div className={styles.sectionNumber}>08</div>
            <div className={styles.sectionContent}>
              <h2>Termination</h2>
              <p>
                We may terminate or suspend your account and access to the service
                immediately, without prior notice, for conduct that we believe violates
                these Terms of Use or is harmful to other users, us, or third parties.
              </p>
            </div>
          </section>

          <section className={styles.termsSection}>
            <div className={styles.sectionNumber}>09</div>
            <div className={styles.sectionContent}>
              <h2>Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify
                users of any changes by posting the new Terms of Use on this page.
                Your continued use of the service after such changes constitutes
                acceptance of the new terms.
              </p>
            </div>
          </section>

          <section className={styles.termsSection}>
            <div className={styles.sectionNumber}>10</div>
            <div className={styles.sectionContent}>
              <h2>Contact Information</h2>
              <p>
                If you have any questions about these Terms of Use, please contact us at:
              </p>
              <div className={styles.contactInfo}>
                <p><strong>Email:</strong> legal@inclass.edu</p>
                <p><strong>Phone:</strong> +1 (555) 123-4567</p>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default TermsOfUse;

