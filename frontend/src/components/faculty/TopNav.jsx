import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./TopNav.module.css";

/**
 * TopNav - Faculty dashboard top navigation bar
 * @param {Object} props
 * @param {Object} props.profile - Faculty profile object
 * @param {Function} props.onLogout - Logout handler
 */
const TopNav = ({ profile, onLogout }) => {
  const navigate = useNavigate();

  return (
    <nav
      className={styles.topNav}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className={styles.navContent}>
        <div className={styles.logoSection}>
          <button
            className={styles.logoButton}
            onClick={() => navigate("/faculty/dashboard")}
            aria-label="Go to dashboard"
          >
            <img 
              src="/favicon.png" 
              alt="InClass Logo" 
              className={styles.logoImage}
            />
            <span className={styles.logoText}>InClass</span>
          </button>
        </div>

        <div className={styles.navActions}>
          {profile && (
            <div className={styles.profileSection}>
              <div className={styles.profileInfo}>
                <span className={styles.profileName}>{profile.name}</span>
                <span className={styles.profileRole}>{profile.role}</span>
              </div>
            </div>
          )}
          <button
            className={styles.logoutButton}
            onClick={onLogout}
            aria-label="Logout"
            type="button"
          >
            <i className="bx bx-log-out" aria-hidden="true"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default React.memo(TopNav);

