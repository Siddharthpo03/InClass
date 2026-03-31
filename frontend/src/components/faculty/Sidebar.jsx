import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "./Sidebar.module.css";

/**
 * Sidebar - Faculty dashboard sidebar navigation
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether sidebar is open (mobile)
 * @param {Function} props.onClose - Close handler (mobile)
 */
const Sidebar = ({ isOpen = true, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: "/faculty/dashboard", icon: "bx-home", label: "Dashboard" },
    { path: "/faculty/courses", icon: "bx-book", label: "Courses" },
    { path: "/faculty/sessions", icon: "bx-calendar-check", label: "Sessions" },
    { path: "/faculty/profile", icon: "bx-user", label: "Profile" },
  ];

  const handleNavClick = (path) => {
    navigate(path);
    onClose?.(); // Close mobile sidebar on navigation
  };

  const isActive = (path) => {
    if (path === "/faculty/dashboard") {
      return location.pathname === path;
    }
    // For nested routes, check if pathname starts with the route
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className={styles.overlay} onClick={onClose} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${isOpen ? styles.open : ""}`}
        role="navigation"
        aria-label="Faculty navigation"
      >
        <div className={styles.sidebarHeader}>
          <img 
            src="/favicon.png" 
            alt="InClass Logo" 
            className={styles.sidebarLogo}
          />
          <span className={styles.sidebarTitle}>InClass</span>
        </div>
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {navItems.map((item) => (
              <li key={item.path}>
                <button
                  className={`${styles.navItem} ${
                    isActive(item.path) ? styles.active : ""
                  }`}
                  onClick={() => handleNavClick(item.path)}
                  aria-current={isActive(item.path) ? "page" : undefined}
                  type="button"
                >
                  <i className={`bx ${item.icon}`} aria-hidden="true"></i>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default React.memo(Sidebar);

