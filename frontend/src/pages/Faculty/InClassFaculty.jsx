import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import "./InClassFaculty.css";

// Temporary mock roster (will be replaced by real DB data)
const mockStudentsByCourse = {
  CS401: [
    {
      id: 1,
      name: "Alex Johnson",
      roll_no: "STU101",
      present: false,
      overridden: false,
    },
    {
      id: 2,
      name: "Maria Santos",
      roll_no: "STU102",
      present: false,
      overridden: false,
    },
  ],
  CS305: [
    {
      id: 3,
      name: "David Smith",
      roll_no: "STU201",
      present: false,
      overridden: false,
    },
  ],
};

const InClassFaculty = () => {
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

  // ------------------ STATE VARIABLES ------------------
  const [facultyProfile, setFacultyProfile] = useState(null);
  const [registeredCourses, setRegisteredCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [liveAttendanceList, setLiveAttendanceList] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [timer, setTimer] = useState(0);

  const [isRegistering, setIsRegistering] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [numClasses, setNumClasses] = useState("");
  const [registrationError, setRegistrationError] = useState("");
  const [dashboardMessage, setDashboardMessage] = useState("");

  // ------------------ FUNCTIONS ------------------

  const getCourseRoster = useCallback((courseId) => {
    const mockRoster = mockStudentsByCourse[courseId] || [];
    return mockRoster.map((s) => ({
      ...s,
      present: false,
      overridden: false,
      statusTime: null,
      overrideReason: null,
    }));
  }, []);

  const handleLogout = () => {
    if (activeSession) endSession(true);
    localStorage.removeItem("inclass_token");
    localStorage.removeItem("user_role");
    navigate("/login");
  };

  const handleCourseRegistration = async (e) => {
    e.preventDefault();
    setRegistrationError("");

    const classCount = parseInt(numClasses);
    if (!newCourseCode || !newCourseTitle || classCount < 1) {
      setRegistrationError("Please fill out all fields with valid data.");
      return;
    }

    try {
      const payload = {
        course_code: newCourseCode.toUpperCase(),
        title: newCourseTitle,
        total_classes: classCount,
      };

      const response = await apiClient.post(
        "/faculty/register-course",
        payload
      );
      const newCourse = response.data.course;

      setRegisteredCourses((prev) => [...prev, newCourse]);
      setSelectedCourseId(newCourse.id);
      setNewCourseCode("");
      setNewCourseTitle("");
      setNumClasses("");
      setIsRegistering(false);

      setDashboardMessage(
        `✅ Course ${newCourse.title} registered successfully.`
      );
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        "Failed to register course. Check if code is unique.";
      setRegistrationError(`❌ ${msg}`);
      console.error("Registration Error:", error.response || error);
    }
  };

  const generateSessionCode = async (e) => {
    e.preventDefault();
    if (activeSession || !selectedCourseId) return;

    const currentCourse = registeredCourses.find(
      (c) => c.id === selectedCourseId
    );
    if (!currentCourse) return;

    try {
      const response = await apiClient.post("/faculty/start-session", {
        class_id: selectedCourseId,
      });

      const { code, expires_at } = response.data.session;
      const durationSeconds = Math.floor(
        (new Date(expires_at).getTime() - Date.now()) / 1000
      );

      setActiveSession({
        courseId: selectedCourseId,
        courseName: currentCourse.title,
        code: code,
      });
      setTimer(durationSeconds);
      setDashboardMessage(
        `✅ Session code ${code} is active for ${Math.floor(
          durationSeconds / 60
        )} minutes.`
      );
    } catch (error) {
      console.error("Failed to start session:", error);
      setDashboardMessage("❌ Could not start session. Check logs.");
    }
  };

  const handleManualOverride = (studentId) => {
    setLiveAttendanceList((prev) =>
      prev.map((student) =>
        student.id === studentId
          ? {
              ...student,
              present: !student.present,
              overridden: true,
              statusTime: new Date().toLocaleTimeString(),
            }
          : student
      )
    );
  };

  const endSession = (forceLogout = false) => {
    setActiveSession(null);
    setTimer(0);
    if (!forceLogout) {
      setDashboardMessage(
        "✅ Attendance session ended and saved successfully."
      );
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleViewReport = (courseId) => {
    navigate(`/faculty/reports/${courseId}`);
  };

  // ------------------ USE EFFECTS ------------------

  // 1️⃣ Fetch Faculty Profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/auth/profile");
        console.log("✅ Faculty Profile:", response.data);
        setFacultyProfile(response.data);
      } catch (error) {
        console.error("❌ Failed to fetch profile:", error.response || error);
        setDashboardMessage("❌ Could not load profile. Please log in again.");
        if (error.response?.status === 401 || error.response?.status === 403) {
          handleLogout();
        }
      }
    };
    fetchProfile();
  }, []);

  // 2️⃣ Fetch Registered Courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await apiClient.get("/faculty/my-courses");
        const courses = response.data || [];
        setRegisteredCourses(courses);
        if (courses.length > 0) setSelectedCourseId(courses[0].id);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        setDashboardMessage(
          "❌ Failed to load courses. Session expired or network error."
        );
      }
    };
    fetchCourses();
  }, []);

  // 3️⃣ Load Roster when Course Changes
  useEffect(() => {
    if (selectedCourseId)
      setLiveAttendanceList(getCourseRoster(selectedCourseId));
  }, [selectedCourseId, getCourseRoster]);

  // 4️⃣ Session Timer
  useEffect(() => {
    let interval = null;
    if (activeSession && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0 && activeSession) {
      endSession(true);
    }
    return () => clearInterval(interval);
  }, [activeSession, timer]);

  // ------------------ RENDER SECTION ------------------

  if (!facultyProfile) {
    return (
      <div
        className="portal-page-wrapper"
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <p>Loading Faculty Profile...</p>
      </div>
    );
  }

  const staticFacultyData = {
    name: facultyProfile.name,
    role: facultyProfile.role,
    id: facultyProfile.id,
    department: facultyProfile.department,
    college: facultyProfile.college,
  };

  const currentSelectedCourse = registeredCourses.find(
    (c) => c.id === selectedCourseId
  );
  const studentsInRoster = liveAttendanceList.length;
  const presentCount = liveAttendanceList.filter((s) => s.present).length;

  return (
    <div className="portal-page-wrapper">
      <Navigation />
      
      <div className="portal-container" style={{ marginTop: "80px", marginBottom: "80px" }}>
        {/* Profile Section */}
        <div className="profile-card">
          <div className="profile-info">
            <h2>Hello, {staticFacultyData.name}.</h2>
            <p className="user-details">
              {staticFacultyData.role} | {staticFacultyData.id}
            </p>
            <p className="college-details">
              {staticFacultyData.department}, {staticFacultyData.college}
            </p>
          </div>
          <div className="attendance-summary">
            <p style={{ fontSize: "1.2rem", color: "#10b981" }}>
              Courses Taught: {registeredCourses.length}
            </p>
            <p>Active Course Load</p>
          </div>
        </div>

        {dashboardMessage && (
          <div
            style={{
              padding: "10px",
              textAlign: "center",
              marginBottom: "20px",
              backgroundColor: dashboardMessage.startsWith("✅")
                ? "#e6fff3"
                : "#fce4e4",
              color: dashboardMessage.startsWith("✅") ? "#10b981" : "#c93535",
              borderRadius: "8px",
              fontWeight: 600,
            }}
          >
            {dashboardMessage}
          </div>
        )}

        <div className="content-grid">
          {/* Session Management */}
          <div className={`session-card ${activeSession ? "active" : ""}`}>
            <h3>Attendance Session Management</h3>
            {!activeSession ? (
              <div className="session-controls">
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="course-select"
                  disabled={!!activeSession || registeredCourses.length === 0}
                >
                  <option value="">-- Select Course --</option>
                  {registeredCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} ({course.course_code})
                    </option>
                  ))}
                </select>
                <button
                  className="join-btn"
                  onClick={generateSessionCode}
                  style={{ background: "#10b981" }}
                  disabled={!selectedCourseId || registeredCourses.length === 0}
                >
                  Generate New Session Code
                </button>
                {registeredCourses.length === 0 && (
                  <p style={{ marginTop: "10px", color: "#c93535" }}>
                    Please register a course below to begin.
                  </p>
                )}
              </div>
            ) : (
              <div className="active-session-details">
                <p className="course-title">{activeSession.courseName}</p>
                <p className="code-display">
                  Code:{" "}
                  <span className="highlight-code">{activeSession.code}</span>
                </p>
                <p className="stats-live">
                  Present: {presentCount} / {studentsInRoster} Roster
                </p>
                <div className="timer">
                  <i className="bx bx-time-five" /> Ends in:{" "}
                  <strong>{formatTime(timer)}</strong>
                </div>
                <button
                  className="join-btn"
                  onClick={() => endSession(false)}
                  style={{ background: "#c93535" }}
                >
                  End Session & Submit
                </button>
              </div>
            )}
          </div>

          {/* Attendance / Roster Section */}
          <div className="history-card">
            <h3>
              {activeSession
                ? "Live Attendance Roster"
                : "Course Roster & Stats"}
            </h3>
            <p className="roster-info">
              {currentSelectedCourse?.title || "Select a course"} Roster:{" "}
              {studentsInRoster} students
            </p>
            <ul className="live-attendance-list">
              {liveAttendanceList.length > 0 ? (
                liveAttendanceList.map((student) => (
                  <li
                    key={student.id}
                    className={`attendance-row ${
                      student.present ? "present" : "absent"
                    } ${student.overridden ? "overridden" : ""}`}
                  >
                    <span className="student-name">
                      {student.name} ({student.roll_no})
                    </span>
                    <span
                      className={`status-badge ${
                        student.present ? "present-badge" : "absent-badge"
                      }`}
                    >
                      {student.present
                        ? "PRESENT"
                        : activeSession
                        ? "PENDING"
                        : "N/A"}
                      {student.overridden && " (M)"}
                    </span>
                    {student.statusTime && (
                      <span className="timestamp">@{student.statusTime}</span>
                    )}
                    {activeSession && (
                      <button
                        className={`override-btn ${
                          student.present ? "mark-absent" : "mark-present"
                        }`}
                        onClick={() => handleManualOverride(student.id)}
                        title={student.present ? "Mark Absent" : "Mark Present"}
                      >
                        <i
                          className={`bx ${
                            student.present ? "bx-x-circle" : "bx-check-circle"
                          }`}
                        />
                      </button>
                    )}
                  </li>
                ))
              ) : (
                <li className="empty-roster">
                  No students loaded for this course.
                </li>
              )}
            </ul>

            {!activeSession && currentSelectedCourse && (
              <a
                href="#"
                className="view-link"
                onClick={(e) => {
                  e.preventDefault();
                  handleViewReport(selectedCourseId);
                }}
              >
                View Full Attendance Report (
                {currentSelectedCourse.numClasses || 0} classes total)
                <i className="bx bx-chevron-right"></i>
              </a>
            )}
          </div>
        </div>

        {/* Course Registration Section */}
        <div className="registration-toggle-area">
          <button
            className="register-course-toggle-btn"
            onClick={() => {
              setIsRegistering((prev) => !prev);
              setRegistrationError("");
            }}
            style={{ backgroundColor: isRegistering ? "#c93535" : "#3b82f6" }}
          >
            {isRegistering ? "Cancel Registration" : "Register New Course"}
          </button>

          {isRegistering && (
            <form
              onSubmit={handleCourseRegistration}
              className="register-course-form"
            >
              <h4>Add New Course to Roster</h4>
              {registrationError && (
                <p className="registration-error">{registrationError}</p>
              )}
              <input
                type="text"
                placeholder="Course Code (e.g., CS401)"
                value={newCourseCode}
                onChange={(e) => setNewCourseCode(e.target.value.toUpperCase())}
                className="course-select-dropdown"
                required
              />
              <input
                type="text"
                placeholder="Course Title (e.g., Database Systems)"
                value={newCourseTitle}
                onChange={(e) => setNewCourseTitle(e.target.value)}
                className="course-select-dropdown"
                required
              />
              <input
                type="number"
                placeholder="Total Classes (e.g., 40)"
                value={numClasses}
                onChange={(e) => setNumClasses(e.target.value)}
                className="num-classes-input"
                min="1"
                required
              />
              <button
                type="submit"
                className="confirm-register-btn"
                disabled={!newCourseCode || !newCourseTitle || numClasses < 1}
              >
                Finalize Course Registration
              </button>
            </form>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default InClassFaculty;
