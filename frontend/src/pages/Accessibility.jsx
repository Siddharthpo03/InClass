import React from "react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import styles from "./Accessibility.module.css";

const Accessibility = () => {
  return (
    <div className={styles.accessibilityWrapper}>
      <Navigation />
      <div className={styles.accessibilityContainer}>
        <div className={styles.accessibilityHeader}>
          <h1>Accessibility Statement</h1>
          <p>InClass is committed to ensuring digital accessibility for all users</p>
        </div>

        <div className={styles.contentSection}>
          <h2>Our Commitment</h2>
          <p>
            InClass is committed to ensuring digital accessibility for people with disabilities. 
            We are continually improving the user experience for everyone and applying the relevant 
            accessibility standards to achieve these goals.
          </p>

          <h2>Accessibility Features</h2>
          <ul>
            <li>Keyboard navigation support throughout the application</li>
            <li>Screen reader compatibility</li>
            <li>High contrast mode for better visibility</li>
            <li>Text size adjustment options</li>
            <li>Alt text for all images</li>
            <li>ARIA labels for interactive elements</li>
          </ul>

          <h2>Standards</h2>
          <p>
            We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. 
            These guidelines explain how to make web content more accessible for people with disabilities.
          </p>

          <h2>Feedback</h2>
          <p>
            If you encounter any accessibility barriers, please contact us at{" "}
            <a href="mailto:accessibility@inclass.com">accessibility@inclass.com</a> or use our{" "}
            <a href="/support">support form</a>.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Accessibility;

