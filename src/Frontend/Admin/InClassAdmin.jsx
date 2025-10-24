import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// Corrected to use the standard file naming convention
import "./InClassAdmin.css";

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

  const handleLogout = () => {
    navigate("/login");
  };

  const handleUserAction = (action, user) => {
    alert(`${action} user: ${user.name} (Role: ${user.role})`);
  };

  return (
    <div className="portal-page-wrapper">
      <header className="portal-header">
        <div className="header-left">
          <span className="brand-name">InClass Admin Panel</span>
        </div>
        <div className="header-right">
          <button className="logout-btn" onClick={handleLogout}>
            <i className="bx bx-log-out" /> Logout
          </button>
        </div>
      </header>

      <div className="portal-container">
        {/* Profile Card / Welcome */}
        <div className="profile-card">
          <div className="profile-info">
            <h2>Welcome, {mockAdminData.name}.</h2>
            <p className="user-details">
              Role: {mockAdminData.role} | ID: {mockAdminData.id}
            </p>
            <p className="college-details" style={{ color: "#c93535" }}>
              WARNING: Handle permissions with care.
            </p>
          </div>
          <div className="admin-status">
            <span
              className="percentage-text"
              style={{ fontSize: "1.2rem", color: "#10b981" }}
            >
              Status: Operational
            </span>
            <p>System Health</p>
          </div>
        </div>

        {/* --- Navigation Tabs --- */}
        <div className="admin-tabs">
          <button
            className={`tab-btn ${
              activeTab === "dashboard" ? "active-tab" : ""
            }`}
            onClick={() => setActiveTab("dashboard")}
          >
            <i className="bx bx-tachometer" /> Dashboard Metrics
          </button>
          <button
            className={`tab-btn ${activeTab === "users" ? "active-tab" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            <i className="bx bx-group" /> User Management
          </button>
        </div>

        {/* --- Content Area --- */}
        <div className="content-area">
          {activeTab === "dashboard" && (
            <div className="metrics-grid">
              {Object.keys(mockAdminData.stats).map((key) => (
                <div key={key} className="metric-card">
                  <p className="metric-value">{mockAdminData.stats[key]}</p>
                  <p className="metric-label">
                    {key.replace(/([A-Z])/g, " $1").toUpperCase()}
                  </p>
                </div>
              ))}

              <div className="recent-activity-card">
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
            <div className="user-management">
              <h3>User Accounts Overview</h3>
              <p className="user-count">
                Total Active Users: {mockAdminData.stats.totalUsers}
              </p>
              <div className="user-list-card">
                <div className="user-search">
                  <input
                    type="text"
                    placeholder="Search by name, ID, or role..."
                  />
                  <button className="search-btn">Search</button>
                </div>

                {mockAdminData.recentRegistrations.map((user) => (
                  <div key={user.id} className="user-row">
                    <span className="user-info">
                      <strong>{user.name}</strong> ({user.role})
                    </span>
                    <div className="user-actions">
                      <button
                        className="action-btn view-btn"
                        onClick={() => handleUserAction("View Details", user)}
                      >
                        View
                      </button>
                      <button
                        className="action-btn reset-btn"
                        onClick={() => handleUserAction("Reset Password", user)}
                      >
                        Reset Pwd
                      </button>
                      <button
                        className="action-btn delete-btn"
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

      <footer className="portal-footer">
        <p>&copy; 2025 InClass Admin System</p>
      </footer>
    </div>
  );
};

export default InClassAdminPanel;
