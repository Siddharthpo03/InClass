import React, { useState, useCallback, useMemo } from "react";
import useAdminSocket from "../../hooks/useAdminSocket";
import styles from "./RealTimeFeed.module.css";

const RealTimeFeed = ({ adminId }) => {
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({
    type: "",
    college_id: "",
    department_id: "",
    timeRange: "1h",
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Event handlers
  const handleAssistCreated = useCallback((data) => {
    setEvents((prev) => [
      {
        id: Date.now(),
        type: "assist:created",
        timestamp: new Date(),
        data,
        label: `New assist request from ${data.studentName || data.student_name}`,
      },
      ...prev,
    ]);
  }, []);

  const handleAssistAssigned = useCallback((data) => {
    setEvents((prev) => [
      {
        id: Date.now(),
        type: "assist:assigned",
        timestamp: new Date(),
        data,
        label: `Assist assigned to faculty`,
      },
      ...prev,
    ]);
  }, []);

  const handleAssistCompleted = useCallback((data) => {
    setEvents((prev) => [
      {
        id: Date.now(),
        type: "assist:completed",
        timestamp: new Date(),
        data,
        label: `Assist completed`,
      },
      ...prev,
    ]);
  }, []);

  const handleAssistCancelled = useCallback((data) => {
    setEvents((prev) => [
      {
        id: Date.now(),
        type: "assist:cancelled",
        timestamp: new Date(),
        data,
        label: `Assist cancelled`,
      },
      ...prev,
    ]);
  }, []);

  const handleSessionStarted = useCallback((data) => {
    setEvents((prev) => [
      {
        id: Date.now(),
        type: "session:started",
        timestamp: new Date(),
        data,
        label: `Attendance session started: ${data.courseName || "course"}`,
      },
      ...prev,
    ]);
  }, []);

  const handleAttendanceMarked = useCallback((data) => {
    setEvents((prev) => [
      {
        id: Date.now(),
        type: "attendance:marked",
        timestamp: new Date(),
        data,
        label: `Attendance marked for ${data.studentName || "student"}`,
      },
      ...prev,
    ]);
  }, []);

  const handleRegistrationCreated = useCallback((data) => {
    setEvents((prev) => [
      {
        id: Date.now(),
        type: "registration:created",
        timestamp: new Date(),
        data,
        label: `New course registration request from ${data.studentName || data.student_name}`,
      },
      ...prev,
    ]);
  }, []);

  // Initialize socket
  useAdminSocket({
    adminId,
    onAssistCreated: handleAssistCreated,
    onAssistAssigned: handleAssistAssigned,
    onAssistCompleted: handleAssistCompleted,
    onAssistCancelled: handleAssistCancelled,
    onSessionStarted: handleSessionStarted,
    onAttendanceMarked: handleAttendanceMarked,
    onRegistrationCreated: handleRegistrationCreated,
    enabled: !!adminId,
  });

  // Filter events
  const filteredEvents = useMemo(() => {
    let result = events;

    // Filter by type
    if (filters.type) {
      result = result.filter((e) => e.type === filters.type);
    }

    // Filter by time range
    const now = Date.now();
    const timeRanges = {
      "15m": 15 * 60 * 1000,
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
    };
    const timeRange = timeRanges[filters.timeRange] || timeRanges["1h"];
    result = result.filter((e) => now - e.timestamp.getTime() < timeRange);

    return result;
  }, [events, filters.type, filters.timeRange]);

  const getEventIcon = (type) => {
    if (type.includes("assist")) return "bx-face";
    if (type.includes("session")) return "bx-calendar-check";
    if (type.includes("attendance")) return "bx-check-circle";
    if (type.includes("registration")) return "bx-user-plus";
    return "bx-bell";
  };

  const getEventColor = (type) => {
    if (type.includes("assist:created")) return "#3b82f6";
    if (type.includes("assist:assigned")) return "#f59e0b";
    if (type.includes("assist:completed")) return "#10b981";
    if (type.includes("assist:cancelled")) return "#ef4444";
    if (type.includes("session")) return "#8b5cf6";
    if (type.includes("attendance")) return "#06b6d4";
    if (type.includes("registration")) return "#ec4899";
    return "#6b7280";
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  const clearEvents = () => {
    setEvents([]);
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Real-Time Event Monitor</h2>
        <div className={styles.headerActions}>
          <span className={styles.eventCount}>
            {filteredEvents.length} events
          </span>
          <button
            className={styles.clearBtn}
            onClick={clearEvents}
            type="button"
          >
            <i className="bx bx-trash"></i>
            Clear
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <select
          className={styles.filterSelect}
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="">All Event Types</option>
          <option value="assist:created">Assist Created</option>
          <option value="assist:assigned">Assist Assigned</option>
          <option value="assist:completed">Assist Completed</option>
          <option value="assist:cancelled">Assist Cancelled</option>
          <option value="session:started">Session Started</option>
          <option value="attendance:marked">Attendance Marked</option>
          <option value="registration:created">Registration Created</option>
        </select>
        <select
          className={styles.filterSelect}
          value={filters.timeRange}
          onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
        >
          <option value="15m">Last 15 minutes</option>
          <option value="1h">Last hour</option>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
        </select>
      </div>

      {/* Event Feed */}
      <div className={styles.feedContainer}>
        {filteredEvents.length === 0 ? (
          <div className={styles.empty}>
            <i className="bx bx-bell-off"></i>
            <p>No events in the selected time range</p>
          </div>
        ) : (
          <div className={styles.eventsList}>
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className={styles.eventItem}
                onClick={() => handleEventClick(event)}
              >
                <div
                  className={styles.eventIcon}
                  style={{ background: getEventColor(event.type) }}
                >
                  <i className={`bx ${getEventIcon(event.type)}`}></i>
                </div>
                <div className={styles.eventContent}>
                  <div className={styles.eventLabel}>{event.label}</div>
                  <div className={styles.eventTime}>
                    {event.timestamp.toLocaleTimeString()}
                  </div>
                </div>
                <i className="bx bx-chevron-right"></i>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {showDetailsModal && selectedEvent && (
        <div
          className={styles.modalOverlay}
          onClick={() => {
            setShowDetailsModal(false);
            setSelectedEvent(null);
          }}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>Event Details</h3>
              <button
                className={styles.modalClose}
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedEvent(null);
                }}
                type="button"
              >
                <i className="bx bx-x"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailRow}>
                <strong>Type:</strong> {selectedEvent.type}
              </div>
              <div className={styles.detailRow}>
                <strong>Time:</strong> {selectedEvent.timestamp.toLocaleString()}
              </div>
              <div className={styles.detailRow}>
                <strong>Data:</strong>
                <pre className={styles.dataPreview}>
                  {JSON.stringify(selectedEvent.data, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeFeed;









