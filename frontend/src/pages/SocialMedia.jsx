import React from "react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import styles from "./SocialMedia.module.css";

const SocialMedia = () => {
  return (
    <div className={styles.socialWrapper}>
      <Navigation />
      <div className={styles.socialContainer}>
        <div className={styles.socialHeader}>
          <h1>Connect With Us</h1>
          <p>Follow us on social media for updates, tips, and community discussions</p>
        </div>

        <div className={styles.socialGrid}>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className={styles.socialCard}>
            <div className={styles.socialIcon} style={{ background: "linear-gradient(135deg, #1DA1F2 0%, #0d8bd9 100%)" }}>
              <i className="bx bxl-twitter"></i>
            </div>
            <h3>Twitter</h3>
            <p>Follow us for updates and announcements</p>
            <span className={styles.socialLink}>@InClass →</span>
          </a>

          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={styles.socialCard}>
            <div className={styles.socialIcon} style={{ background: "linear-gradient(135deg, #0077b5 0%, #005885 100%)" }}>
              <i className="bx bxl-linkedin"></i>
            </div>
            <h3>LinkedIn</h3>
            <p>Connect with our professional network</p>
            <span className={styles.socialLink}>InClass Company →</span>
          </a>

          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={styles.socialCard}>
            <div className={styles.socialIcon} style={{ background: "linear-gradient(135deg, #1877F2 0%, #0e5aa8 100%)" }}>
              <i className="bx bxl-facebook"></i>
            </div>
            <h3>Facebook</h3>
            <p>Join our community page</p>
            <span className={styles.socialLink}>InClass →</span>
          </a>

          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className={styles.socialCard}>
            <div className={styles.socialIcon} style={{ background: "linear-gradient(135deg, #333 0%, #000 100%)" }}>
              <i className="bx bxl-github"></i>
            </div>
            <h3>GitHub</h3>
            <p>Check out our open-source projects</p>
            <span className={styles.socialLink}>@InClass →</span>
          </a>

          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className={styles.socialCard}>
            <div className={styles.socialIcon} style={{ background: "linear-gradient(135deg, #FF0000 0%, #cc0000 100%)" }}>
              <i className="bx bxl-youtube"></i>
            </div>
            <h3>YouTube</h3>
            <p>Watch tutorials and demos</p>
            <span className={styles.socialLink}>InClass Channel →</span>
          </a>

          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialCard}>
            <div className={styles.socialIcon} style={{ background: "linear-gradient(135deg, #E4405F 0%, #C13584 100%)" }}>
              <i className="bx bxl-instagram"></i>
            </div>
            <h3>Instagram</h3>
            <p>See behind-the-scenes content</p>
            <span className={styles.socialLink}>@InClass →</span>
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SocialMedia;

