import React from "react";
import styles from "./SkeletonLoader.module.css";

/**
 * SkeletonLoader - Loading placeholder component
 * @param {Object} props
 * @param {string} [props.variant='text'] - Variant: 'text', 'circular', 'rectangular', 'card'
 * @param {number} [props.width] - Width (for rectangular/circular)
 * @param {number} [props.height] - Height (for rectangular/circular)
 * @param {number} [props.lines] - Number of lines (for text variant)
 * @param {string} [props.className] - Additional CSS classes
 */
const SkeletonLoader = ({
  variant = "text",
  width,
  height,
  lines = 1,
  className = "",
}) => {
  if (variant === "text") {
    return (
      <div className={`${styles.skeletonContainer} ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${styles.skeleton} ${styles.text}`}
            style={{
              width: index === lines - 1 && lines > 1 ? "80%" : "100%",
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === "circular") {
    return (
      <div
        className={`${styles.skeleton} ${styles.circular} ${className}`}
        style={{ width, height }}
      />
    );
  }

  if (variant === "rectangular") {
    return (
      <div
        className={`${styles.skeleton} ${styles.rectangular} ${className}`}
        style={{ width, height }}
      />
    );
  }

  if (variant === "card") {
    return (
      <div className={`${styles.cardSkeleton} ${className}`}>
        <div className={`${styles.skeleton} ${styles.rectangular} ${styles.cardHeader}`} />
        <div className={styles.cardBody}>
          <div className={`${styles.skeleton} ${styles.text}`} style={{ width: "100%", marginBottom: "0.5rem" }} />
          <div className={`${styles.skeleton} ${styles.text}`} style={{ width: "80%" }} />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.skeleton} ${styles.rectangular} ${className}`}
      style={{ width, height }}
    />
  );
};

export default React.memo(SkeletonLoader);


