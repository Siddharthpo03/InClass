import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import useAdminSocket from "../../hooks/useAdminSocket";
import AssistsPanel from "../../components/admin/AssistsPanel";
import RealTimeFeed from "../../components/admin/RealTimeFeed";
import UsersManagement from "../../components/admin/UsersManagement";
import AuditExport from "../../components/admin/AuditExport";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ToastContainer from "../../components/shared/ToastContainer";
import styles from "./AdminDashboard.module.css";

const MOCK_ADMIN_PROFILE = {
  userId: 0,
  id: 0,
  name: "Preview Admin",
  email: "preview@test.com",
  role: "admin",
};

const AdminDashboard = ({ previewMode = false }) => {
  const navigate = useNavigate();
  const [adminProfile, setAdminProfile] = useState(previewMode ? MOCK_ADMIN_PROFILE : null);
  const [loading, setLoading] = useState(!previewMode);
  const [activeTab, setActiveTab] = useState("overview");
  const [toasts, setToasts] = useState([]);
  const [stats, setStats] = useState({
    pendingAssists: 0,
    openRegistrations: 0,
    activeSessions: 0,
    recentAudits: 0,
  });

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

  // Fetch admin profile (skip when preview mode)
  useEffect(() => {
    if (previewMode) {
      setAdminProfile(MOCK_ADMIN_PROFILE);
      setLoading(false);
      return;
    }
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/auth/profile");
        if (response.data.role !== "admin") {
          navigate("/login");
          return;
        }
        setAdminProfile(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch admin profile:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate("/login");
        } else {
          showToast("Failed to load admin profile", "error");
          setLoading(false);
        }
      }
    };
    fetchProfile();
  }, [navigate, showToast, previewMode]);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      // Fetch pending assists
      const assistsRes = await apiClient.get("/biometrics/assist", {
        params: { status: "pending" },
      });
      const pendingAssists = assistsRes.data.assists?.length || 0;

      // Fetch active sessions (if endpoint exists)
      let activeSessions = 0;
      try {
        const sessionsRes = await apiClient.get("/faculty/sessions/active");
        activeSessions = sessionsRes.data.sessions?.length || 0;
      } catch {
        // Endpoint might not exist
      }

      // Fetch open registrations (if endpoint exists)
      let openRegistrations = 0;
      try {
        const regRes = await apiClient.get("/registrations/pending");
        openRegistrations = regRes.data.registrations?.length || 0;
      } catch {
        // Endpoint might not exist
      }

      setStats({
        pendingAssists,
        openRegistrations,
        activeSessions,
        recentAudits: 0, // Will be populated from audit export
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  useEffect(() => {
    if (adminProfile) {
      fetchStats();
      // Refresh stats every 30 seconds
      const interval = setInterval(fetchStats, 30000);
      return () => clearInterval(interval);
    }
  }, [adminProfile, fetchStats]);

  // Socket event handlers
  const handleAssistCreated = useCallback(
    (data) => {
      showToast(
        `New assist request from ${data.studentName || "student"}`,
        "info"
      );
      fetchStats();
    },
    [showToast, fetchStats]
  );

  const handleAssistAssigned = useCallback(
    () => {
      showToast(`Assist assigned to faculty`, "info");
      fetchStats();
    },
    [showToast, fetchStats]
  );

  const handleAssistCompleted = useCallback(
    () => {
      showToast(`Assist completed`, "success");
      fetchStats();
    },
    [showToast, fetchStats]
  );

  const handleSessionStarted = useCallback(
    (data) => {
      showToast(
        `New attendance session started: ${data.courseName || "course"}`,
        "info"
      );
      fetchStats();
    },
    [showToast, fetchStats]
  );

  const handleRegistrationCreated = useCallback(
    (data) => {
      showToast(
        `New course registration request from ${data.studentName || "student"}`,
        "info"
      );
      fetchStats();
    },
    [showToast, fetchStats]
  );

  // Initialize admin socket
  useAdminSocket({
    adminId: adminProfile?.userId || adminProfile?.id,
    onAssistCreated: handleAssistCreated,
    onAssistAssigned: handleAssistAssigned,
    onAssistCompleted: handleAssistCompleted,
    onSessionStarted: handleSessionStarted,
    onRegistrationCreated: handleRegistrationCreated,
    enabled: !!adminProfile,
  });

  const handleLogout = useCallback(() => {
    localStorage.removeItem("inclass_token");
    localStorage.removeItem("user_role");
    navigate("/login");
  }, [navigate]);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading admin dashboard..." />;
  }

  if (!adminProfile) {
    return (
      <div className={styles.errorContainer}>
        <p>Failed to load admin profile. Please try again.</p>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className={styles.dashboardWrapper}>
      {previewMode && (
        <div style={{ background: "#f59e0b", color: "#000", padding: "8px 16px", textAlign: "center", fontSize: "14px", fontWeight: 600 }}>
          Preview mode — no login (testing only)
        </div>
      )}
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            <i className="bx bx-shield-quarter"></i>
            Admin Dashboard
          </h1>
          <div className={styles.headerActions}>
            <span className={styles.adminName}>{adminProfile.name}</span>
            <button
              className={styles.logoutBtn}
              onClick={handleLogout}
              type="button"
            >
              <i className="bx bx-log-out"></i>
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className={styles.nav}>
        <button
          className={`${styles.navTab} ${
            activeTab === "overview" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("overview")}
          type="button"
        >
          <i className="bx bx-home"></i>
          Overview
        </button>
        <button
          className={`${styles.navTab} ${
            activeTab === "assists" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("assists")}
          type="button"
        >
          <i className="bx bx-face"></i>
          Assists
        </button>
        <button
          className={`${styles.navTab} ${
            activeTab === "realtime" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("realtime")}
          type="button"
        >
          <i className="bx bx-pulse"></i>
          Real-Time Monitor
        </button>
        <button
          className={`${styles.navTab} ${
            activeTab === "users" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("users")}
          type="button"
        >
          <i className="bx bx-user"></i>
          Users
        </button>
        <button
          className={`${styles.navTab} ${
            activeTab === "audit" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("audit")}
          type="button"
        >
          <i className="bx bx-file-blank"></i>
          Audit Logs
        </button>
      </nav>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {activeTab === "overview" && (
          <div className={styles.overview}>
            <h2 className={styles.sectionTitle}>Dashboard Overview</h2>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div
                  className={styles.statIcon}
                  style={{ background: "#3b82f6" }}
                >
                  <i className="bx bx-face"></i>
                </div>
                <div className={styles.statContent}>
                  <h3 className={styles.statValue}>{stats.pendingAssists}</h3>
                  <p className={styles.statLabel}>
                    Pending Assists
                  </p>
                </div>
                <button
                  className={styles.statAction}
                  onClick={() => setActiveTab("assists")}
                  type="button"
                >
                  View All <i className="bx bx-chevron-right"></i>
                </button>
              </div>

              <div className={styles.statCard}>
                <div
                  className={styles.statIcon}
                  style={{ background: "#10b981" }}
                >
                  <i className="bx bx-user-plus"></i>
                </div>
                <div className={styles.statContent}>
                  <h3 className={styles.statValue}>
                    {stats.openRegistrations}
                  </h3>
                  <p className={styles.statLabel}>Open Registrations</p>
                </div>
                <button
                  className={styles.statAction}
                  onClick={() => setActiveTab("users")}
                  type="button"
                >
                  View All <i className="bx bx-chevron-right"></i>
                </button>
              </div>

              <div className={styles.statCard}>
                <div
                  className={styles.statIcon}
                  style={{ background: "#f59e0b" }}
                >
                  <i className="bx bx-calendar-check"></i>
                </div>
                <div className={styles.statContent}>
                  <h3 className={styles.statValue}>{stats.activeSessions}</h3>
                  <p className={styles.statLabel}>Active Sessions</p>
                </div>
                <button
                  className={styles.statAction}
                  onClick={() => setActiveTab("realtime")}
                  type="button"
                >
                  View All <i className="bx bx-chevron-right"></i>
                </button>
              </div>

              <div className={styles.statCard}>
                <div
                  className={styles.statIcon}
                  style={{ background: "#8b5cf6" }}
                >
                  <i className="bx bx-file-blank"></i>
                </div>
                <div className={styles.statContent}>
                  <h3 className={styles.statValue}>{stats.recentAudits}</h3>
                  <p className={styles.statLabel}>Recent Audit Events</p>
                </div>
                <button
                  className={styles.statAction}
                  onClick={() => setActiveTab("audit")}
                  type="button"
                >
                  View All <i className="bx bx-chevron-right"></i>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className={styles.quickActions}>
              <h3 className={styles.quickActionsTitle}>Quick Actions</h3>
              <div className={styles.quickActionsGrid}>
                <button
                  className={styles.quickActionBtn}
                  onClick={() => setActiveTab("assists")}
                  type="button"
                >
                  <i className="bx bx-face"></i>
                  Manage Assists
                </button>
                <button
                  className={styles.quickActionBtn}
                  onClick={() => setActiveTab("users")}
                  type="button"
                >
                  <i className="bx bx-user"></i>
                  Manage Users
                </button>
                <button
                  className={styles.quickActionBtn}
                  onClick={() => setActiveTab("audit")}
                  type="button"
                >
                  <i className="bx bx-download"></i>
                  Export Audit Logs
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "assists" && (
          <AssistsPanel
            adminId={adminProfile.userId || adminProfile.id}
            onAssistUpdated={fetchStats}
          />
        )}

        {activeTab === "realtime" && (
          <RealTimeFeed adminId={adminProfile.userId || adminProfile.id} />
        )}

        {activeTab === "users" && (
          <UsersManagement
            adminId={adminProfile.userId || adminProfile.id}
            onUserUpdated={fetchStats}
          />
        )}

        {activeTab === "audit" && (
          <AuditExport adminId={adminProfile.userId || adminProfile.id} />
        )}
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default AdminDashboard;








