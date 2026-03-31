import React from "react";
import Toast from "./Toast";
import styles from "./ToastContainer.module.css";

/**
 * ToastContainer - Manages multiple toast notifications
 * Usage: Add <ToastContainer /> to your app root, then use toast context/hook to show toasts
 */
const ToastContainer = ({ toasts = [], onRemove }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className={styles.container}
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          show={toast.show}
          onClose={() => onRemove?.(toast.id)}
        />
      ))}
    </div>
  );
};

export default React.memo(ToastContainer);



