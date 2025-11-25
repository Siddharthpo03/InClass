import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Footer.module.css";

const Footer = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => (e) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.row2}>
        <div className={styles.footerLinks}>
          <a href="#" onClick={handleNavigation("/terms")}>Terms of Use</a>
          <a href="#" onClick={handleNavigation("/privacy")}>Privacy Policy</a>
          <a href="#" onClick={handleNavigation("/careers")}>Careers</a>
          <a href="#" onClick={handleNavigation("/cookies")}>Cookie Declaration</a>
        </div>
        <div className={styles.copyright}>
          <p>&copy; 2025 InClass | Made for Smart Campus</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

