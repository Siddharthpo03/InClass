import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient"; // 🚨 IMPORT API CLIENT 🚨
import styles from "./InClassStudent.module.css";

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
  const portalRef = useRef(null);
  const intervalRef = useRef(null);

  const [sessionCode, setSessionCode] = useState("");
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionMessage, setSessionMessage] = useState("");
  const [timer, setTimer] = useState(0);

  const classNames = (...classes) =>
    classes
      .flat()
      .filter(Boolean)
      .map((cls) => styles[cls] || cls)
      .join(" ")
      .trim();

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
        <div className={classNames("session-inactive")}>
          <h3>No Active Attendance Session</h3>
          <p>Please check back at the scheduled class time.</p>
        </div>
      );
    }

    if (isAttendanceMarked) {
      return (
        <div className={classNames("session-marked")}>
          <h3>Attendance Status</h3>
          <p className={classNames("course-title")}>
            {mockUserData.currentSession.courseName}
          </p>
          <div className={classNames("marked-status")}>
            <i className={classNames("bx bx-check-circle")} />
            <span>Attendance Marked!</span>
          </div>
          <p className={classNames("marked-time")}>You are recorded as PRESENT.</p>
          <p className={classNames("session-message success")}>{sessionMessage}</p>
        </div>
      );
    }

    if (isSessionActive) {
      return (
        <form onSubmit={handleCodeSubmit} className={classNames("secure-form")}>
          <h3>Enter Secure Attendance Code</h3>
          <p className={classNames("course-title")}>
            {mockUserData.currentSession.courseName}
          </p>
          <p className={classNames("security-note")}>
            ⚠️ **DO NOT** switch tabs or exit fullscreen until submitted.
          </p>
          <div className={classNames("timer")}>
            <i className={classNames("bx bx-time-five")} />
            Time Remaining:{" "}
            {`${Math.floor(timer / 60)}:${("0" + (timer % 60)).slice(-2)}`}
          </div>

          <input
            type="text"
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
            placeholder="ENTER 6-DIGIT CODE"
            className={classNames("session-code-input")}
            maxLength="6"
            required
          />

          {sessionMessage && (
            <p
              className={classNames(
                "session-message",
                sessionMessage.startsWith("✅") ? "success" : "error"
              )}
            >
              {sessionMessage}
            </p>
          )}

          <button type="submit" className={classNames("join-btn")} disabled={timer <= 0}>
            Mark My Attendance
          </button>
        </form>
      );
    }

    return (
      <div className={classNames("session-pre-start")}>
        <h3>Active Attendance Session Available</h3>
        <p className={classNames("course-title")}>{mockUserData.currentSession.courseName}</p>
        <p className={classNames("instructor")}>
          Taught by: {mockUserData.currentSession.instructor}
        </p>
        <p className={classNames("security-info")}>
          Clicking the button will lock your screen to ensure attendance
          integrity. Exiting or switching tabs will result in an ABSENT mark.
        </p>
        <button className={classNames("join-btn")} onClick={handleStartSession}>
          Start Attendance Session
        </button>
      </div>
    );
  };

  return (
    <div className={classNames("portal-page-wrapper")} ref={portalRef}>
      <header className={classNames("portal-header")}>
        <div className={classNames("header-left")}>
          <span className={classNames("brand-name")}>InClass Student Portal</span>
        </div>
        <div className={classNames("header-right")}>
          <button
            className={classNames("logout-btn")}
            onClick={handleLogout}
            disabled={isSessionActive}
          >
            <i className={classNames("bx bx-log-out")} /> Logout
          </button>
        </div>
      </header>

      <div className={classNames("portal-container")}>
        <div className={classNames("profile-card")}>
          <div className={classNames("profile-info")}>
            <h2>Welcome back, {mockUserData.name}!</h2>
            <p className={classNames("user-details")}>
              {mockUserData.role} | {mockUserData.id}
            </p>
            <p className={classNames("college-details")}>
              {mockUserData.department}, {mockUserData.college}
            </p>
          </div>
          <div className={classNames("attendance-summary")}>
            <div className={classNames("attendance-circle")}>
              <span className={classNames("percentage-text")}>
                {mockUserData.attendancePercentage}%
              </span>
            </div>
            <p>Overall Attendance</p>
          </div>
        </div>

        <div className={classNames("content-grid")}>
          <div className={classNames("session-card active")}>
            {renderSessionCardContent()}
          </div>

          <div className={classNames("history-card")}>
            <h3>Recent Attendance History</h3>
            <ul className={classNames("history-list")}>
              {mockUserData.attendanceHistory.map((item, index) => (
                <li
                  key={index}
                  className={classNames(
                    "history-item",
                    item.status.toLowerCase()
                  )}
                >
                  <span className={classNames("history-date")}>{item.date}</span>
                  <span className={classNames("history-course")}>{item.course}</span>
                  <span className={classNames("history-status")}>{item.status}</span>
                </li>
              ))}
            </ul>
            <a href="#" className={classNames("view-all-link")}>
              View Full Report <i className={classNames("bx bx-chevron-right")}></i>
            </a>
          </div>
        </div>
      </div>

      <footer className={classNames("portal-footer")}>
        <p>&copy; 2025 InClass | Made for Smart Campus</p>
      </footer>
    </div>
  );
};

export default InClassStudent;
