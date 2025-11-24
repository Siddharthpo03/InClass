import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Logo1.jpg";
import fav from "../assets/favicon.jpg";
import styles from "./Homepage.module.css";

const Homepage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const classNames = (...classes) =>
    classes
      .flat()
      .filter(Boolean)
      .map((cls) => styles[cls] || cls)
      .join(" ")
      .trim();

  const handleNavigation = (path) => (e) => {
    e.preventDefault();
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <div className={classNames("wrapper")}>
      <header>
        <nav className={classNames("navBar")}>
          <div className={classNames("leftSection")}>
            <div className={classNames("logoSection")}>
              <img src={fav} alt="InClass" className={classNames("logoIcon")} />
              <span className={classNames("brandName")}>InClass</span>
            </div>
          </div>

          <div className={classNames("menuContent")}>
            <ul className={classNames("navLinks")}>
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

            <div className={classNames("authButtons")}>
              <a
                href="#"
                className={classNames("navBtn")}
                onClick={handleNavigation("/login")}
              >
                Login
              </a>
              <a
                href="#"
                className={classNames("navBtn", "signup")}
                onClick={handleNavigation("/register")}
              >
                Register
              </a>
              <button className={classNames("darkModeToggle")}>
                <i className="fa fa-moon" />
              </button>
            </div>
          </div>

          {/* Hamburger Menu Icon (Mobile) */}
          <div
            className={classNames("menuIcon", isMenuOpen && "open")}
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
          className={classNames("mobileMenu", isMenuOpen && "show")}
          id="mobileMenu"
        >
          <ul className={classNames("navLinks")}>
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

          <div className={classNames("socialMedia")}>
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

      <div className={classNames("container")}>
        <img src={logo} alt="InClass" className={classNames("logo")} />
        <h1>
          Welcome to <br /> InClass
        </h1>
        <p className={classNames("description")}>
          Smart, secure, and supervised attendance <br />
          system using time-restricted session codes. <br />
          No proxy, just presence.
        </p>
        <a
          href="#"
          className={classNames("loginBtn")}
          onClick={handleNavigation("/login")}
        >
          Login / Register
        </a>
      </div>

      <footer>
        <div className={classNames("row2")}>
          <div className={classNames("footerLinks")}>
            <a href="#">Terms of Use</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Careers</a>
            <a href="#">Cookie Declaration</a>
          </div>
          <div className={classNames("copyright")}>
            <p>&copy; 2025 InClass | Made for Smart Campus</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;

