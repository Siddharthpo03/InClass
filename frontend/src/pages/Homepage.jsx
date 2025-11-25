import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import logo from "../assets/Logo1.jpg";
import darkLogo from "../assets/darK_logo.png";
import styles from "./Homepage.module.css";

const Homepage = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
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

  // Listen for dark mode changes from Navigation component
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.body.classList.contains("darkMode"));
    };
    
    // Check on mount and periodically
    checkDarkMode();
    const interval = setInterval(checkDarkMode, 100);
    
    return () => clearInterval(interval);
  }, []);

  const handleNavigation = (path) => (e) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <div className={styles.wrapper}>
      <Navigation />
      
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

      <Footer />
    </div>
  );
};

export default Homepage;
