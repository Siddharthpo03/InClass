import React from "react";
import styles from "./InClassLogo.module.css";

/**
 * InClass Logo Component
 * A clean, lightweight SVG logo that works in both dark and light themes
 */
const InClassLogo = ({ size = 80, className = "" }) => {
  return (
    <div className={`${styles.logoContainer} ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={styles.logoSvg}
      >
        <defs>
          {/* Gradient for background circle */}
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>

        {/* Background Circle */}
        <circle
          cx="60"
          cy="60"
          r="55"
          fill="url(#logoGradient)"
          className={styles.logoCircle}
        />

        {/* Book/Notebook Icon */}
        <g transform="translate(30, 25)">
          {/* Book Cover */}
          <rect
            x="10"
            y="15"
            width="50"
            height="60"
            rx="3"
            fill="#ffffff"
            className={styles.bookCover}
          />

          {/* Book Pages */}
          <rect
            x="15"
            y="20"
            width="40"
            height="50"
            rx="2"
            fill="#f9fafb"
            className={styles.bookPages}
          />

          {/* Simple lines representing text */}
          <line
            x1="20"
            y1="30"
            x2="50"
            y2="30"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="20"
            y1="40"
            x2="45"
            y2="40"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="20"
            y1="50"
            x2="50"
            y2="50"
            stroke="#10b981"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Checkmark (attendance) */}
          <path
            d="M 25 65 L 32 72 L 45 58"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
};

export default InClassLogo;

