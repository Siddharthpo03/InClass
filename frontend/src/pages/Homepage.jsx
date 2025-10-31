import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo1.jpg";
import fav from "../assets/favicon.jpg";
import "./Homepage.css";

const Homepage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavigation = (path) => (e) => {
    e.preventDefault();
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <div className="inclass-homepage-wrapper">
      <header>
        <nav className="nav-bar">
          <div className="left-section">
            <div className="logo-section">
              <img src={fav} alt="InClass" className="logo-icon" />
              <span className="brand-name">InClass</span>
            </div>
          </div>

          <div className="menu-content">
            <ul className="nav-links">
              <li>
                <a href="#" onClick={handleNavigation("/")}>
                  Home
                </a>
              </li>
              <li>
                <a href="#">Features</a>
              </li>
              <li>
                <a href="#" onClick={handleNavigation("/about")}>
                  About
                </a>
              </li>
              <li>
                <a href="#">Contact</a>
              </li>
            </ul>

            <div className="auth-buttons">
              <a
                href="#"
                className="nav-btn"
                onClick={handleNavigation("/login")}
              >
                Login
              </a>
              <a
                href="#"
                className="nav-btn signup"
                onClick={handleNavigation("/register")}
              >
                Register
              </a>
              <button className="dark-mode-toggle">
                <i className="fa fa-moon" />
              </button>
            </div>
          </div>

          {/* Hamburger Menu Icon (Mobile) */}
          <div
            className={`menu-icon ${isMenuOpen ? "open" : ""}`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-controls="mobileMenu"
          >
            <span />
            <span />
            <span />
          </div>
        </nav>

        {/* Mobile Menu Links */}
        <div
          className={`mobile-menu ${isMenuOpen ? "show" : ""}`}
          id="mobileMenu"
        >
          <ul className="nav-links">
            <li>
              <a href="#" onClick={handleNavigation("/")}>
                <i className="fas fa-home" /> Home
              </a>
            </li>
            <li>
              <a href="#">
                <i className="fa-solid fa-sitemap" /> Features
              </a>
            </li>
            <li>
              <a href="#" onClick={handleNavigation("/about")}>
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
              <i className="fa-brands fa-youtube" /> Youtube
            </p>
            <p>
              <i className="fa-brands fa-facebook-f" /> Facebook
            </p>
            <p>
              <i className="fa-brands fa-x" /> Twitter
            </p>
            <p>
              <i className="fa-brands fa-instagram" /> Instagram
            </p>
          </div>
        </div>
      </header>

      <div className="container">
        <img src={logo} alt="InClass" className="logo" />
        <h1>
          Welcome to <br /> InClass
        </h1>
        <p className="description">
          Smart, secure, and supervised attendance <br />
          system using time-restricted session codes. <br />
          No proxy, just presence.
        </p>
        <a href="#" className="login-btn" onClick={handleNavigation("/login")}>
          Login / Register
        </a>
      </div>

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

export default Homepage;

