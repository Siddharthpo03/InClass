import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import apiClient from "../utils/apiClient";
import logo from "../assets/Logo1.jpg";
import darkLogo from "../assets/darK_logo.png";
import styles from "./Homepage.module.css";

const Homepage = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Sync dark mode state
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    const shouldBeDark = savedDarkMode !== null 
      ? savedDarkMode === "true" 
      : prefersDark;
    
    setIsDarkMode(shouldBeDark);
  }, []);

  // Check if user is logged in and fetch profile
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("inclass_token");
      const role = localStorage.getItem("user_role");
      
      if (token && role) {
        setIsLoggedIn(true);
        setUserRole(role);
        
        try {
          const response = await apiClient.get("/auth/profile");
          setUserProfile(response.data);
        } catch (error) {
          console.error("Failed to fetch profile:", error);
          // If profile fetch fails, clear auth
          localStorage.removeItem("inclass_token");
          localStorage.removeItem("user_role");
          setIsLoggedIn(false);
          setUserRole(null);
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Listen for dark mode changes from Navigation component
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.body.classList.contains("darkMode"));
    };
    
    checkDarkMode();
    const interval = setInterval(checkDarkMode, 100);
    
    return () => clearInterval(interval);
  }, []);

  const handleNavigation = (path) => (e) => {
    e.preventDefault();
    navigate(path);
  };

  // Render Student Homepage
  const renderStudentHomepage = () => (
    <div className={styles.roleHomepage}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Welcome back, <span className={styles.highlight}>{userProfile?.name || "Student"}!</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Your attendance dashboard is ready. Mark your presence and track your progress.
          </p>
          <div className={styles.quickStats}>
            <div className={styles.statCard}>
              <i className="bx bx-calendar-check"></i>
              <div>
                <h3>Active Sessions</h3>
                <p>Check for available attendance codes</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <i className="bx bx-time"></i>
              <div>
                <h3>Quick Access</h3>
                <p>Mark attendance in seconds</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <i className="bx bx-bar-chart-alt-2"></i>
              <div>
                <h3>Track Progress</h3>
                <p>View your attendance history</p>
              </div>
            </div>
          </div>
          <button 
            className={styles.ctaButton}
            onClick={handleNavigation("/student/dashboard")}
          >
            <i className="bx bx-right-arrow-alt"></i>
            Go to Dashboard
          </button>
        </div>
        <div className={styles.heroIllustration}>
          <div className={styles.floatingCard}>
            <i className="bx bx-check-circle"></i>
            <span>Attendance Marked</span>
          </div>
          <div className={styles.floatingCard}>
            <i className="bx bx-book"></i>
            <span>Classes</span>
          </div>
          <div className={styles.floatingCard}>
            <i className="bx bx-trophy"></i>
            <span>Progress</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Faculty Homepage
  const renderFacultyHomepage = () => (
    <div className={styles.roleHomepage}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Welcome, <span className={styles.highlight}>{userProfile?.name || "Professor"}!</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Manage your courses, generate attendance sessions, and track student presence efficiently.
          </p>
          <div className={styles.quickStats}>
            <div className={styles.statCard}>
              <i className="bx bx-book-open"></i>
              <div>
                <h3>Course Management</h3>
                <p>Register and manage your courses</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <i className="bx bx-qr-scan"></i>
              <div>
                <h3>Session Codes</h3>
                <p>Generate time-restricted codes</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <i className="bx bx-group"></i>
              <div>
                <h3>Student Roster</h3>
                <p>View and manage attendance</p>
              </div>
            </div>
          </div>
          <button 
            className={styles.ctaButton}
            onClick={handleNavigation("/faculty/dashboard")}
          >
            <i className="bx bx-right-arrow-alt"></i>
            Go to Dashboard
          </button>
        </div>
        <div className={styles.heroIllustration}>
          <div className={styles.floatingCard}>
            <i className="bx bx-chalkboard"></i>
            <span>Teaching</span>
          </div>
          <div className={styles.floatingCard}>
            <i className="bx bx-user-check"></i>
            <span>Attendance</span>
          </div>
          <div className={styles.floatingCard}>
            <i className="bx bx-bar-chart"></i>
            <span>Analytics</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Admin Homepage
  const renderAdminHomepage = () => (
    <div className={styles.roleHomepage}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Welcome, <span className={styles.highlight}>{userProfile?.name || "Administrator"}!</span>
          </h1>
          <p className={styles.heroSubtitle}>
            System overview and management. Monitor all activities, manage users, and ensure system integrity.
          </p>
          <div className={styles.quickStats}>
            <div className={styles.statCard}>
              <i className="bx bx-shield"></i>
              <div>
                <h3>System Control</h3>
                <p>Manage users and permissions</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <i className="bx bx-line-chart"></i>
              <div>
                <h3>Analytics</h3>
                <p>View system-wide statistics</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <i className="bx bx-cog"></i>
              <div>
                <h3>Settings</h3>
                <p>Configure system parameters</p>
              </div>
            </div>
          </div>
          <button 
            className={styles.ctaButton}
            onClick={handleNavigation("/admin/dashboard")}
          >
            <i className="bx bx-right-arrow-alt"></i>
            Go to Dashboard
          </button>
        </div>
        <div className={styles.heroIllustration}>
          <div className={styles.floatingCard}>
            <i className="bx bx-server"></i>
            <span>System</span>
          </div>
          <div className={styles.floatingCard}>
            <i className="bx bx-network-chart"></i>
            <span>Network</span>
          </div>
          <div className={styles.floatingCard}>
            <i className="bx bx-data"></i>
            <span>Data</span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Default Homepage (Not Logged In)
  const renderDefaultHomepage = () => (
    <div className={styles.container}>
      <img 
        src={isDarkMode ? darkLogo : logo} 
        alt="InClass" 
        className={styles.logo} 
      />
      <h1>
        Welcome to <br /> InClass
      </h1>
      <p className={styles.description}>
        Smart, secure, and supervised attendance <br />
        system using time-restricted session codes. <br />
        No proxy, just presence.
      </p>
      <a 
        href="#" 
        className={styles.loginBtn} 
        onClick={handleNavigation("/login")}
      >
        Login / Register
      </a>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <Navigation />
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <Navigation />
      
      {isLoggedIn && userRole ? (
        userRole === "student" ? renderStudentHomepage() :
        userRole === "faculty" ? renderFacultyHomepage() :
        userRole === "admin" ? renderAdminHomepage() :
        renderDefaultHomepage()
      ) : (
        renderDefaultHomepage()
      )}

      <Footer />
    </div>
  );
};

export default Homepage;
