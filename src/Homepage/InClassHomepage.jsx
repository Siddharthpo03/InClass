import logo from "../assets/Logo1.jpg";
import fav from "../assets/favicon.jpg";

import React, { useState } from "react";
// Assuming you are using React Router v6 for navigation
import { useNavigate } from "react-router-dom";

// Assuming 'homepage.css' styles are imported or managed via a styling solution.

const InClassHomepage = () => {
  // State to manage the visibility of the mobile menu
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // --- UI Handlers ---

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // --- Navigation Handlers ---

  const handleLoginClick = (e) => {
    e.preventDefault();
    navigate("/login");
    setIsMenuOpen(false); // Close menu after navigation
  };

  const handleRegisterClick = (e) => {
    e.preventDefault();
    navigate("/register");
    setIsMenuOpen(false); // Close menu after navigation
  };

  const handleAuthButton = (e) => {
    e.preventDefault();
    // The main CTA button typically navigates to the primary auth page (Login)
    navigate("/login");
  };

  // --- Component JSX ---

  return (
    <div className="inclass-homepage-wrapper">
      <header>
        <nav className="nav-bar">
          {/* Left Section: Logo */}
          <div className="left-section">
            <div className="logo-section">
              <img src={fav} alt="InClass" className="logo-icon" />
              <span className="brand-name">InClass</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="menu-content">
            <ul className="nav-links">
              <li>
                <a href="#">Home</a>
              </li>
              <li>
                <a href="#">Features</a>
              </li>
              <li>
                <a href="#">About</a>
              </li>
              <li>
                <a href="#">Contact</a>
              </li>
            </ul>
            <div className="auth-buttons">
              <a href="#" className="nav-btn" onClick={handleLoginClick}>
                Login
              </a>
              <a
                href="#"
                className="nav-btn signup"
                onClick={handleRegisterClick}
              >
                Register
              </a>
              <button className="dark-mode-toggle">
                <i className="fa fa-moon" />
              </button>
            </div>
          </div>

          {/* Hamburger Menu Icon - Toggle Handler Attached */}
          <div
            className={`menu-icon ${isMenuOpen ? "open" : ""}`}
            id="menuIcon"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
            aria-controls="mobileMenu"
          >
            <span />
            <span />
            <span />
          </div>
        </nav>

        {/* Mobile Menu - Controlled by isMenuOpen state */}
        <div
          className={`mobile-menu ${isMenuOpen ? "open" : ""}`}
          id="mobileMenu"
        >
          <ul className="nav-links">
            <li>
              <a href="#">
                <i className="fas fa-home" /> Home
              </a>
            </li>
            <li>
              <a href="#">
                <i className="fa-solid fa-sitemap" /> Features
              </a>
            </li>
            <li>
              <a href="#">
                <i className="fa-solid fa-address-card" /> About
              </a>
            </li>
            <li>
              <a href="#">
                <i className="fa-solid fa-comments" /> Contact
              </a>
            </li>
          </ul>
          <div className="social_media">
            <p>
              <i className="fa-brands fa-youtube" />
              Youtube
            </p>
            <p>
              <i className="fa-brands fa-facebook-f" />
              Facebok
            </p>
            <p>
              <i className="fa-brands fa-x" />
              Twitter
            </p>
            <p>
              <i className="fa-brands fa-instagram" />
              Instagram
            </p>
          </div>
        </div>
      </header>

      {/* Main Hero Content */}
      <div className="container">
        <img src={logo} alt="InClass" className="logo" />
        <h1>
          Welcome to <br />
          InClass
        </h1>
        <p className="description">
          Smart, secure, and supervised attendance <br />
          system using time-restricted session codes. <br />
          No proxy, just presence.
        </p>
        <a href="#" className="login-btn" onClick={handleAuthButton}>
          Login / Register
        </a>
      </div>

      {/* Footer */}
      <footer>
        <div className="row_2">
          <div className="footer-links">
            <a href="#">Terms of Use</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Careers</a>
            <a href="#">Cookie Declaration</a>
          </div>
          <div className="copyright">
            <p>&copy; 2025 InClass | Made for Smart Campus</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default InClassHomepage;
