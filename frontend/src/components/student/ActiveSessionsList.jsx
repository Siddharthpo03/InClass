import React, { useState, useCallback, useMemo } from "react";
import { FixedSizeList as List } from "react-window";
import styles from "./ActiveSessionsList.module.css";

/**
 * ActiveSessionsList - Displays active attendance sessions for students
 * 
 * Shows sessions in real-time with professor name, course, and timer.
 * Clicking a session opens the attendance marking UI.
 */
const ActiveSessionsList = ({
  sessions = [],
  onSessionClick,
  currentTime = Date.now(),
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Sort sessions: active first, then by start time
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      // Active sessions first
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      // Then by start time (newest first)
      return new Date(b.startsAt || b.createdAt) - new Date(a.startsAt || a.createdAt);
    });
  }, [sessions]);

  const formatTimeRemaining = useCallback((expiresAt) => {
    if (!expiresAt) return "Unknown";
    
    const now = currentTime;
    const expires = new Date(expiresAt).getTime();
    const remaining = Math.max(0, expires - now);
    
    if (remaining === 0) return "Expired";
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [currentTime]);

  const SessionRow = ({ index, style, data }) => {
    const session = data[index];
    if (!session) return null;

    const isActive = session.isActive && new Date(session.expiresAt) > new Date();
    const timeRemaining = formatTimeRemaining(session.expiresAt);
    const isHovered = hoveredIndex === index;

    return (
      <div
        style={style}
        className={`${styles.sessionItem} ${isActive ? styles.active : styles.inactive} ${isHovered ? styles.hovered : ""}`}
        onClick={() => onSessionClick?.(session)}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
        role="button"
        tabIndex={0}
        aria-label={`Session for ${session.courseName} by ${session.facultyName}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSessionClick?.(session);
          }
        }}
      >
        <div className={styles.sessionContent}>
          <div className={styles.sessionHeader}>
            <h3 className={styles.courseName}>{session.courseName || "Unknown Course"}</h3>
            {isActive && (
              <span className={styles.activeBadge} aria-label="Active session">
                Active
              </span>
            )}
          </div>
          
          <div className={styles.sessionInfo}>
            <div className={styles.facultyInfo}>
              <i className="bx bx-user" aria-hidden="true"></i>
              <span>{session.facultyName || "Unknown Professor"}</span>
            </div>
            
            {isActive && (
              <div className={styles.timerInfo}>
                <i className="bx bx-time" aria-hidden="true"></i>
                <span className={styles.timeRemaining}>{timeRemaining}</span>
              </div>
            )}
          </div>

          {session.code && (
            <div className={styles.codeInfo}>
              <span className={styles.codeLabel}>Code:</span>
              <span className={styles.codeValue}>{session.code}</span>
            </div>
          )}
        </div>

        <div className={styles.sessionAction}>
          <i className="bx bx-right-arrow-alt" aria-hidden="true"></i>
        </div>
      </div>
    );
  };

  if (sortedSessions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <i className="bx bx-calendar-x" aria-hidden="true"></i>
        <p>No active sessions</p>
        <span className={styles.emptySubtext}>
          Sessions will appear here when professors start attendance.
        </span>
      </div>
    );
  }

  return (
    <div className={styles.sessionsList}>
      <div className={styles.listHeader}>
        <h2 className={styles.listTitle}>Active Sessions</h2>
        <span className={styles.sessionCount}>
          {sortedSessions.filter((s) => s.isActive && new Date(s.expiresAt) > new Date()).length} active
        </span>
      </div>

      <List
        height={Math.min(400, sortedSessions.length * 120)}
        itemCount={sortedSessions.length}
        itemSize={120}
        itemData={sortedSessions}
        width="100%"
        overscanCount={3}
      >
        {SessionRow}
      </List>
    </div>
  );
};

export default React.memo(ActiveSessionsList);


