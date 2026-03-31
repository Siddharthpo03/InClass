import React from "react";
import styles from "./StatCard.module.css";

/**
 * StatCard - Display statistic with icon and label
 * @param {Object} props
 * @param {string|number} props.value - Statistic value
 * @param {string} props.label - Statistic label
 * @param {string} [props.icon] - Boxicons icon class (e.g., 'bx-book')
 * @param {string} [props.variant='default'] - Variant: 'default', 'success', 'warning', 'error', 'info'
 * @param {Function} [props.onClick] - Optional click handler
 * @param {boolean} [props.loading=false] - Show loading state
 */
const StatCard = ({
  value,
  label,
  icon,
  variant = "default",
  onClick,
  loading = false,
}) => {
  const cardClass = onClick ? styles.clickable : "";
  const content = loading ? (
    <div className={styles.loadingPlaceholder}>...</div>
  ) : (
    value
  );

  return (
    <div
      className={`${styles.statCard} ${styles[variant]} ${cardClass}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      aria-label={onClick ? `${label}: ${value}` : undefined}
    >
      {icon && (
        <div className={styles.iconContainer}>
          <i className={`bx ${icon}`} aria-hidden="true"></i>
        </div>
      )}
      <div className={styles.content}>
        <div className={styles.value}>{content}</div>
        <div className={styles.label}>{label}</div>
      </div>
    </div>
  );
};

export default React.memo(StatCard);



