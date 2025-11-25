import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import "./InClassStudent.css";

// --- Mock Data ---
const mockUserData = {
  name: "Siddharth",
  role: "Student",
  id: "STU12345",
  department: "Computer Science",
  college: "Tech University",
  attendancePercentage: 88.5,
  currentSession: {
    courseId: "CS401",
    courseName: "CS401 - Database Systems",
    instructor: "Dr. Evelyn Reed",
    initialDuration: 30, // 30 seconds
    isActive: true, // Key flag for conditional rendering
  },
  attendanceHistory: [
    { date: "2025-10-20", course: "CS401", status: "Present" },
    { date: "2025-10-18", course: "MA205", status: "Present" },
    { date: "2025-10-15", course: "EE310", status: "Absent" },
    { date: "2025-10-13", course: "CS401", status: "Present" },
  ],
};
// --- End Mock Data ---

const InClassStudent = () => {
  const navigate = useNavigate();

  // Initialize dark mode from localStorage on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    const shouldBeDark = savedDarkMode !== null 
      ? savedDarkMode === "true" 
      : prefersDark;
    
    if (shouldBeDark) {
      document.body.classList.add("darkMode");
    } else {
      document.body.classList.remove("darkMode");
    }
  }, []);
  const portalRef = useRef(null);
  const intervalRef = useRef(null);

  const [sessionCode, setSessionCode] = useState("");
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionMessage, setSessionMessage] = useState("");
  const [timer, setTimer] = useState(0);

  // --- Logout Handler ---
  const handleLogout = () => {
    // Clear interval before logging out
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Remove token and redirect
    localStorage.removeItem("inclass_token");
    localStorage.removeItem("user_role");
    navigate("/login");
  };

  // Function to clean up state and enforce ABSENT mark upon violation/timeout
  const enforceAbsentAndExit = useCallback(
    (reason) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsSessionActive(false);
      setTimer(0);
      // Note: In a real app, you would send an API call to mark the student ABSENT here

      // For now, we alert and navigate to login to enforce the session end
      alert(
        `❌ Attendance Failed: ${reason} Session terminated. Marked ABSENT.`
      );
      navigate("/login");
    },
    [navigate]
  );

  // --- Effect 1: Fullscreen + Tab Switching Enforcement ---
  useEffect(() => {
    const enforceRules = () => {
      if (isSessionActive && !isAttendanceMarked) {
        // Check 1: Tab switched or minimized
        if (document.visibilityState === "hidden") {
          enforceAbsentAndExit("You switched tabs or minimized the browser!");
          return;
        }
        // Check 2: Exited fullscreen
        if (document.fullscreenElement === null) {
          enforceAbsentAndExit("You exited fullscreen!");
          return;
        }
      }
    };

    document.addEventListener("visibilitychange", enforceRules);
    document.addEventListener("fullscreenchange", enforceRules);

    return () => {
      document.removeEventListener("visibilitychange", enforceRules);
      document.removeEventListener("fullscreenchange", enforceRules);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isSessionActive, isAttendanceMarked, enforceAbsentAndExit]);

  // --- Effect 2: Timer Logic ---
  useEffect(() => {
    if (isSessionActive && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            enforceAbsentAndExit("Time ran out before code submission.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSessionActive, enforceAbsentAndExit]);

  // --- Start Attendance Session ---
  const handleStartSession = (e) => {
    e.preventDefault();

    // Attempt to enter fullscreen
    if (portalRef.current && portalRef.current.requestFullscreen) {
      portalRef.current
        .requestFullscreen()
        .then(() => {
          setIsSessionActive(true);
          setTimer(mockUserData.currentSession.initialDuration);
          setSessionMessage("");
        })
        .catch((err) => {
          // If fullscreen is blocked, still start session but warn the user
          alert(
            `❌ Could not enter fullscreen: ${err.message}. Attendance rules still apply! Do not switch tabs/minimize.`
          );
          setIsSessionActive(true);
          setTimer(mockUserData.currentSession.initialDuration);
        });
    } else {
      // Fallback for browsers that don't support Fullscreen API
      setIsSessionActive(true);
      setTimer(mockUserData.currentSession.initialDuration);
      alert(
        "⚠️ Fullscreen not supported. Attendance rules still apply! Do not switch tabs."
      );
    }
  };

  // --- Handle Session Code Submit (API Call) ---
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setSessionMessage("");

    if (sessionCode.length !== 6) {
      setSessionMessage("❌ Invalid code length.");
      return;
    }

    // Disable the button to prevent double-click while waiting for API
    const submitButton = e.currentTarget.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      const response = await apiClient.post("/attendance/mark", {
        code: sessionCode,
      });

      // SUCCESS: API returns 200/201
      if (intervalRef.current) {
        clearInterval(intervalRef.current); // Stop timer on success
        intervalRef.current = null;
      }
      setIsAttendanceMarked(true);
      setIsSessionActive(false);
      setSessionMessage(
        response.data.message ||
          "✅ Attendance marked successfully! You may now exit fullscreen."
      );

      // Optional: Exit fullscreen automatically
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (error) {
      // FAILURE: Handle API errors (e.g., Invalid code, Code expired, Duplicate entry)
      const errorMessage =
        error.response?.data?.message || "Attendance submission failed.";
      setSessionMessage(`❌ ${errorMessage}`);
      console.error("Attendance Submission Error:", error.response || error);

      // Re-enable button on failure
      if (submitButton) submitButton.disabled = false;
    }
  };

  // --- Render Session Card Content ---
  const renderSessionCardContent = () => {
    if (!mockUserData.currentSession.isActive && !isAttendanceMarked) {
      return (
        <div className="session-inactive">
          <h3>No Active Attendance Session</h3>
          <p>Please check back at the scheduled class time.</p>
        </div>
      );
    }

    if (isAttendanceMarked) {
      return (
        <div className="session-marked">
          <h3>Attendance Status</h3>
          <p className="course-title">
            {mockUserData.currentSession.courseName}
          </p>
          <div className="marked-status">
            <i className="bx bx-check-circle" />
            <span>Attendance Marked!</span>
          </div>
          <p className="marked-time">You are recorded as PRESENT.</p>
          <p className="session-message success">{sessionMessage}</p>
        </div>
      );
    }

    if (isSessionActive) {
      return (
        <form onSubmit={handleCodeSubmit} className="secure-form">
          <h3>Enter Secure Attendance Code</h3>
          <p className="course-title">
            {mockUserData.currentSession.courseName}
          </p>
          <p className="security-note">
            ⚠️ **DO NOT** switch tabs or exit fullscreen until submitted.
          </p>
          <div className="timer">
            <i className="bx bx-time-five" />
            Time Remaining:{" "}
            {`${Math.floor(timer / 60)}:${("0" + (timer % 60)).slice(-2)}`}
          </div>

          <input
            type="text"
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
            placeholder="ENTER 6-DIGIT CODE"
            className="session-code-input"
            maxLength="6"
            required
          />

          {sessionMessage && (
            <p
              className={`session-message ${
                sessionMessage.startsWith("✅") ? "success" : "error"
              }`}
            >
              {sessionMessage}
            </p>
          )}

          <button type="submit" className="join-btn" disabled={timer <= 0}>
            Mark My Attendance
          </button>
        </form>
      );
    }

    return (
      <div className="session-pre-start">
        <h3>Active Attendance Session Available</h3>
        <p className="course-title">{mockUserData.currentSession.courseName}</p>
        <p className="instructor">
          Taught by: {mockUserData.currentSession.instructor}
        </p>
        <p className="security-info">
          Clicking the button will lock your screen to ensure attendance
          integrity. Exiting or switching tabs will result in an ABSENT mark.
        </p>
        <button className="join-btn" onClick={handleStartSession}>
          Start Attendance Session
        </button>
      </div>
    );
  };

  return (
    <div className="portal-page-wrapper" ref={portalRef}>
      <Navigation />
      
      <div className="portal-container" style={{ marginTop: "80px", marginBottom: "80px" }}>
        <div className="profile-card">
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

        <div className="content-grid">
          <div className="session-card active">
            {renderSessionCardContent()}
          </div>

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

      <Footer />
    </div>
  );
};

export default InClassStudent;
