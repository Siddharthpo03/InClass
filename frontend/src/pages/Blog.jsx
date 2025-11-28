import React from "react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import styles from "./Blog.module.css";

const Blog = () => {
  return (
    <div className={styles.blogWrapper}>
      <Navigation />
      <div className={styles.blogContainer}>
        <div className={styles.blogHeader}>
          <h1>Blog & Updates</h1>
          <p>Stay updated with the latest features and news</p>
        </div>

        <div className={styles.blogGrid}>
          <div className={styles.blogCard}>
            <div className={styles.blogImage}>
              <i className="bx bx-calendar-check"></i>
            </div>
            <div className={styles.blogContent}>
              <span className={styles.blogDate}>January 15, 2025</span>
              <h3>New Biometric Features Released</h3>
              <p>We've added enhanced face recognition and fingerprint support for better attendance tracking.</p>
              <a href="#" className={styles.blogLink}>Read More →</a>
            </div>
          </div>

          <div className={styles.blogCard}>
            <div className={styles.blogImage}>
              <i className="bx bx-shield"></i>
            </div>
            <div className={styles.blogContent}>
              <span className={styles.blogDate}>January 10, 2025</span>
              <h3>Enhanced Security Updates</h3>
              <p>New security measures have been implemented to protect your data and privacy.</p>
              <a href="#" className={styles.blogLink}>Read More →</a>
            </div>
          </div>

          <div className={styles.blogCard}>
            <div className={styles.blogImage}>
              <i className="bx bx-mobile"></i>
            </div>
            <div className={styles.blogContent}>
              <span className={styles.blogDate}>January 5, 2025</span>
              <h3>Mobile App Coming Soon</h3>
              <p>We're working on a mobile app for iOS and Android to make attendance marking even easier.</p>
              <a href="#" className={styles.blogLink}>Read More →</a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Blog;

