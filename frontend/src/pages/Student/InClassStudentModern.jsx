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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenWarning, setFullscreenWarning] = useState(false);
  const [sessionTimer, setSessionTimer] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [toasts, setToasts] = useState([]);
  const timerRef = useRef(null);
  const fullscreenRef = useRef(null);
  const firstName = userData?.name?.split(" ")?.[0] || "Student";
  const currentDate = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const sidebarLinks = [
    { label: "Dashboard", icon: "bx-grid-alt" },
    { label: "Register Courses", icon: "bx-book-add", path: "/student/register-courses" },
    { label: "Mark Attendance", icon: "bx-qr" },
    { label: "History", icon: "bx-history" },
    { label: "Profile", icon: "bx-user" },
  ];

  const handleSidebarAction = (item) => {
    if (item.path) {
      navigate(item.path);
      return;
    }

    if (item.label === "Mark Attendance") {
      void handleJoinSession({ duration: 300 });
      return;
    }

    if (item.label === "History") {
      document.getElementById("student-attendance-history")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = Boolean(
        document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement,
      );

      setIsFullscreen(isCurrentlyFullscreen);

      if (!isCurrentlyFullscreen && isSessionActive) {
        setFullscreenWarning(true);
        setIsSessionActive(false);
        setSessionCode("");
        setSessionTimer(null);
        if (timerRef.current) clearInterval(timerRef.current);
        addToast("⚠️ You exited fullscreen! Attendance cancelled.", "error");
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange,
      );
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
    };
  }, [isSessionActive]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
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
        setSessionTimer(null);
        setIsSessionActive(false);
        if (document.exitFullscreen) document.exitFullscreen();
        if (timerRef.current) clearInterval(timerRef.current);
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

  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      console.error("Fullscreen error:", err);
    }
  };

  async function handleJoinSession(session) {
    await enterFullscreen();
    setIsSessionActive(true);
    setFullscreenWarning(false);

    const duration = session.duration || 300;
    setSessionTimer(duration);
    setTimeRemaining(duration);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setSessionTimer(null);
          setIsSessionActive(false);
          setSessionCode("");
          if (document.exitFullscreen) document.exitFullscreen();
          addToast("⏰ Time's up! Attendance window closed.", "error");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const addToast = (message, type) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleLogout = () => {
    localStorage.removeItem("inclass_token");
    localStorage.removeItem("inclass_user");
    localStorage.removeItem("inclass_role");
    sessionStorage.clear();
    navigate("/login");
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
    <div className={styles.dashboardLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <div className={styles.sidebarLogo}>
            <img src="/favicon.jpg" alt="InClass" />
          </div>
          <div>
            <strong>InClass</strong>
            <span>Student Portal</span>
          </div>
        </div>

        <nav className={styles.sidebarNav} aria-label="Student navigation">
          {sidebarLinks.map((item, index) => (
            <button
              key={item.label}
              type="button"
              className={`${styles.sidebarLink} ${index === 0 ? styles.sidebarLinkActive : ""}`}
              onClick={() => handleSidebarAction(item)}
            >
              <i className={`bx ${item.icon}`} aria-hidden="true"></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.sidebarUser}>
            <div className={styles.avatar}>
              {firstName.charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{userData?.name}</strong>
              <span>{userData?.role || "student"}</span>
            </div>
          </div>
          <button className={styles.sidebarLogout} onClick={handleLogout}>
            <i className="bx bx-log-out"></i>
            Sign Out
          </button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <div className={styles.topBar}>
          <div>
            <p className={styles.kicker}>Student Dashboard</p>
            <h1>Overview</h1>
          </div>
          <div className={styles.topBarMeta}>{currentDate}</div>
        </div>

        <section className={styles.heroCard}>
          <div className={styles.heroCopy}>
            <span className={styles.heroEyebrow}>Attendance overview</span>
            <h2>Good Morning, {firstName}! 👋</h2>
            <p>Here's what's happening with your attendance today</p>
            <div className={styles.badgeRow}>
              {userData?.college && <span>{userData.college}</span>}
              {userData?.department && <span>{userData.department}</span>}
            </div>
          </div>
          <div className={styles.heroAvatar} aria-hidden>
            {firstName.charAt(0).toUpperCase()}
          </div>
        </section>

        <section className={styles.statsGrid}>
          <article className={`${styles.statCard} ${styles.statAttendance}`}>
            <span className={styles.statLabel}>Attendance</span>
            <strong className={styles.statValue}>
              {attendanceStats.percentage}%
            </strong>
            <span className={styles.statTrend}>
              <i className="bx bx-trending-up"></i> +4%
            </span>
          </article>
          <article className={`${styles.statCard} ${styles.statPresent}`}>
            <span className={styles.statLabel}>Present</span>
            <strong className={styles.statValue}>
              {attendanceStats.present}
            </strong>
            <span className={styles.statTrend}>
              <i className="bx bx-trending-up"></i> +2
            </span>
          </article>
          <article className={`${styles.statCard} ${styles.statAbsent}`}>
            <span className={styles.statLabel}>Absent</span>
            <strong className={styles.statValue}>
              {attendanceStats.absent}
            </strong>
            <span className={styles.statTrend}>
              <i className="bx bx-trending-down"></i> -1
            </span>
          </article>
          <article className={`${styles.statCard} ${styles.statTotal}`}>
            <span className={styles.statLabel}>Total Classes</span>
            <strong className={styles.statValue}>
              {attendanceStats.totalClasses}
            </strong>
            <span className={styles.statTrend}>
              <i className="bx bx-trending-up"></i> +3
            </span>
          </article>
        </section>

        <section className={styles.quickActionSection}>
          <div
            className={styles.quickActionCard}
            onClick={() => void handleJoinSession({ duration: 300 })}
            role="button"
            tabIndex={0}
          >
            <div className={styles.quickActionIcon}>
              <i className="bx bx-qr"></i>
            </div>
            <div className={styles.quickActionBody}>
              <h3>Mark Attendance</h3>
              <p>Enter session code to mark attendance</p>
              <form
                onSubmit={handleMarkAttendance}
                className={styles.quickActionForm}
              >
                <input
                  type="text"
                  placeholder="Enter code"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  maxLength="6"
                />
                <button type="submit">
                  <i className="bx bx-check"></i>
                  Submit
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>My Courses</h2>
            <span className={styles.sectionPill}>
              {activeSessions.length} live
            </span>
          </div>
          {activeSessions.length > 0 ? (
            <div className={styles.courseGrid}>
              {activeSessions.map((session) => (
                <article key={session.id} className={styles.courseCard}>
                  <div className={styles.courseTop}>
                    <div>
                      <span className={styles.courseStatus}>enrolled</span>
                      <h3>{session.name}</h3>
                    </div>
                    <button
                      className={styles.courseAction}
                      onClick={() => handleJoinSession(session)}
                      type="button"
                    >
                      Join
                    </button>
                  </div>
                  <div className={styles.courseMeta}>
                    Faculty: {session.faculty}
                  </div>
                  <div className={styles.courseMeta}>Room: {session.room}</div>
                  <div className={styles.courseMeta}>Time: {session.time}</div>
                  <div className={styles.courseMeta}>
                    Department: {userData?.department || "General"}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <svg
                className={styles.emptyIllustration}
                viewBox="0 0 120 120"
                aria-hidden="true"
              >
                <rect
                  x="20"
                  y="24"
                  width="80"
                  height="72"
                  rx="16"
                  fill="currentColor"
                  opacity="0.08"
                />
                <rect
                  x="28"
                  y="34"
                  width="64"
                  height="48"
                  rx="12"
                  fill="currentColor"
                  opacity="0.14"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="16"
                  fill="currentColor"
                  opacity="0.22"
                />
                <path
                  d="M60 50v12l8 5"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
              <h3>You're all caught up!</h3>
              <p>
                No active sessions right now. We'll notify you when a new
                session starts.
              </p>
            </div>
          )}
        </section>

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
                    setSessionTimer(null);
                    if (timerRef.current) clearInterval(timerRef.current);
                    if (document.exitFullscreen) document.exitFullscreen();
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

        {attendanceHistory.length > 0 && (
          <section className={styles.section} id="student-attendance-history">
            <div className={styles.sectionHeader}>
              <div>
                <h2>Attendance History</h2>
                <p className={styles.sectionSubtext}>
                  Track your recent attendance activity
                </p>
              </div>
              <div className={styles.historyTools}>
                <input
                  className={styles.historySearch}
                  type="search"
                  placeholder="Search history"
                />
                <div className={styles.filterButtons}>
                  {["all", "week", "month"].map((range) => (
                    <button
                      key={range}
                      type="button"
                      className={`${styles.filterButton} ${filterDateRange === range ? styles.filterActive : ""}`}
                      onClick={() => setFilterDateRange(range)}
                    >
                      {range === "all"
                        ? "All"
                        : range === "week"
                          ? "This Week"
                          : "This Month"}
                    </button>
                  ))}
                </div>
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
                <div
                  key={idx}
                  className={`${styles.tableRow} ${idx % 2 === 0 ? styles.tableRowAlt : ""}`}
                >
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

        <Footer />
        <div className={styles.toastContainer}>
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`${styles.toast} ${toast.type === "success" ? styles.toastSuccess : styles.toastError}`}
            >
              <i
                className={`bx ${toast.type === "success" ? "bx-check-circle" : "bx-error"}`}
              ></i>
              <span>{toast.message}</span>
            </div>
          ))}
        </div>

        {isSessionActive && (
          <div ref={fullscreenRef} className={styles.fullscreenOverlay}>
            <div className={styles.fullscreenContent}>
              <div className={styles.timerCircle}>
                <span className={styles.timerText}>{formatTime(timeRemaining)}</span>
                <span className={styles.timerLabel}>remaining</span>
              </div>

              <h2 className={styles.fullscreenTitle}>Mark Your Attendance</h2>
              <p className={styles.fullscreenSubtitle}>
                Enter the session code provided by your faculty
              </p>

              {fullscreenWarning && (
                <div className={styles.warningBanner}>
                  <i className="bx bx-error"></i>
                  Do NOT exit fullscreen or your attendance will be cancelled!
                </div>
              )}

              <form onSubmit={handleMarkAttendance} className={styles.fullscreenForm}>
                <input
                  type="text"
                  placeholder="Enter session code (e.g. ABC123)"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
                  maxLength="6"
                  className={styles.fullscreenInput}
                  autoFocus
                />
                <button type="submit" className={styles.fullscreenSubmit}>
                  <i className="bx bx-check-circle"></i>
                  Mark Attendance
                </button>
              </form>

              <p className={styles.fullscreenWarning}>
                <i className="bx bx-info-circle"></i>
                Exiting fullscreen will cancel your attendance
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
export default InClassStudentModern;
