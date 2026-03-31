import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import styles from "./Footer.module.css";

const Footer = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const languageRef = useRef(null);
  const { t, currentLanguage, languages, setLocale } = useLanguage();

  useEffect(() => {
    if (!languageOpen || !languageRef.current) return;
    const btn = languageRef.current.querySelector("button");
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openDown = spaceBelow >= 280 || spaceBelow >= spaceAbove;
    if (openDown) {
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left: rect.left,
        right: "auto",
        bottom: "auto",
        maxHeight: `${Math.min(320, spaceBelow - 16)}px`,
      });
    } else {
      setDropdownStyle({
        position: "fixed",
        bottom: `${window.innerHeight - rect.top + 8}px`,
        left: rect.left,
        right: "auto",
        top: "auto",
        maxHeight: `${Math.min(320, spaceAbove - 16)}px`,
      });
    }
  }, [languageOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (languageRef.current && !languageRef.current.contains(e.target)) {
        const list = document.getElementById("footer-language-dropdown");
        if (list && list.contains(e.target)) return;
        setLanguageOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("inclass_token");
      setIsLoggedIn(!!token);
    };
    checkAuth();
    window.addEventListener("storage", checkAuth);
    const interval = setInterval(checkAuth, 1000);
    return () => {
      window.removeEventListener("storage", checkAuth);
      clearInterval(interval);
    };
  }, []);

  const handleNavigation = (path) => (e) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* Main Footer Content - only when not logged in */}
        {!isLoggedIn && (
        <div className={styles.footerMain}>
          {/* Logo Section */}
          <div className={styles.footerLogo}>
            <div className={styles.logoContainer}>
              <img
                src="/favicon.png"
                alt="InClass Logo"
                className={styles.logoImage}
              />
              <span className={styles.logoText}>InClass</span>
            </div>
          </div>

          {/* Footer Links Grid */}
          <div className={styles.footerLinksGrid}>
            {/* For Students Section */}
            <div className={styles.footerColumn}>
              <h4 className={styles.columnTitle}>For Students</h4>
              <ul className={styles.linkList}>
                <li>
                  <a href="#" onClick={handleNavigation("/student/dashboard")}>
                    Student Dashboard
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/help")}>
                    How to Mark Attendance
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/docs")}>
                    Student Guide
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/support")}>
                    Get Help
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/features")}>
                    Features
                  </a>
                </li>
              </ul>
            </div>

            {/* For Faculty Section */}
            <div className={styles.footerColumn}>
              <h4 className={styles.columnTitle}>For Faculty</h4>
              <ul className={styles.linkList}>
                <li>
                  <a href="#" onClick={handleNavigation("/faculty/dashboard")}>
                    Faculty Dashboard
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/docs")}>
                    Faculty Guide
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/help")}>
                    How to Take Attendance
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/support")}>
                    Support
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/features")}>
                    System Features
                  </a>
                </li>
              </ul>
            </div>

            {/* For Administrators Section */}
            <div className={styles.footerColumn}>
              <h4 className={styles.columnTitle}>For Administrators</h4>
              <ul className={styles.linkList}>
                <li>
                  <a href="#" onClick={handleNavigation("/admin/dashboard")}>
                    Admin Dashboard
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/docs")}>
                    Admin Guide
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/developers")}>
                    API Documentation
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/support")}>
                    Technical Support
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/report")}>
                    Report Issue
                  </a>
                </li>
              </ul>
            </div>

            {/* Resources Section */}
            <div className={styles.footerColumn}>
              <h4 className={styles.columnTitle}>Resources</h4>
              <ul className={styles.linkList}>
                <li>
                  <a href="#" onClick={handleNavigation("/help")}>
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/docs")}>
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/blog")}>
                    Blog & Updates
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/developers")}>
                    Developer Resources
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/newsletter")}>
                    Newsletter
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Section */}
            <div className={styles.footerColumn}>
              <h4 className={styles.columnTitle}>Legal</h4>
              <ul className={styles.linkList}>
                <li>
                  <a href="#" onClick={handleNavigation("/terms")}>
                    Terms of Use
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/privacy")}>
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/cookies")}>
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/accessibility")}>
                    Accessibility
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/guidelines")}>
                    Community Guidelines
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Section */}
            <div className={styles.footerColumn}>
              <h4 className={styles.columnTitle}>Company</h4>
              <ul className={styles.linkList}>
                <li>
                  <a href="#" onClick={handleNavigation("/about")}>
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/contact")}>
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/careers")}>
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/social")}>
                    Social Media
                  </a>
                </li>
                <li>
                  <a href="#" onClick={handleNavigation("/")}>
                    Home
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
        )}

        {/* Bottom Footer Bar - always shown */}
        <div className={styles.footerBottom}>
          <div className={styles.footerBottomContent}>
            <div className={styles.footerBottomLeft}>
              <img
                src="/favicon.png"
                alt="InClass"
                className={styles.bottomLogo}
              />
              <span className={styles.copyright}>© 2025</span>
            </div>
            <div className={styles.footerBottomLinks}>
              <a href="#" onClick={handleNavigation("/about")}>
                {t("about")}
              </a>
              <a href="#" onClick={handleNavigation("/accessibility")}>
                {t("accessibility")}
              </a>
              <a href="#" onClick={handleNavigation("/terms")}>
                {t("userAgreement")}
              </a>
              <a href="#" onClick={handleNavigation("/privacy")}>
                {t("privacyPolicy")}
              </a>
              <a href="#" onClick={handleNavigation("/cookies")}>
                {t("cookiePolicy")}
              </a>
              <a href="#" onClick={handleNavigation("/guidelines")}>
                {t("communityGuidelines")}
              </a>
            </div>
            <div
              className={styles.languageWrapper}
              ref={languageRef}
            >
              <button
                type="button"
                className={styles.languageSelector}
                onClick={() => setLanguageOpen((o) => !o)}
                aria-expanded={languageOpen}
                aria-haspopup="listbox"
                aria-label={t("language")}
              >
                <span>{currentLanguage.nameNative}</span>
                <i className={`bx bx-chevron-down ${languageOpen ? styles.chevronOpen : ""}`}></i>
              </button>
              {languageOpen &&
                createPortal(
                  <ul
                    id="footer-language-dropdown"
                    className={styles.languageDropdownList}
                    role="listbox"
                    aria-label={t("language")}
                    style={dropdownStyle}
                  >
                    {languages.map((lang) => (
                      <li key={lang.code}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={currentLanguage.code === lang.code}
                          className={`${styles.languageOption} ${currentLanguage.code === lang.code ? styles.languageOptionActive : ""}`}
                          onClick={() => {
                            setLocale(lang.code);
                            setLanguageOpen(false);
                          }}
                        >
                          <span className={styles.languageNameNative}>{lang.nameNative}</span>
                          <span className={styles.languageName}>{lang.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>,
                  document.body
                )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
