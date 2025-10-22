import React from "react";
import { useNavigate } from "react-router-dom";
import "./InClassStudent.css";
// Assuming you have a default profile picture asset
// import profilePic from "../../assets/default-user.png";

const mockUserData = {
  name: "Alex Johnson",
  role: "Student",
  id: "STU12345",
  department: "Computer Science",
  college: "Tech University",
  attendancePercentage: 88.5,
  currentSession: {
    course: "CS401 - Database Systems",
    instructor: "Dr. Evelyn Reed",
    timeRemaining: "15:30",
    status: "Active",
  },
  attendanceHistory: [
    { date: "2025-10-20", course: "CS401", status: "Present" },
    { date: "2025-10-18", course: "MA205", status: "Present" },
    { date: "2025-10-15", course: "EE310", status: "Absent" },
    { date: "2025-10-13", course: "CS401", status: "Present" },
  ],
};

const InClassStudentPortal = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // In a real app, clear auth tokens here
    navigate("/login");
  };

  const handleJoinSession = (e) => {
    e.preventDefault();
    alert("Simulating joining session and prompting for session code...");
    // Future: navigate('/session-join')
  };

  return (
    <div className="portal-page-wrapper">
      <header className="portal-header">
        <div className="header-left">
          <span className="brand-name">InClass Portal</span>
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
          {/* <img src={profilePic} alt="Profile" className="profile-img" /> */}
          <div className="profile-info">
            <h2>Welcome back, {mockUserData.name}!</h2>
            <p className="user-details">
              {mockUserData.role} | {mockUserData.id}
            </p>
            <p className="college-details">
              {mockUserData.department}, {mockUserData.college}
            </p>
          </div>
          <div className="attendance-summary">
            <div className="attendance-circle">
              <span className="percentage-text">
                {mockUserData.attendancePercentage}%
              </span>
            </div>
            <p>Overall Attendance</p>
          </div>
        </div>

        {/* --- Main Content Grid --- */}
        <div className="content-grid">
          {/* Active Session Card */}
          <div className="session-card active">
            <h3>Active Attendance Session</h3>
            <p className="course-title">{mockUserData.currentSession.course}</p>
            <p className="instructor">
              Taught by: {mockUserData.currentSession.instructor}
            </p>
            <div className="timer">
              <i className="bx bx-time-five" />
              Time Remaining: **{mockUserData.currentSession.timeRemaining}**
            </div>
            <button className="join-btn" onClick={handleJoinSession}>
              Enter Session Code & Mark Attendance
            </button>
          </div>

          {/* Attendance History */}
          <div className="history-card">
            <h3>Recent Attendance History</h3>
            <ul className="history-list">
              {mockUserData.attendanceHistory.map((item, index) => (
                <li
                  key={index}
                  className={`history-item ${item.status.toLowerCase()}`}
                >
                  <span className="history-date">{item.date}</span>
                  <span className="history-course">{item.course}</span>
                  <span className="history-status">{item.status}</span>
                </li>
              ))}
            </ul>
            <a href="#" className="view-all-link">
              View Full Report <i className="bx bx-chevron-right"></i>
            </a>
          </div>
        </div>
      </div>

      <footer className="portal-footer">
        <p>&copy; 2025 InClass | Made for Smart Campus</p>
      </footer>
    </div>
  );
};

export default InClassStudentPortal;
