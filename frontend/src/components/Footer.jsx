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
      <div className={styles.footerContainer}>
        {/* Main Footer Content */}
        <div className={styles.footerMain}>
          {/* Logo Section */}
          <div className={styles.footerLogo}>
            <div className={styles.logoContainer}>
              <img src="/favicon.jpg" alt="InClass Logo" className={styles.logoImage} />
              <span className={styles.logoText}>InClass</span>
            </div>
          </div>

          {/* Footer Links Grid */}
          <div className={styles.footerLinksGrid}>
            {/* For Students Section */}
            <div className={styles.footerColumn}>
              <h4 className={styles.columnTitle}>For Students</h4>
              <ul className={styles.linkList}>
                <li><a href="#" onClick={handleNavigation("/student/dashboard")}>Student Dashboard</a></li>
                <li><a href="#" onClick={handleNavigation("/help")}>How to Mark Attendance</a></li>
                <li><a href="#" onClick={handleNavigation("/docs")}>Student Guide</a></li>
                <li><a href="#" onClick={handleNavigation("/support")}>Get Help</a></li>
                <li><a href="#" onClick={handleNavigation("/features")}>Features</a></li>
              </ul>
            </div>

            {/* For Faculty Section */}
            <div className={styles.footerColumn}>
              <h4 className={styles.columnTitle}>For Faculty</h4>
              <ul className={styles.linkList}>
                <li><a href="#" onClick={handleNavigation("/faculty/dashboard")}>Faculty Dashboard</a></li>
                <li><a href="#" onClick={handleNavigation("/docs")}>Faculty Guide</a></li>
                <li><a href="#" onClick={handleNavigation("/help")}>How to Take Attendance</a></li>
                <li><a href="#" onClick={handleNavigation("/support")}>Support</a></li>
                <li><a href="#" onClick={handleNavigation("/features")}>System Features</a></li>
              </ul>
            </div>

            {/* For Administrators Section */}
            <div className={styles.footerColumn}>
              <h4 className={styles.columnTitle}>For Administrators</h4>
              <ul className={styles.linkList}>
                <li><a href="#" onClick={handleNavigation("/admin/dashboard")}>Admin Dashboard</a></li>
                <li><a href="#" onClick={handleNavigation("/docs")}>Admin Guide</a></li>
                <li><a href="#" onClick={handleNavigation("/developers")}>API Documentation</a></li>
                <li><a href="#" onClick={handleNavigation("/support")}>Technical Support</a></li>
                <li><a href="#" onClick={handleNavigation("/report")}>Report Issue</a></li>
              </ul>
            </div>

            {/* Resources Section */}
            <div className={styles.footerColumn}>
              <h4 className={styles.columnTitle}>Resources</h4>
              <ul className={styles.linkList}>
                <li><a href="#" onClick={handleNavigation("/help")}>Help Center</a></li>
                <li><a href="#" onClick={handleNavigation("/docs")}>Documentation</a></li>
                <li><a href="#" onClick={handleNavigation("/blog")}>Blog & Updates</a></li>
                <li><a href="#" onClick={handleNavigation("/developers")}>Developer Resources</a></li>
                <li><a href="#" onClick={handleNavigation("/newsletter")}>Newsletter</a></li>
              </ul>
            </div>

            {/* Legal Section */}
            <div className={styles.footerColumn}>
              <h4 className={styles.columnTitle}>Legal</h4>
              <ul className={styles.linkList}>
                <li><a href="#" onClick={handleNavigation("/terms")}>Terms of Use</a></li>
                <li><a href="#" onClick={handleNavigation("/privacy")}>Privacy Policy</a></li>
                <li><a href="#" onClick={handleNavigation("/cookies")}>Cookie Policy</a></li>
                <li><a href="#" onClick={handleNavigation("/accessibility")}>Accessibility</a></li>
                <li><a href="#" onClick={handleNavigation("/guidelines")}>Community Guidelines</a></li>
              </ul>
            </div>

            {/* Company Section */}
            <div className={styles.footerColumn}>
              <h4 className={styles.columnTitle}>Company</h4>
              <ul className={styles.linkList}>
                <li><a href="#" onClick={handleNavigation("/about")}>About Us</a></li>
                <li><a href="#" onClick={handleNavigation("/contact")}>Contact</a></li>
                <li><a href="#" onClick={handleNavigation("/careers")}>Careers</a></li>
                <li><a href="#" onClick={handleNavigation("/social")}>Social Media</a></li>
                <li><a href="#" onClick={handleNavigation("/")}>Home</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div className={styles.footerBottom}>
          <div className={styles.footerBottomContent}>
            <div className={styles.footerBottomLeft}>
              <img src="/favicon.jpg" alt="InClass" className={styles.bottomLogo} />
              <span className={styles.copyright}>© 2025</span>
            </div>
            <div className={styles.footerBottomLinks}>
              <a href="#" onClick={handleNavigation("/about")}>About</a>
              <a href="#" onClick={handleNavigation("/accessibility")}>Accessibility</a>
              <a href="#" onClick={handleNavigation("/terms")}>User Agreement</a>
              <a href="#" onClick={handleNavigation("/privacy")}>Privacy Policy</a>
              <a href="#" onClick={handleNavigation("/cookies")}>Cookie Policy</a>
              <a href="#" onClick={handleNavigation("/guidelines")}>Community Guidelines</a>
            </div>
            <div className={styles.languageSelector}>
              <span>Language</span>
              <i className="bx bx-chevron-down"></i>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
