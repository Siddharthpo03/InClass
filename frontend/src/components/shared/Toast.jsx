import React, { useEffect, useState, useCallback } from "react";
import styles from "./Toast.module.css";

/**
 * Toast - Notification component for success/error/info messages
 * @param {Object} props
 * @param {string} props.message - Toast message
 * @param {string} props.type - Type: 'success', 'error', 'info', 'warning'
 * @param {number} [props.duration=5000] - Auto-dismiss duration in ms (0 = no auto-dismiss)
 * @param {Function} props.onClose - Callback when toast is dismissed
 * @param {boolean} [props.show=true] - Whether to show the toast
 */
const Toast = ({
  message,
  type = "info",
  duration = 5000,
  onClose,
  show = true,
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300); // Match CSS transition duration
  }, [onClose]);

  useEffect(() => {
    setIsVisible(show);
    if (!show) {
      setIsExiting(true);
    }
  }, [show]);

  useEffect(() => {
    if (duration > 0 && isVisible && !isExiting) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, isVisible, isExiting, handleClose]);

  if (!isVisible && !isExiting) return null;

  const icons = {
    success: "bx-check-circle",
    error: "bx-error-circle",
    warning: "bx-error",
    info: "bx-info-circle",
  };

  return (
    <div
      className={`${styles.toast} ${styles[type]} ${
        isExiting ? styles.exiting : ""
      }`}
      role="alert"
      aria-live={type === "error" ? "assertive" : "polite"}
    >
      <div className={styles.toastContent}>
        <i className={`bx ${icons[type] || icons.info}`} aria-hidden="true"></i>
        <span className={styles.message}>{message}</span>
      </div>
      <button
        className={styles.closeButton}
        onClick={handleClose}
        aria-label="Close notification"
        type="button"
      >
        <i className="bx bx-x" aria-hidden="true"></i>
      </button>
    </div>
  );
};

export default React.memo(Toast);



