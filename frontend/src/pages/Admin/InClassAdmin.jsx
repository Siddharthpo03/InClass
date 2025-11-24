import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./InClassAdmin.module.css";

const mockAdminData = {
  name: "System Administrator",
  role: "Admin",
  id: "ADM001",
  stats: {
    totalUsers: 1250,
    activeSessions: 3,
    newRegistersToday: 25,
    systemUptime: "99.98%",
  },
  recentRegistrations: [
    { id: 1, name: "S. Smith", role: "Student", date: "2025-10-22" },
    { id: 2, name: "D. Lopez", role: "Faculty", date: "2025-10-21" },
    { id: 3, name: "A. Khan", role: "Student", date: "2025-10-21" },
  ],
};

const InClassAdminPanel = () => {
  // Component renamed to Panel
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  const classNames = (...classes) =>
    classes
      .flat()
      .filter(Boolean)
      .map((cls) => styles[cls] || cls)
      .join(" ")
      .trim();

  const handleLogout = () => {
    navigate("/login");
  };

  const handleUserAction = (action, user) => {
    alert(`${action} user: ${user.name} (Role: ${user.role})`);
  };

  return (
    <div className={classNames("portal-page-wrapper")}>
      <header className={classNames("portal-header")}>
        <div className={classNames("header-left")}>
          <span className={classNames("brand-name")}>InClass Admin Panel</span>
        </div>
        <div className={classNames("header-right")}>
          <button className={classNames("logout-btn")} onClick={handleLogout}>
            <i className="bx bx-log-out" /> Logout
          </button>
        </div>
      </header>

      <div className={classNames("portal-container")}>
        {/* Profile Card / Welcome */}
        <div className={classNames("profile-card")}>
          <div className={classNames("profile-info")}>
            <h2>Welcome, {mockAdminData.name}.</h2>
            <p className={classNames("user-details")}>
              Role: {mockAdminData.role} | ID: {mockAdminData.id}
            </p>
            <p className={classNames("college-details")} style={{ color: "#c93535" }}>
              WARNING: Handle permissions with care.
            </p>
          </div>
          <div className={classNames("admin-status")}>
            <span
              className={classNames("percentage-text")}
              style={{ fontSize: "1.2rem", color: "#10b981" }}
            >
              Status: Operational
            </span>
            <p>System Health</p>
          </div>
        </div>

        {/* --- Navigation Tabs --- */}
        <div className={classNames("admin-tabs")}>
          <button
            className={classNames(
              "tab-btn",
              activeTab === "dashboard" && "active-tab"
            )}
            onClick={() => setActiveTab("dashboard")}
          >
            <i className="bx bx-tachometer" /> Dashboard Metrics
          </button>
          <button
            className={classNames("tab-btn", activeTab === "users" && "active-tab")}
            onClick={() => setActiveTab("users")}
          >
            <i className="bx bx-group" /> User Management
          </button>
        </div>

        {/* --- Content Area --- */}
        <div className={classNames("content-area")}>
          {activeTab === "dashboard" && (
            <div className={classNames("metrics-grid")}>
              {Object.keys(mockAdminData.stats).map((key) => (
                <div key={key} className={classNames("metric-card")}>
                  <p className={classNames("metric-value")}>
                    {mockAdminData.stats[key]}
                  </p>
                  <p className={classNames("metric-label")}>
                    {key.replace(/([A-Z])/g, " $1").toUpperCase()}
                  </p>
                </div>
              ))}

              <div className={classNames("recent-activity-card")}>
                <h4>Recent Registrations</h4>
                <ul>
                  {mockAdminData.recentRegistrations.map((reg) => (
                    <li key={reg.id}>
                      {reg.name} ({reg.role}) - {reg.date}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className={classNames("user-management")}>
              <h3>User Accounts Overview</h3>
              <p className={classNames("user-count")}>
                Total Active Users: {mockAdminData.stats.totalUsers}
              </p>
              <div className={classNames("user-list-card")}>
                <div className={classNames("user-search")}>
                  <input
                    type="text"
                    placeholder="Search by name, ID, or role..."
                  />
                  <button className={classNames("search-btn")}>Search</button>
                </div>

                {mockAdminData.recentRegistrations.map((user) => (
                  <div key={user.id} className={classNames("user-row")}>
                    <span className={classNames("user-info")}>
                      <strong>{user.name}</strong> ({user.role})
                    </span>
                    <div className={classNames("user-actions")}>
                      <button
                        className={classNames("action-btn", "view-btn")}
                        onClick={() => handleUserAction("View Details", user)}
                      >
                        View
                      </button>
                      <button
                        className={classNames("action-btn", "reset-btn")}
                        onClick={() => handleUserAction("Reset Password", user)}
                      >
                        Reset Pwd
                      </button>
                      <button
                        className={classNames("action-btn", "delete-btn")}
                        onClick={() => handleUserAction("Delete", user)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <footer className={classNames("portal-footer")}>
        <p>&copy; 2025 InClass Admin System</p>
      </footer>
    </div>
  );
};

export default InClassAdminPanel;
