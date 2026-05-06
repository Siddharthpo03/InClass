import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import useDarkMode from "../../hooks/useDarkMode";
import styles from "./InClassStudentModern.module.css";

const InClassStudentModern = ({ previewMode = false }) => {
  useDarkMode();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(!previewMode);
  const [attendanceStats, setAttendanceStats] = useState({
    percentage: 0,
    totalClasses: 0,
    present: 0,
    absent: 0,
  });
  const [activeSessions, setActiveSessions] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [filterDateRange, setFilterDateRange] = useState("all");
  const [sessionCode, setSessionCode] = useState("");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Fetch user profile
  useEffect(() => {
    if (previewMode) {
      setUserData({
        name: "Student Preview",
        email: "student@preview.com",
        role: "student",
      });
      setAttendanceStats({
        percentage: 85,
        totalClasses: 40,
        present: 34,
        absent: 6,
      });
      setActiveSessions([
        {
          id: 1,
          name: "Data Structures",
          faculty: "Dr. Smith",
          room: "A101",
          time: "10:00 AM",
        },
        {
          id: 2,
          name: "Algorithms",
          faculty: "Prof. Johnson",
          room: "B205",
          time: "2:00 PM",
        },
      ]);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/auth/profile");
        setUserData(response.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [previewMode, navigate]);

  // Fetch attendance stats
  useEffect(() => {
    if (!userData || previewMode) return;

    const fetchStats = async () => {
      try {
        const response = await apiClient.get("/student/attendance-stats");
        setAttendanceStats(response.data);
      } catch (err) {
        console.error("Failed to fetch attendance stats:", err);
      }
    };

    fetchStats();
  }, [userData, previewMode]);

  // Fetch active sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await apiClient.get("/student/active-sessions");
        setActiveSessions(response.data.sessions || []);
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
      }
    };

    const interval = setInterval(fetchSessions, 30000); // Poll every 30 seconds
    fetchSessions();
    return () => clearInterval(interval);
  }, []);

  // Fetch attendance history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const params =
          filterDateRange !== "all" ? { range: filterDateRange } : {};
        const response = await apiClient.get("/student/attendance-history", {
          params,
        });
        setAttendanceHistory(response.data.history || []);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      }
    };

    fetchHistory();
  }, [filterDateRange]);

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (!sessionCode.trim()) return;

    try {
      const response = await apiClient.post("/attendance/mark", {
        code: sessionCode.trim().toUpperCase(),
      });

      if (response.data?.success) {
        addToast("Attendance marked successfully!", "success");
        setSessionCode("");
        setIsSessionActive(false);
        // Refetch sessions and history
        const sessionsRes = await apiClient.get("/student/active-sessions");
        setActiveSessions(sessionsRes.data.sessions || []);
        const historyRes = await apiClient.get("/student/attendance-history");
        setAttendanceHistory(historyRes.data.history || []);
      }
    } catch (err) {
      const msg =
        err.response?.data?.error?.message || "Failed to mark attendance";
      addToast(msg, "error");
    }
  };

  const handleJoinSession = (session) => {
    setIsSessionActive(true);
  };

  const addToast = (message, type) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
      localStorage.removeItem("inclass_token");
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <Navigation />
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading your dashboard...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <Navigation />
      <div className={styles.container}>
        {/* Welcome Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div>
              <h1 className={styles.title}>
                Welcome, {userData?.name?.split(" ")[0]}!
              </h1>
              <p className={styles.subtitle}>Here's your attendance overview</p>
            </div>
            <button className={styles.logoutButton} onClick={handleLogout}>
              <i className="bx bx-log-out"></i>
              Sign Out
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div
              className={styles.statIcon}
              style={{ background: "rgba(14, 165, 233, 0.1)" }}
            >
              <i
                className="bx bx-pie-chart"
                style={{ color: "var(--primary-500)" }}
              ></i>
            </div>
            <div>
              <p className={styles.statLabel}>Attendance</p>
              <h3 className={styles.statValue}>
                {attendanceStats.percentage}%
              </h3>
            </div>
          </div>

          <div className={styles.statCard}>
            <div
              className={styles.statIcon}
              style={{ background: "rgba(34, 197, 94, 0.1)" }}
            >
              <i
                className="bx bx-check-circle"
                style={{ color: "var(--success-500)" }}
              ></i>
            </div>
            <div>
              <p className={styles.statLabel}>Present</p>
              <h3 className={styles.statValue}>{attendanceStats.present}</h3>
            </div>
          </div>

          <div className={styles.statCard}>
            <div
              className={styles.statIcon}
              style={{ background: "rgba(239, 68, 68, 0.1)" }}
            >
              <i
                className="bx bx-x-circle"
                style={{ color: "var(--danger-500)" }}
              ></i>
            </div>
            <div>
              <p className={styles.statLabel}>Absent</p>
              <h3 className={styles.statValue}>{attendanceStats.absent}</h3>
            </div>
          </div>

          <div className={styles.statCard}>
            <div
              className={styles.statIcon}
              style={{ background: "rgba(245, 158, 11, 0.1)" }}
            >
              <i
                className="bx bx-book"
                style={{ color: "var(--warning-500)" }}
              ></i>
            </div>
            <div>
              <p className={styles.statLabel}>Total Classes</p>
              <h3 className={styles.statValue}>
                {attendanceStats.totalClasses}
              </h3>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Active Sessions</h2>
              <span className={styles.badge}>{activeSessions.length}</span>
            </div>
            <div className={styles.sessionsGrid}>
              {activeSessions.map((session) => (
                <div key={session.id} className={styles.sessionCard}>
                  <div className={styles.sessionIcon}>
                    <i className="bx bx-book-open"></i>
                  </div>
                  <h3>{session.name}</h3>
                  <p className={styles.sessionDetail}>
                    <i className="bx bx-user"></i>
                    <span>{session.faculty}</span>
                  </p>
                  <p className={styles.sessionDetail}>
                    <i className="bx bx-map"></i>
                    <span>{session.room}</span>
                  </p>
                  <p className={styles.sessionTime}>
                    <i className="bx bx-time"></i>
                    <span>{session.time}</span>
                  </p>
                  <button
                    className={styles.joinButton}
                    onClick={() => handleJoinSession(session)}
                  >
                    <i className="bx bx-log-in-circle"></i>
                    Join Session
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mark Attendance */}
        {isSessionActive && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Mark Attendance</h2>
            </div>
            <form
              onSubmit={handleMarkAttendance}
              className={styles.attendanceForm}
            >
              <div className={styles.formGroup}>
                <label>Session Code</label>
                <div className={styles.inputWrapper}>
                  <i className="bx bx-qr"></i>
                  <input
                    type="text"
                    placeholder="Enter session code (e.g., ABC123)"
                    value={sessionCode}
                    onChange={(e) =>
                      setSessionCode(e.target.value.toUpperCase())
                    }
                    maxLength="6"
                  />
                </div>
              </div>
              <div className={styles.formButtons}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => {
                    setIsSessionActive(false);
                    setSessionCode("");
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  <i className="bx bx-check"></i>
                  Mark Attendance
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Attendance History */}
        {attendanceHistory.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2>Attendance History</h2>
              <div className={styles.filterButtons}>
                {["all", "week", "month"].map((range) => (
                  <button
                    key={range}
                    className={`${styles.filterButton} ${
                      filterDateRange === range ? styles.active : ""
                    }`}
                    onClick={() => setFilterDateRange(range)}
                  >
                    {range === "all"
                      ? "All Time"
                      : range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.historyTable}>
              <div className={styles.tableHeader}>
                <div>Date</div>
                <div>Subject</div>
                <div>Faculty</div>
                <div>Status</div>
              </div>
              {attendanceHistory.map((record, idx) => (
                <div key={idx} className={styles.tableRow}>
                  <div>{new Date(record.date).toLocaleDateString()}</div>
                  <div className={styles.cellEllipsis}>{record.subject}</div>
                  <div className={styles.cellEllipsis}>{record.faculty}</div>
                  <div>
                    <span
                      className={`${styles.statusBadge} ${styles[`status${record.status}`.toLowerCase()]}`}
                    >
                      {record.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {activeSessions.length === 0 && attendanceHistory.length === 0 && (
          <section className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <i className="bx bx-inbox"></i>
            </div>
            <h3>No Active Sessions</h3>
            <p>
              Check back later for active sessions or view your attendance
              history.
            </p>
          </section>
        )}
      </div>

      {/* Toast Notifications */}
      <div className={styles.toastContainer}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[`toast${toast.type}`]}`}
          >
            <i
              className={`bx ${
                toast.type === "success"
                  ? "bx-check-circle"
                  : "bx-exclamation-circle"
              }`}
            ></i>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      <Footer />
    </div>
  );
};

export default InClassStudentModern;
