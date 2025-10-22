import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
// Note: We reuse the StudentPortal CSS file as the styles are highly similar
import "./InClassFaculty.css";

const mockFacultyData = {
  name: "Dr. Evelyn Reed",
  role: "Faculty",
  id: "FAC67890",
  department: "Computer Science",
  college: "Tech University",
  courses: [
    {
      id: "CS401",
      name: "Database Systems",
      totalStudents: 45,
      avgAttendance: 91,
    },
    {
      id: "CS305",
      name: "Data Structures",
      totalStudents: 62,
      avgAttendance: 85,
    },
    { id: "CS510", name: "Advanced AI", totalStudents: 28, avgAttendance: 95 },
  ],
  activeSession: null, // { courseId: 'CS401', courseName: 'Database Systems', code: 'A1B2C3', timeRemaining: 1800 }
};

const InClassFaculty = () => {
  const navigate = useNavigate();
  // State to manage the active session (simulating a live code and timer)
  const [activeSession, setActiveSession] = useState(
    mockFacultyData.activeSession
  );
  const [selectedCourse, setSelectedCourse] = useState(
    mockFacultyData.courses[0].id
  );

  const handleLogout = () => {
    navigate("/login");
  };

  const generateSessionCode = (e) => {
    e.preventDefault();
    if (activeSession) {
      alert("A session is already active. Please end it first.");
      return;
    }
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    setActiveSession({
      courseId: selectedCourse,
      courseName: mockFacultyData.courses.find((c) => c.id === selectedCourse)
        .name,
      code: newCode,
      timeRemaining: 1800, // 30 minutes in seconds
    });
  };

  const endSession = () => {
    setActiveSession(null);
    alert("Session ended. Attendance recorded.");
  };

  const handleViewReport = (courseId) => {
    alert(`Simulating viewing detailed report for course ID: ${courseId}`);
  };

  // Placeholder for a simple countdown display (You'd use setInterval in a real app)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${("0" + remainingSeconds).slice(-2)}`;
  };

  return (
    <div className="portal-page-wrapper">
      <header className="portal-header">
        <div className="header-left">
          <span className="brand-name">InClass Faculty Portal</span>
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
            <h2>Hello, {mockFacultyData.name}.</h2>
            <p className="user-details">
              {mockFacultyData.role} | {mockFacultyData.id}
            </p>
            <p className="college-details">
              {mockFacultyData.department}, {mockFacultyData.college}
            </p>
          </div>
          <div className="attendance-summary">
            {/* Using percentage-text style with different content */}
            <p
              className="percentage-text"
              style={{ fontSize: "1.2rem", color: "#10b981" }}
            >
              Courses Taught: {mockFacultyData.courses.length}
            </p>
            <p>Active Course Load</p>
          </div>
        </div>

        {/* --- Main Content Grid --- */}
        <div className="content-grid">
          {/* 1. Session Management Card */}
          <div className={`session-card ${activeSession ? "active" : ""}`}>
            <h3>Attendance Session Management</h3>
            {!activeSession ? (
              <div className="session-controls">
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="course-select"
                >
                  {mockFacultyData.courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.id})
                    </option>
                  ))}
                </select>
                <button
                  className="join-btn"
                  onClick={generateSessionCode}
                  style={{ background: "#10b981" }} // Use success color for generation
                >
                  Generate New Session Code
                </button>
              </div>
            ) : (
              <div className="active-session-details">
                <p className="course-title">{activeSession.courseName}</p>
                <p className="code-display">
                  Code:{" "}
                  <span className="highlight-code">{activeSession.code}</span>
                </p>
                <div className="timer">
                  <i className="bx bx-time-five" />
                  Ends in: **{formatTime(activeSession.timeRemaining)}**
                </div>
                <button
                  className="join-btn"
                  onClick={endSession}
                  style={{ background: "#c93535" }} // Use danger color to end
                >
                  End Session
                </button>
              </div>
            )}
          </div>

          {/* 2. Course Report Summary */}
          <div className="history-card">
            <h3>Course Attendance Summary</h3>
            <ul className="history-list">
              {mockFacultyData.courses.map((course) => (
                <li key={course.id} className="history-item">
                  <span className="history-course">
                    {course.name} ({course.id})
                  </span>
                  <span className="history-status" style={{ color: "#3b82f6" }}>
                    Avg: {course.avgAttendance}%
                  </span>
                  <a
                    href="#"
                    className="view-link"
                    onClick={(e) => {
                      e.preventDefault();
                      handleViewReport(course.id);
                    }}
                  >
                    Report <i className="bx bx-chevron-right"></i>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <footer className="portal-footer">
        <p>&copy; 2025 InClass | Made for Smart Campus</p>
      </footer>
    </div>
  );
};

export default InClassFaculty;
