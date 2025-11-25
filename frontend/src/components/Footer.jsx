import React from "react";
import styles from "./Footer.module.css";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.row2}>
        <div className={styles.footerLinks}>
          <a href="#">Terms of Use</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Careers</a>
          <a href="#">Cookie Declaration</a>
        </div>
        <div className={styles.copyright}>
          <p>&copy; 2025 InClass | Made for Smart Campus</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

