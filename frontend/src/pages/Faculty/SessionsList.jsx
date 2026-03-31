import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import TopNav from "../../components/faculty/TopNav";
import Sidebar from "../../components/faculty/Sidebar";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ToastContainer from "../../components/shared/ToastContainer";
import StatCard from "../../components/shared/StatCard";
import styles from "./SessionsList.module.css";

const SessionsList = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facultyProfile, setFacultyProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, show: true }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/auth/profile");
        setFacultyProfile(response.data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate("/login");
        }
      }
    };
    fetchProfile();
  }, [navigate]);

  // Fetch sessions and courses
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionsRes, coursesRes] = await Promise.all([
          apiClient.get("/faculty/sessions").catch((err) => {
            console.error("Sessions fetch error:", err);
            console.error("Error response:", err.response?.data);
            console.error("Error status:", err.response?.status);
            showToast("Failed to load sessions. Please check console for details.", "error");
            return { data: [] };
          }),
          apiClient.get("/faculty/my-courses").catch(() => ({ data: [] })),
        ]);

        console.log("Sessions API response:", sessionsRes);
        console.log("Sessions data:", sessionsRes.data);
        const sessionsData = Array.isArray(sessionsRes.data) ? sessionsRes.data : [];
        
        // Ensure is_active is properly set based on expiration
        const processedSessions = sessionsData.map(session => ({
          ...session,
          is_active: session.is_active && new Date(session.expires_at) > new Date(),
        }));
        
        // Sort sessions: active first, then by date (newest first)
        const sortedSessions = [...processedSessions].sort((a, b) => {
          if (a.is_active && !b.is_active) return -1;
          if (!a.is_active && b.is_active) return 1;
          const dateA = new Date(a.created_at || a.createdAt || 0);
          const dateB = new Date(b.created_at || b.createdAt || 0);
          return dateB - dateA;
        });

        console.log("Processed sessions:", sortedSessions);
        setSessions(sortedSessions);
        setCourses(coursesRes.data || []);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
        showToast("Failed to load sessions.", "error");
        setLoading(false);
      }
    };
    fetchData();
    
    // Refresh sessions every 30 seconds to catch new sessions
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [showToast]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("inclass_token");
    localStorage.removeItem("user_role");
    navigate("/login");
  }, [navigate]);

  const getCourseName = (courseId) => {
    if (!courseId) return "Unknown Course";
    const course = courses.find((c) => c.id === courseId || c.id === parseInt(courseId));
    return course ? course.title : "Unknown Course";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const stats = {
    totalSessions: sessions.length,
    activeSessions: sessions.filter((s) => s.is_active).length,
    completedSessions: sessions.filter((s) => !s.is_active).length,
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading sessions..." />;
  }

  return (
    <div className={styles.sessionsWrapper}>
      <TopNav profile={facultyProfile} onLogout={handleLogout} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.sessionsContainer}>
        <button
          className={styles.mobileMenuButton}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
          type="button"
        >
          <i className="bx bx-menu"></i>
        </button>

        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Attendance Sessions</h1>
            <p className={styles.subtitle}>View and manage your attendance sessions</p>
          </div>
        </header>

        <section className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <StatCard
              value={stats.totalSessions}
              label="Total Sessions"
              icon="bx-calendar"
              variant="info"
            />
            <StatCard
              value={stats.activeSessions}
              label="Active Sessions"
              icon="bx-calendar-check"
              variant="success"
            />
            <StatCard
              value={stats.completedSessions}
              label="Completed"
              icon="bx-check-circle"
              variant="default"
            />
          </div>
        </section>

        <section className={styles.sessionsSection}>
          {sessions.length === 0 ? (
            <div className={styles.emptyState}>
              <i className="bx bx-calendar-x"></i>
              <h3>No sessions yet</h3>
              <p>Start a session from the dashboard to begin</p>
              <button
                className={styles.dashboardButton}
                onClick={() => navigate("/faculty/dashboard")}
                type="button"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className={styles.sessionsList}>
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`${styles.sessionItem} ${
                    session.is_active ? styles.active : ""
                  }`}
                  onClick={() => navigate(`/faculty/sessions/${session.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/faculty/sessions/${session.id}`);
                    }
                  }}
                  aria-label={`View session ${session.code} for ${getCourseName(session.class_id || session.course_id)}`}
                >
                  <div className={styles.sessionInfo}>
                    <h3 className={styles.sessionCourse}>
                      {getCourseName(session.class_id || session.course_id)}
                    </h3>
                    <div className={styles.sessionMeta}>
                      <span>
                        <i className="bx bx-code-alt"></i> Code: <strong>{session.code}</strong>
                      </span>
                      <span>
                        <i className="bx bx-time"></i>{" "}
                        {formatDate(session.created_at || session.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.sessionStatus}>
                    {session.is_active ? (
                      <span className={styles.activeBadge}>
                        <i className="bx bx-circle"></i> Active
                      </span>
                    ) : (
                      <span className={styles.completedBadge}>
                        <i className="bx bx-check-circle"></i> Completed
                      </span>
                    )}
                    <i className="bx bx-chevron-right" aria-hidden="true"></i>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default React.memo(SessionsList);


