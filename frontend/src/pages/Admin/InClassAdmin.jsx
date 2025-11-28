import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import styles from "./InClassAdmin.module.css";

const InClassAdmin = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    newRegistersToday: 0,
    systemUptime: "100%",
  });

  // Initialize dark mode
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedDarkMode !== null ? savedDarkMode === "true" : prefersDark;
    if (shouldBeDark) {
      document.body.classList.add("darkMode");
    } else {
      document.body.classList.remove("darkMode");
    }
  }, []);

  // Check authentication and fetch admin profile
  useEffect(() => {
    const checkAuthAndFetchProfile = async () => {
      // First check if token exists
      const token = localStorage.getItem("inclass_token");
      const userRole = localStorage.getItem("user_role");

      if (!token || !userRole) {
        console.log("No token or role found, redirecting to login");
        navigate("/login", { replace: true });
        return;
      }

      // Verify role is admin
      if (userRole !== "admin") {
        console.error("Unauthorized: Admin access required. Current role:", userRole);
        localStorage.removeItem("inclass_token");
        localStorage.removeItem("user_role");
        navigate("/login", { replace: true });
        return;
      }

      // Fetch profile
      try {
        const response = await apiClient.get("/auth/profile");
        console.log("Admin profile fetched:", response.data);
        setAdminProfile(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch admin profile:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem("inclass_token");
          localStorage.removeItem("user_role");
          navigate("/login", { replace: true });
        } else {
          // For other errors, still show the page but with error state
          setLoading(false);
        }
      }
    };

    // Small delay to ensure localStorage is set after navigation
    const timer = setTimeout(() => {
      checkAuthAndFetchProfile();
    }, 50);

    return () => clearTimeout(timer);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("inclass_token");
    localStorage.removeItem("user_role");
    navigate("/login");
  };

  const handleUserAction = (action, user) => {
    alert(`${action} user: ${user.name} (Role: ${user.role})`);
  };

  const classNames = (...classes) =>
    classes
      .flat()
      .filter(Boolean)
      .map((cls) => styles[cls] || cls)
      .join(" ")
      .trim();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (!adminProfile) {
    return (
      <div className={styles.errorContainer}>
        <p>Failed to load profile. Please try again.</p>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className={styles.dashboardWrapper}>
      <Navigation />

      <div className={styles.dashboardContainer}>
        {/* Header Section */}
        <header className={styles.dashboardHeader}>
          <div className={styles.headerContent}>
            <div className={styles.welcomeSection}>
              <h1 className={styles.welcomeTitle}>Welcome, {adminProfile.name}!</h1>
              <p className={styles.welcomeSubtitle}>
                {adminProfile.role} • {adminProfile.id || "N/A"}
              </p>
              <p className={styles.welcomeDetails}>System Administrator</p>
            </div>
            <div className={styles.headerActions}>
              <div className={styles.statusBadge}>
                <div className={styles.badgeCircle}>
                  <i className="bx bx-check-circle"></i>
                </div>
                <p className={styles.badgeLabel}>System Operational</p>
              </div>
              <button className={styles.logoutButton} onClick={handleLogout} title="Logout">
                <i className="bx bx-log-out"></i>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className={styles.adminTabs}>
          <button
            className={`${styles.tabBtn} ${activeTab === "dashboard" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <i className="bx bx-tachometer"></i>
            Dashboard Metrics
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === "users" ? styles.activeTab : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <i className="bx bx-group"></i>
            User Management
          </button>
        </div>

        {/* Content Area */}
        <div className={styles.contentArea}>
          {activeTab === "dashboard" && (
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricIcon}>
                  <i className="bx bx-user"></i>
                </div>
                <div className={styles.metricContent}>
                  <h3 className={styles.metricValue}>{stats.totalUsers}</h3>
                  <p className={styles.metricLabel}>Total Users</p>
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricIcon}>
                  <i className="bx bx-calendar-check"></i>
                </div>
                <div className={styles.metricContent}>
                  <h3 className={styles.metricValue}>{stats.activeSessions}</h3>
                  <p className={styles.metricLabel}>Active Sessions</p>
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricIcon}>
                  <i className="bx bx-user-plus"></i>
                </div>
                <div className={styles.metricContent}>
                  <h3 className={styles.metricValue}>{stats.newRegistersToday}</h3>
                  <p className={styles.metricLabel}>New Registrations Today</p>
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricIcon}>
                  <i className="bx bx-server"></i>
                </div>
                <div className={styles.metricContent}>
                  <h3 className={styles.metricValue}>{stats.systemUptime}</h3>
                  <p className={styles.metricLabel}>System Uptime</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className={styles.userManagement}>
              <h3>User Accounts Overview</h3>
              <p className={styles.userCount}>Total Active Users: {stats.totalUsers}</p>
              <div className={styles.userListCard}>
                <div className={styles.userSearch}>
                  <input type="text" placeholder="Search by name, ID, or role..." />
                  <button className={styles.searchBtn}>
                    <i className="bx bx-search"></i>
                    Search
                  </button>
                </div>
                <div className={styles.emptyState}>
                  <i className="bx bx-info-circle"></i>
                  <p>User management features coming soon</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default InClassAdmin;
