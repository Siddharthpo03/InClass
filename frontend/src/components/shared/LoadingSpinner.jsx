import React from "react";
import styles from "./LoadingSpinner.module.css";

/**
 * LoadingSpinner - Reusable loading indicator component
 * @param {Object} props
 * @param {string} [props.size='medium'] - Size: 'small', 'medium', 'large'
 * @param {string} [props.message] - Optional loading message
 * @param {boolean} [props.fullScreen=false] - Whether to render as full-screen overlay
 */
const LoadingSpinner = ({ size = "medium", message, fullScreen = false }) => {
  const containerClass = fullScreen
    ? styles.fullScreenContainer
    : styles.container;

  return (
    <div className={containerClass} role="status" aria-live="polite">
      <div className={`${styles.spinner} ${styles[size]}`} aria-hidden="true">
        <div className={styles.spinnerRing}></div>
        <div className={styles.spinnerRing}></div>
        <div className={styles.spinnerRing}></div>
      </div>
      {message && <p className={styles.message}>{message}</p>}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default React.memo(LoadingSpinner);



