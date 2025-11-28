import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import fav from "../assets/favicon.jpg";
import styles from "./Navigation.module.css";

// Helper function for classNames
const classNames = (...classes) => {
  return classes
    .filter(Boolean)
    .map((cls) => {
      if (typeof cls === "string") {
        return cls.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      }
      return cls;
    })
    .map((cls) => styles[cls] || cls)
    .join(" ");
};

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication status
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("inclass_token");
      const role = localStorage.getItem("user_role");
      
      if (token && role) {
        setIsLoggedIn(true);
        setUserRole(role);
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
      }
    };

    // Check on mount
    checkAuth();

    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener("storage", checkAuth);

    // Check periodically to catch login/logout in same tab
    const interval = setInterval(checkAuth, 1000);

    return () => {
      window.removeEventListener("storage", checkAuth);
      clearInterval(interval);
    };
  }, []);

  // Dark mode initialization and persistence
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    const shouldBeDark = savedDarkMode !== null 
      ? savedDarkMode === "true" 
      : prefersDark;
    
    setIsDarkMode(shouldBeDark);
    updateDarkMode(shouldBeDark);
  }, []);

  // Update dark mode class on body
  const updateDarkMode = (dark) => {
    if (dark) {
      document.body.classList.add("darkMode");
    } else {
      document.body.classList.remove("darkMode");
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem("darkMode", newDarkMode.toString());
    updateDarkMode(newDarkMode);
  };

  const handleNavigation = (path) => (e) => {
    e.preventDefault();
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <header>
      <nav className={styles.navBar}>
        <div className={styles.leftSection}>
          <div className={styles.logoSection} onClick={handleNavigation("/")}>
            <img 
              src={fav} 
              alt="InClass" 
              className={styles.logoIcon} 
            />
            <span className={styles.brandName}>InClass</span>
          </div>
        </div>

        <div className={styles.menuContent}>
          <ul className={styles.navLinks}>
            <li>
              <a 
                href="#" 
                onClick={handleNavigation("/")}
                className={location.pathname === "/" ? styles.active : ""}
              >
                Home
              </a>
            </li>
            <li>
              <a 
                href="#" 
                onClick={handleNavigation("/features")}
                className={location.pathname === "/features" ? styles.active : ""}
              >
                Features
              </a>
            </li>
            <li>
              <a 
                href="#" 
                onClick={handleNavigation("/about")}
                className={location.pathname === "/about" ? styles.active : ""}
              >
                About
              </a>
            </li>
            <li>
              <a 
                href="#" 
                onClick={handleNavigation("/contact")}
                className={location.pathname === "/contact" ? styles.active : ""}
              >
                Contact
              </a>
            </li>
          </ul>

          <div className={styles.authButtons}>
            <a
              href="#"
              className={styles.reportBtn}
              onClick={handleNavigation("/report")}
              title="Report an Issue"
            >
              Report
            </a>
            {isLoggedIn && userRole ? (
              <a
                href="#"
                className={styles.navBtn}
                onClick={handleNavigation(`/${userRole}/dashboard`)}
              >
                Dashboard
              </a>
            ) : (
              <>
                <a
                  href="#"
                  className={styles.navBtn}
                  onClick={handleNavigation("/login")}
                  style={{ display: 'inline-block' }}
                >
                  Login
                </a>
                <a
                  href="#"
                  className={classNames(styles.navBtn, styles.navBtnSignup)}
                  onClick={handleNavigation("/register")}
                  style={{ display: 'inline-block' }}
                >
                  Register
                </a>
              </>
            )}
          </div>
        </div>

        {/* Dark Mode Toggle - Always visible in nav bar */}
        <button 
          className={styles.darkModeToggle}
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          <i className={isDarkMode ? "fas fa-sun" : "fas fa-moon"} />
        </button>

        {/* Hamburger Menu Icon (Mobile) */}
        <div
          className={classNames(styles.menuIcon, isMenuOpen && styles.open)}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-expanded={isMenuOpen}
          aria-controls="mobileMenu"
        >
          <span />
          <span />
          <span />
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className={styles.mobileMenuOverlay}
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Links */}
      <div
        className={classNames(styles.mobileMenu, isMenuOpen && styles.show)}
        id="mobileMenu"
      >
        <div className={styles.mobileMenuHeader}>
          <h3>Menu</h3>
          <button
            className={styles.closeButton}
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <ul className={styles.mobileNavLinks}>
          <li>
            <a 
              href="#" 
              onClick={handleNavigation("/")}
              className={location.pathname === "/" ? styles.active : ""}
            >
              <i className="fas fa-home" />
              <span>Home</span>
            </a>
          </li>
          <li>
            <a 
              href="#" 
              onClick={handleNavigation("/features")}
              className={location.pathname === "/features" ? styles.active : ""}
            >
              <i className="fas fa-sitemap" />
              <span>Features</span>
            </a>
          </li>
          <li>
            <a 
              href="#" 
              onClick={handleNavigation("/about")}
              className={location.pathname === "/about" ? styles.active : ""}
            >
              <i className="fas fa-address-card" />
              <span>About</span>
            </a>
          </li>
          <li>
            <a 
              href="#" 
              onClick={handleNavigation("/contact")}
              className={location.pathname === "/contact" ? styles.active : ""}
            >
              <i className="fas fa-comments" />
              <span>Contact</span>
            </a>
          </li>
        </ul>

        <div className={styles.mobileAuthSection}>
          <a
            href="#"
            className={styles.mobileReportBtn}
            onClick={handleNavigation("/report")}
          >
            <i className="fas fa-flag" />
            <span>Report</span>
          </a>
          {isLoggedIn && userRole ? (
            <a
              href="#"
              className={styles.mobileNavBtn}
              onClick={handleNavigation(`/${userRole}/dashboard`)}
            >
              <i className="fas fa-tachometer-alt" />
              <span>Dashboard</span>
            </a>
          ) : (
            <>
              <a
                href="#"
                className={styles.mobileNavBtn}
                onClick={handleNavigation("/login")}
              >
                <i className="fas fa-sign-in-alt" />
                <span>Login</span>
              </a>
              <a
                href="#"
                className={styles.mobileNavBtnSignup}
                onClick={handleNavigation("/register")}
              >
                <i className="fas fa-user-plus" />
                <span>Register</span>
              </a>
            </>
          )}
        </div>

        <div className={styles.mobileMenuFooter}>
          <div className={styles.mobileDarkModeSection}>
            <span>Theme</span>
            <button 
              className={styles.mobileDarkModeToggle}
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
            >
              <i className={isDarkMode ? "fas fa-sun" : "fas fa-moon"} />
              <span>{isDarkMode ? "Light Mode" : "Dark Mode"}</span>
            </button>
          </div>

          <div className={styles.socialMedia}>
            <a href="#" aria-label="YouTube">
              <i className="fab fa-youtube" />
            </a>
            <a href="#" aria-label="Facebook">
              <i className="fab fa-facebook-f" />
            </a>
            <a href="#" aria-label="Twitter">
              <i className="fab fa-x-twitter" />
            </a>
            <a href="#" aria-label="Instagram">
              <i className="fab fa-instagram" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navigation;

