import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import styles from "./InClassFaculty.module.css";

const InClassFaculty = () => {
  const navigate = useNavigate();

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

  // State variables
  const [facultyProfile, setFacultyProfile] = useState(null);
  const [registeredCourses, setRegisteredCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [liveAttendanceList, setLiveAttendanceList] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(true);
  const autoLogoutRef = useRef(null);
  
  // Auto-logout timer (10 minutes for faculty during active session)
  const FACULTY_AUTO_LOGOUT_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

  const [isRegistering, setIsRegistering] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [numClasses, setNumClasses] = useState("");
  const [registrationError, setRegistrationError] = useState("");
  const [dashboardMessage, setDashboardMessage] = useState("");
  const [pendingStudents, setPendingStudents] = useState([]);
  const [showPendingStudents, setShowPendingStudents] = useState(false);

  const classNames = (...classes) =>
    classes
      .flat()
      .filter(Boolean)
      .map((cls) => styles[cls] || cls)
      .join(" ")
      .trim();

  // Fetch course roster from API
  const getCourseRoster = useCallback(async (courseId) => {
    try {
      const response = await apiClient.get(`/faculty/course-roster/${courseId}`);
      const roster = response.data.roster || [];
      return roster.map((s) => ({
        id: s.id || s.student_id,
        name: s.name,
        roll_no: s.roll_no,
      present: false,
      overridden: false,
      statusTime: null,
      overrideReason: null,
    }));
    } catch (error) {
      console.error("Failed to fetch roster:", error);
      return [];
    }
  }, []);

  const handleLogout = () => {
    // Clear auto-logout timer
    if (autoLogoutRef.current) {
      clearTimeout(autoLogoutRef.current);
      autoLogoutRef.current = null;
    }
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

      const response = await apiClient.post("/faculty/register-course", payload);
      const newCourse = response.data.course;

      setRegisteredCourses((prev) => [...prev, newCourse]);
      setSelectedCourseId(newCourse.id);
      setNewCourseCode("");
      setNewCourseTitle("");
      setNumClasses("");
      setIsRegistering(false);

      setDashboardMessage(`✅ Course ${newCourse.title} registered successfully.`);
      setTimeout(() => setDashboardMessage(""), 5000);
    } catch (error) {
      const msg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to register course. Check if code is unique.";
      setRegistrationError(`❌ ${msg}`);
      console.error("Registration Error:", error.response || error);
    }
  };

  const generateSessionCode = async (e) => {
    e.preventDefault();
    if (activeSession || !selectedCourseId) return;

    const currentCourse = registeredCourses.find((c) => c.id === selectedCourseId);
    if (!currentCourse) return;

    try {
      const response = await apiClient.post("/faculty/start-session", {
        class_id: selectedCourseId,
      });

      const { id, code, expires_at } = response.data.session;
      const durationSeconds = Math.floor(
        (new Date(expires_at).getTime() - Date.now()) / 1000
      );

      setActiveSession({
        id: id,
        sessionId: id,
        courseId: selectedCourseId,
        courseName: currentCourse.title,
        code: code,
      });
      setTimer(durationSeconds);
      setDashboardMessage(
        `✅ Session code ${code} is active for ${Math.floor(durationSeconds / 60)} minutes.`
      );
      setTimeout(() => setDashboardMessage(""), 5000);
    } catch (error) {
      console.error("Failed to start session:", error);
      setDashboardMessage("❌ Could not start session. Please try again.");
      setTimeout(() => setDashboardMessage(""), 5000);
    }
  };

  const handleManualOverride = async (studentId) => {
    if (!activeSession) return;

    const student = liveAttendanceList.find((s) => s.id === studentId);
    if (!student) return;

    const reason = prompt(
      `Enter reason for manually marking ${student.name} as ${student.present ? "Absent" : "Present"}:`
    );
    if (!reason) return;

    try {
      const response = await apiClient.post("/faculty/manual-attendance", {
        student_id: studentId,
        session_id: activeSession.sessionId || activeSession.id,
        reason: reason,
      });

    setLiveAttendanceList((prev) =>
        prev.map((s) =>
          s.id === studentId
          ? {
                ...s,
                present: !s.present,
              overridden: true,
              statusTime: new Date().toLocaleTimeString(),
                overrideReason: reason,
              }
            : s
        )
      );

      setDashboardMessage(`✅ Attendance manually updated for ${student.name}.`);
      setTimeout(() => setDashboardMessage(""), 5000);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to update attendance.";
      setDashboardMessage(`❌ ${errorMessage}`);
      setTimeout(() => setDashboardMessage(""), 5000);
    }
  };

  const handleDuplicateDetection = async () => {
    if (!activeSession) return;

    if (!confirm("This will check for duplicate submissions and remove all attendance if duplicates are found. Continue?")) {
      return;
    }

    try {
      const response = await apiClient.post("/reports/duplicate-detection", {
        session_id: activeSession.sessionId || activeSession.id,
      });

      if (response.data.duplicatesFound > 0) {
        alert(`⚠️ ${response.data.duplicatesFound} duplicate(s) detected and removed. Please restart the attendance session.`);
        endSession(false);
        // Reload roster
        const roster = await getCourseRoster(selectedCourseId);
        setLiveAttendanceList(roster);
      } else {
        alert("✅ No duplicates detected.");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to check for duplicates.";
      alert(`❌ ${errorMessage}`);
    }
  };

  const endSession = (forceLogout = false) => {
    setActiveSession(null);
    setTimer(0);
    if (!forceLogout) {
      setDashboardMessage("✅ Attendance session ended and saved successfully.");
      setTimeout(() => setDashboardMessage(""), 5000);
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

  // Fetch Faculty Profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/auth/profile");
        console.log("📋 Profile response:", response.data);
        setFacultyProfile(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          handleLogout();
        }
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Fetch Registered Courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await apiClient.get("/faculty/my-courses");
        const courses = response.data || [];
        setRegisteredCourses(courses);
        if (courses.length > 0) setSelectedCourseId(courses[0].id);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        setDashboardMessage("❌ Failed to load courses. Please refresh the page.");
        setTimeout(() => setDashboardMessage(""), 5000);
      }
    };
    fetchCourses();
  }, []);

  // Fetch Pending Students
  useEffect(() => {
    const fetchPendingStudents = async () => {
      try {
        const response = await apiClient.get("/faculty/pending-students");
        setPendingStudents(response.data.pendingStudents || []);
      } catch (error) {
        console.error("Failed to fetch pending students:", error);
      }
    };
    fetchPendingStudents();
    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingStudents, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle approve/reject student
  const handleStudentAction = async (pendingId, action, notes = "") => {
    try {
      const endpoint = action === "approve" ? "approve" : "reject";
      await apiClient.post(`/faculty/pending-students/${pendingId}/${endpoint}`, { notes });
      setDashboardMessage(`✅ Student ${action === "approve" ? "approved" : "rejected"} successfully.`);
      setTimeout(() => setDashboardMessage(""), 5000);
      
      // Refresh pending students list
      const response = await apiClient.get("/faculty/pending-students");
      setPendingStudents(response.data.pendingStudents || []);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to process request.";
      setDashboardMessage(`❌ ${errorMessage}`);
      setTimeout(() => setDashboardMessage(""), 5000);
    }
  };

  // Load Roster when Course Changes
  useEffect(() => {
    const loadRoster = async () => {
      if (selectedCourseId) {
        const roster = await getCourseRoster(selectedCourseId);
        setLiveAttendanceList(roster);
      }
    };
    loadRoster();
  }, [selectedCourseId, getCourseRoster]);

  // Session Timer
  useEffect(() => {
    let interval = null;
    if (activeSession && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0 && activeSession) {
      endSession(false);
    }
    return () => clearInterval(interval);
  }, [activeSession, timer]);

  // Auto-logout timer: 10 minutes for faculty during active attendance session
  useEffect(() => {
    if (activeSession) {
      // Start auto-logout timer
      autoLogoutRef.current = setTimeout(() => {
        handleLogout();
        alert("Session expired. You have been logged out for security.");
      }, FACULTY_AUTO_LOGOUT_TIME);
    } else {
      // Clear timer if session ends
      if (autoLogoutRef.current) {
        clearTimeout(autoLogoutRef.current);
        autoLogoutRef.current = null;
      }
    }

    return () => {
      if (autoLogoutRef.current) {
        clearTimeout(autoLogoutRef.current);
        autoLogoutRef.current = null;
      }
    };
  }, [activeSession]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!facultyProfile) {
    return (
      <div className={styles.errorContainer}>
        <p>Failed to load profile. Please try again.</p>
        <button onClick={() => navigate("/login")}>Go to Login</button>
      </div>
    );
  }

  const currentSelectedCourse = registeredCourses.find((c) => c.id === selectedCourseId);
  const studentsInRoster = liveAttendanceList.length;
  const presentCount = liveAttendanceList.filter((s) => s.present).length;
  const absentCount = studentsInRoster - presentCount;

  return (
    <div className={styles.dashboardWrapper}>
      <Navigation />

      <div className={styles.dashboardContainer}>
        {/* Header Section */}
        <header className={styles.dashboardHeader}>
          <div className={styles.headerContent}>
            <div className={styles.welcomeSection}>
              <h1 className={styles.welcomeTitle}>Welcome, {facultyProfile.name}!</h1>
              <p className={styles.welcomeSubtitle}>
                {facultyProfile.role} • {facultyProfile.id || "N/A"}
              </p>
              <p className={styles.welcomeDetails}>
                {facultyProfile.department || "N/A"} • {facultyProfile.college || "Tech University"}
              </p>
            </div>
            <div className={styles.headerActions}>
              <div className={styles.coursesBadge}>
                <div className={styles.badgeCircle}>
                  <span className={styles.badgeValue}>{registeredCourses.length}</span>
                </div>
                <p className={styles.badgeLabel}>Courses</p>
        </div>
              <button className={styles.logoutButton} onClick={handleLogout} title="Logout">
                <i className="bx bx-log-out"></i>
                <span>Logout</span>
          </button>
            </div>
        </div>
      </header>


        {/* Dashboard Message */}
        {dashboardMessage && (
          <div
            className={`${styles.messageBox} ${
              dashboardMessage.startsWith("✅") ? styles.messageSuccess : styles.messageError
            }`}
          >
            {dashboardMessage}
          </div>
        )}

        {/* Pending Students Section */}
        {pendingStudents.length > 0 && (
          <section className={styles.pendingStudentsSection}>
            <div className={styles.pendingStudentsCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <i className="bx bx-user-check"></i>
                  Pending Student Approvals
                  <span className={styles.badgeCount}>{pendingStudents.length}</span>
                </h2>
                <button
                  className={styles.toggleButton}
                  onClick={() => setShowPendingStudents(!showPendingStudents)}
                >
                  {showPendingStudents ? (
                    <>
                      <i className="bx bx-chevron-up"></i> Hide
                    </>
                  ) : (
                    <>
                      <i className="bx bx-chevron-down"></i> Show
                    </>
                  )}
                </button>
              </div>

              {showPendingStudents && (
                <div className={styles.cardBody}>
                  <div className={styles.pendingList}>
                    {pendingStudents.map((pending) => (
                      <div key={pending.pendingId} className={styles.pendingItem}>
                        <div className={styles.studentInfo}>
                          {pending.student.passportPhotoUrl && (
                            <img
                              src={`http://localhost:4000${pending.student.passportPhotoUrl}`}
                              alt={pending.student.name}
                              className={styles.studentPhoto}
                            />
                          )}
                          <div className={styles.studentDetails}>
                            <h3>{pending.student.name}</h3>
                            <p>
                              <i className="bx bx-envelope"></i> {pending.student.email}
                            </p>
                            <p>
                              <i className="bx bx-id-card"></i> {pending.student.rollNo}
                            </p>
                            <p>
                              <i className="bx bx-building"></i> {pending.student.college}
                            </p>
                            <p>
                              <i className="bx bx-phone"></i> {pending.student.countryCode} {pending.student.mobileNumber}
                            </p>
                            <p className={styles.requestDate}>
                              Requested: {new Date(pending.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className={styles.pendingActions}>
                          <button
                            className={styles.approveButton}
                            onClick={() => {
                              const notes = prompt("Add approval notes (optional):");
                              if (notes !== null) {
                                handleStudentAction(pending.pendingId, "approve", notes);
                              }
                            }}
                          >
                            <i className="bx bx-check"></i>
                            Approve
                          </button>
                          <button
                            className={styles.rejectButton}
                            onClick={() => {
                              const notes = prompt("Add rejection reason (optional):");
                              if (notes !== null) {
                                handleStudentAction(pending.pendingId, "reject", notes);
                              }
                            }}
                          >
                            <i className="bx bx-x"></i>
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Stats Cards Section */}
        <section className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <i className="bx bx-book"></i>
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statValue}>{registeredCourses.length}</h3>
                <p className={styles.statLabel}>Total Courses</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconPresent}`}>
                <i className="bx bx-check-circle"></i>
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statValue}>{presentCount}</h3>
                <p className={styles.statLabel}>Present</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconAbsent}`}>
                <i className="bx bx-x-circle"></i>
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statValue}>{absentCount}</h3>
                <p className={styles.statLabel}>Absent</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconTotal}`}>
                <i className="bx bx-group"></i>
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statValue}>{studentsInRoster}</h3>
                <p className={styles.statLabel}>Total Students</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className={styles.mainContent}>
          <div className={styles.contentGrid}>
            {/* Session Management Card */}
            <div className={styles.sessionCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <i className="bx bx-calendar-check"></i>
                  Attendance Session
                </h2>
                {activeSession && <span className={styles.activeBadge}>Active</span>}
              </div>

              <div className={styles.cardBody}>
            {!activeSession ? (
                  <div className={styles.sessionControls}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Select Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                        className={styles.courseSelect}
                        disabled={registeredCourses.length === 0}
                >
                  <option value="">-- Select Course --</option>
                  {registeredCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} ({course.course_code})
                    </option>
                  ))}
                </select>
                    </div>

                    {registeredCourses.length === 0 ? (
                      <div className={styles.emptyState}>
                        <i className="bx bx-info-circle"></i>
                        <p>Please register a course to begin</p>
                      </div>
                    ) : (
                <button
                        className={styles.startButton}
                  onClick={generateSessionCode}
                        disabled={!selectedCourseId}
                >
                        <i className="bx bx-play-circle"></i>
                        Generate Session Code
                </button>
                )}
              </div>
            ) : (
                  <div className={styles.activeSession}>
                    <div className={styles.sessionInfo}>
                      <h3 className={styles.sessionCourseName}>{activeSession.courseName}</h3>
                      <div className={styles.codeDisplay}>
                        <span className={styles.codeLabel}>Session Code:</span>
                        <span className={styles.codeValue}>{activeSession.code}</span>
                      </div>
                    </div>

                    <div className={styles.sessionStats}>
                      <div className={styles.statItem}>
                        <span className={styles.statItemValue}>{presentCount}</span>
                        <span className={styles.statItemLabel}>Present</span>
                      </div>
                      <div className={styles.statDivider}></div>
                      <div className={styles.statItem}>
                        <span className={styles.statItemValue}>{studentsInRoster}</span>
                        <span className={styles.statItemLabel}>Total</span>
                      </div>
                    </div>

                    <div className={styles.timerDisplay}>
                      <i className="bx bx-time-five"></i>
                      <span>Time Remaining: {formatTime(timer)}</span>
                </div>

                    <div className={styles.sessionActions}>
                <button
                        className={styles.duplicateButton}
                        onClick={handleDuplicateDetection}
                        title="Check for duplicate submissions (Use Case 05)"
                      >
                        <i className="bx bx-error-circle"></i>
                        Check Duplicates
                      </button>
                      <button className={styles.endButton} onClick={() => endSession(false)}>
                        <i className="bx bx-stop-circle"></i>
                        End Session
                </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Roster Card */}
            <div className={styles.rosterCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <i className="bx bx-list-ul"></i>
                  {activeSession ? "Live Attendance" : "Course Roster"}
                </h2>
                {currentSelectedCourse && (
                  <span className={styles.rosterCount}>{studentsInRoster} students</span>
            )}
          </div>

              <div className={styles.cardBody}>
                {!currentSelectedCourse ? (
                  <div className={styles.emptyState}>
                    <i className="bx bx-inbox"></i>
                    <p>Select a course to view roster</p>
                  </div>
                ) : liveAttendanceList.length === 0 ? (
                  <div className={styles.emptyState}>
                    <i className="bx bx-user-x"></i>
                    <p>No students enrolled in this course</p>
                  </div>
                ) : (
                  <>
                    <div className={styles.rosterList}>
                      {liveAttendanceList.map((student) => (
                        <div
                    key={student.id}
                          className={`${styles.rosterItem} ${
                            student.present ? styles.rosterPresent : styles.rosterAbsent
                          } ${student.overridden ? styles.rosterOverridden : ""}`}
                        >
                          <div className={styles.studentInfo}>
                            <span className={styles.studentName}>{student.name}</span>
                            <span className={styles.studentRoll}>{student.roll_no}</span>
                          </div>
                          <div className={styles.studentStatus}>
                    <span
                              className={`${styles.statusBadge} ${
                                student.present ? styles.badgePresent : styles.badgeAbsent
                      }`}
                    >
                      {student.present
                        ? "PRESENT"
                        : activeSession
                        ? "PENDING"
                        : "N/A"}
                              {student.overridden && (
                                <i className="bx bx-edit" title="Manually Overridden"></i>
                              )}
                    </span>
                    {student.statusTime && (
                              <span className={styles.statusTime}>{student.statusTime}</span>
                    )}
                          </div>
                    {activeSession && (
                      <button
                              className={`${styles.overrideButton} ${
                                student.present ? styles.overrideAbsent : styles.overridePresent
                        }`}
                        onClick={() => handleManualOverride(student.id)}
                        title={student.present ? "Mark Absent" : "Mark Present"}
                      >
                        <i
                          className={`bx ${
                                  student.present ? "bx-x" : "bx-check"
                                }`}
                              ></i>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {!activeSession && currentSelectedCourse && (
                      <button
                        className={styles.viewReportButton}
                        onClick={() => handleViewReport(selectedCourseId)}
                      >
                        <i className="bx bx-bar-chart-alt-2"></i>
                        View Full Report
                      </button>
                    )}
                  </>
            )}
          </div>
        </div>
          </div>
        </section>

        {/* Course Registration Section */}
        <section className={styles.registrationSection}>
          <div className={styles.registrationCard}>
            <div className={styles.registrationHeader}>
              <h2 className={styles.cardTitle}>
                <i className="bx bx-plus-circle"></i>
                Course Management
              </h2>
          <button
                className={styles.toggleButton}
            onClick={() => {
              setIsRegistering((prev) => !prev);
              setRegistrationError("");
            }}
              >
                {isRegistering ? (
                  <>
                    <i className="bx bx-x"></i> Cancel
                  </>
                ) : (
                  <>
                    <i className="bx bx-plus"></i> Register New Course
                  </>
                )}
          </button>
            </div>

          {isRegistering && (
              <form onSubmit={handleCourseRegistration} className={styles.registrationForm}>
              {registrationError && (
                  <div className={styles.registrationError}>{registrationError}</div>
              )}

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Course Code</label>
              <input
                type="text"
                      placeholder="e.g., CS401"
                value={newCourseCode}
                onChange={(e) => setNewCourseCode(e.target.value.toUpperCase())}
                      className={styles.formInput}
                required
              />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Course Title</label>
              <input
                type="text"
                      placeholder="e.g., Database Systems"
                value={newCourseTitle}
                onChange={(e) => setNewCourseTitle(e.target.value)}
                      className={styles.formInput}
                required
              />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Total Classes</label>
              <input
                type="number"
                      placeholder="e.g., 40"
                value={numClasses}
                onChange={(e) => setNumClasses(e.target.value)}
                      className={styles.formInput}
                min="1"
                required
              />
                  </div>
                </div>

              <button
                type="submit"
                  className={styles.submitButton}
                  disabled={!newCourseCode || !newCourseTitle || parseInt(numClasses) < 1}
              >
                  <i className="bx bx-check"></i>
                  Register Course
              </button>
            </form>
          )}
        </div>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default InClassFaculty;
