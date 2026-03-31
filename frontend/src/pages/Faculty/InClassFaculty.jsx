import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import TopNav from "../../components/faculty/TopNav";
import Sidebar from "../../components/faculty/Sidebar";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ToastContainer from "../../components/shared/ToastContainer";
import StatCard from "../../components/shared/StatCard";
import Modal from "../../components/shared/Modal";
import PendingCourseRegistrations from "../../components/faculty/PendingCourseRegistrations";
import useFacultySocket from "../../hooks/useFacultySocket";
import styles from "./InClassFaculty.module.css";

const MOCK_FACULTY_PROFILE = {
  userId: 0,
  id: 0,
  name: "Preview Faculty",
  email: "preview@test.com",
  role: "faculty",
  college_id: 1,
  department_id: 1,
};

const InClassFaculty = ({ previewMode = false }) => {
  const navigate = useNavigate();

  // Initialize dark mode
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const shouldBeDark =
      savedDarkMode !== null ? savedDarkMode === "true" : prefersDark;
    if (shouldBeDark) {
      document.body.classList.add("darkMode");
    } else {
      document.body.classList.remove("darkMode");
    }
  }, []);

  // State variables
  const [facultyProfile, setFacultyProfile] = useState(previewMode ? MOCK_FACULTY_PROFILE : null);
  const [registeredCourses, setRegisteredCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [liveAttendanceList, setLiveAttendanceList] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(!previewMode);
  const autoLogoutRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-logout timer (10 minutes for faculty during active session)
  const FACULTY_AUTO_LOGOUT_TIME = 10 * 60 * 1000; // 10 minutes in milliseconds

  const [isRegistering, setIsRegistering] = useState(false);
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [numClasses, setNumClasses] = useState("");
  const [registrationError, setRegistrationError] = useState("");
  const [pendingStudents, setPendingStudents] = useState([]);
  const [showPendingStudents, setShowPendingStudents] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, show: true }]);
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch course roster from API
  const getCourseRoster = useCallback(async (courseId) => {
    try {
      const response = await apiClient.get(
        `/faculty/course-roster/${courseId}`
      );
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

  const handleLogout = useCallback(() => {
    // Clear auto-logout timer
    if (autoLogoutRef.current) {
      clearTimeout(autoLogoutRef.current);
      autoLogoutRef.current = null;
    }
    if (activeSession) endSession(true);
    localStorage.removeItem("inclass_token");
    localStorage.removeItem("user_role");
    navigate("/login");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- endSession defined below
  }, [activeSession, navigate]);

  const handleCourseRegistration = useCallback(
    async (e) => {
      e.preventDefault();
      setRegistrationError("");

      const classCount = parseInt(numClasses);
      if (!newCourseCode || !newCourseTitle || classCount < 1) {
        setRegistrationError("Please fill out all fields with valid data.");
        showToast("Please fill out all fields with valid data.", "error");
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

        showToast(
          `Course ${newCourse.title} registered successfully.`,
          "success"
        );
      } catch (error) {
        const msg =
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          "Failed to register course. Check if code is unique.";
        setRegistrationError(msg);
        showToast(msg, "error");
        console.error("Registration Error:", error.response || error);
      }
    },
    [newCourseCode, newCourseTitle, numClasses, showToast]
  );

  const generateSessionCode = useCallback(
    async (e) => {
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

        const { id, code, expires_at } = response.data.session;
        const durationSeconds = Math.floor(
          (new Date(expires_at).getTime() - Date.now()) / 1000
        );

        const sessionData = {
          id: id,
          sessionId: id,
          courseId: selectedCourseId,
          courseName: currentCourse.title,
          code: code,
          expires_at: expires_at,
          started_at: new Date().toISOString(),
        };
        setActiveSession(sessionData);
        setTimer(durationSeconds);

        // Persist to localStorage
        localStorage.setItem("activeSession", JSON.stringify(sessionData));
        localStorage.setItem("sessionTimer", durationSeconds.toString());
        localStorage.setItem("sessionStartTime", Date.now().toString());

        showToast(
          `Session code ${code} is active for ${Math.floor(
            durationSeconds / 60
          )} minutes.`,
          "success"
        );
      } catch (error) {
        console.error("Failed to start session:", error);
        showToast("Could not start session. Please try again.", "error");
      }
    },
    [activeSession, selectedCourseId, registeredCourses, showToast]
  );

  const handleManualOverride = useCallback(
    async (studentId) => {
      if (!activeSession) return;

      const student = liveAttendanceList.find((s) => s.id === studentId);
      if (!student) return;

      const reason = prompt(
        `Enter reason for manually marking ${student.name} as ${
          student.present ? "Absent" : "Present"
        }:`
      );
      if (!reason) return;

      try {
        await apiClient.post("/faculty/manual-attendance", {
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

        showToast(
          `Attendance manually updated for ${student.name}.`,
          "success"
        );
      } catch (error) {
        const errorMessage =
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          "Failed to update attendance.";
        showToast(errorMessage, "error");
      }
    },
    [activeSession, liveAttendanceList, showToast]
  );

  const handleDuplicateDetection = useCallback(async () => {
    if (!activeSession) return;

    if (
      !confirm(
        "This will check for duplicate submissions and remove all attendance if duplicates are found. Continue?"
      )
    ) {
      return;
    }

    try {
      const response = await apiClient.post("/reports/duplicate-detection", {
        session_id: activeSession.sessionId || activeSession.id,
      });

      if (response.data.duplicatesFound > 0) {
        showToast(
          `${response.data.duplicatesFound} duplicate(s) detected and removed. Please restart the attendance session.`,
          "warning"
        );
        endSession(false);
        // Reload roster
        const roster = await getCourseRoster(selectedCourseId);
        setLiveAttendanceList(roster);
      } else {
        showToast("No duplicates detected.", "success");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to check for duplicates.";
      showToast(errorMessage, "error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- endSession defined below, omit to avoid circular deps
  }, [activeSession, selectedCourseId, getCourseRoster, showToast]);

  const endSession = useCallback(
    async (forceLogout = false) => {
      // End session on backend if session ID exists
      if (activeSession?.id) {
        try {
          await apiClient.post(`/faculty/sessions/${activeSession.id}/end`);
        } catch (error) {
          console.error("Failed to end session on backend:", error);
          // Continue with local cleanup even if backend call fails
        }
      }

      setActiveSession(null);
      setTimer(0);
      // Clear from localStorage
      localStorage.removeItem("activeSession");
      localStorage.removeItem("sessionTimer");
      localStorage.removeItem("sessionStartTime");
      if (!forceLogout) {
        showToast(
          "Attendance session ended and saved successfully.",
          "success"
        );
      }
    },
    [activeSession, showToast]
  );

  const formatTime = useCallback((seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  const handleViewReport = useCallback(
    (courseId) => {
      navigate(`/faculty/reports/${courseId}`);
    },
    [navigate]
  );

  // Fetch Faculty Profile (skip when preview mode)
  useEffect(() => {
    if (previewMode) {
      setFacultyProfile(MOCK_FACULTY_PROFILE);
      setLoading(false);
      return;
    }
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
  }, [handleLogout, previewMode]);

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
        showToast("Failed to load courses. Please refresh the page.", "error");
      }
    };
    fetchCourses();
  }, [showToast]);

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
  const handleStudentAction = useCallback(
    async (pendingId, action, notes = "") => {
      try {
        const endpoint = action === "approve" ? "approve" : "reject";
        await apiClient.post(
          `/faculty/pending-students/${pendingId}/${endpoint}`,
          {
            notes,
          }
        );
        showToast(
          `Student ${
            action === "approve" ? "approved" : "rejected"
          } successfully.`,
          "success"
        );

        // Refresh pending students list
        const response = await apiClient.get("/faculty/pending-students");
        setPendingStudents(response.data.pendingStudents || []);
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to process request.";
        showToast(errorMessage, "error");
      }
    },
    [showToast]
  );

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

  // Restore session from localStorage on mount (for page refresh)
  // Session persists across navigation - no need to clear on route change
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedSession = localStorage.getItem("activeSession");
        const savedTimer = localStorage.getItem("sessionTimer");
        const sessionStartTime = localStorage.getItem("sessionStartTime");

        if (savedSession && savedTimer && sessionStartTime) {
          const sessionData = JSON.parse(savedSession);
          const elapsed = Math.floor(
            (Date.now() - parseInt(sessionStartTime)) / 1000
          );
          const remainingTime = parseInt(savedTimer) - elapsed;

          if (remainingTime > 0) {
            // Verify session is still active on backend
            try {
              const response = await apiClient.get(
                `/faculty/sessions/${sessionData.id}`
              );
              if (
                response.data &&
                response.data.is_active &&
                new Date(response.data.expires_at) > new Date()
              ) {
                setActiveSession(sessionData);
                setTimer(remainingTime);
                // Don't show toast on restore - user might be navigating
              } else {
                // Session expired on backend
                localStorage.removeItem("activeSession");
                localStorage.removeItem("sessionTimer");
                localStorage.removeItem("sessionStartTime");
              }
            } catch {
              // Session not found or expired - clear it
              localStorage.removeItem("activeSession");
              localStorage.removeItem("sessionTimer");
              localStorage.removeItem("sessionStartTime");
            }
          } else {
            // Timer expired
            localStorage.removeItem("activeSession");
            localStorage.removeItem("sessionTimer");
            localStorage.removeItem("sessionStartTime");
          }
        }
      } catch (err) {
        console.error("Failed to restore session:", err);
        localStorage.removeItem("activeSession");
        localStorage.removeItem("sessionTimer");
        localStorage.removeItem("sessionStartTime");
      }
    };

    restoreSession();
  }, []); // Only run on mount

  // End session on page refresh/close (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeSession && activeSession.id) {
        // Use fetch with keepalive for reliable delivery during page unload
        const url = `/api/faculty/sessions/${activeSession.id}/end`;
        fetch(url, {
          method: "POST",
          keepalive: true,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }).catch(() => {
          // Ignore errors - page is unloading
        });
        // Clear localStorage
        localStorage.removeItem("activeSession");
        localStorage.removeItem("sessionTimer");
        localStorage.removeItem("sessionStartTime");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [activeSession]);

  // Session Timer
  useEffect(() => {
    let interval = null;
    if (activeSession && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          const newTime = prev - 1;
          // Update localStorage
          if (newTime > 0) {
            localStorage.setItem("sessionTimer", newTime.toString());
          }
          return newTime;
        });
      }, 1000);
    } else if (timer === 0 && activeSession) {
      endSession(false);
    }
    return () => clearInterval(interval);
  }, [activeSession, timer, endSession]);

  // Auto-logout timer: 10 minutes for faculty during active attendance session
  useEffect(() => {
    if (activeSession) {
      // Start auto-logout timer
      autoLogoutRef.current = setTimeout(() => {
        handleLogout();
        showToast(
          "Session expired. You have been logged out for security.",
          "warning"
        );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- FACULTY_AUTO_LOGOUT_TIME is constant
  }, [activeSession, handleLogout, showToast]);

  // Mobile sidebar toggle
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Socket handlers for real-time events
  const handleRegistrationCreated = useCallback(
    (data) => {
      console.log("New registration request:", data);
      showToast(
        `New course registration request from ${
          data.studentName || data.student_name
        }`,
        "info"
      );
    },
    [showToast]
  );

  // Initialize faculty socket
  useFacultySocket({
    facultyId: facultyProfile?.userId || facultyProfile?.id,
    collegeId: facultyProfile?.college_id,
    departmentId: facultyProfile?.department_id,
    onRegistrationCreated: handleRegistrationCreated,
    enabled: !!facultyProfile?.id,
  });

  // Memoized stats
  const stats = useMemo(() => {
    const studentsInRoster = liveAttendanceList.length;
    const presentCount = liveAttendanceList.filter((s) => s.present).length;
    const absentCount = studentsInRoster - presentCount;
    return { studentsInRoster, presentCount, absentCount };
  }, [liveAttendanceList]);

  const currentSelectedCourse = useMemo(
    () => registeredCourses.find((c) => c.id === selectedCourseId),
    [registeredCourses, selectedCourseId]
  );

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading your dashboard..." />;
  }

  if (!facultyProfile) {
    return (
      <div className={styles.errorContainer}>
        <p>Failed to load profile. Please try again.</p>
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
      <TopNav profile={facultyProfile} onLogout={handleLogout} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.dashboardContainer}>
        {/* Mobile menu button */}
        <button
          className={styles.mobileMenuButton}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
          type="button"
        >
          <i className="bx bx-menu"></i>
        </button>

        {/* Welcome Section */}
        <header className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>
            Welcome, {facultyProfile.name}!
          </h1>
          <p className={styles.welcomeSubtitle}>
            {facultyProfile.role} • {facultyProfile.department || "N/A"} •{" "}
            {facultyProfile.college || "Tech University"}
          </p>
        </header>

        {/* Pending Students Section */}
        {pendingStudents.length > 0 && (
          <section className={styles.pendingSection}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <i className="bx bx-user-check"></i>
                  Pending Student Approvals
                  <span className={styles.badge}>{pendingStudents.length}</span>
                </h2>
                <button
                  className={styles.toggleButton}
                  onClick={() => setShowPendingStudents(!showPendingStudents)}
                  type="button"
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
                      <div
                        key={pending.pendingId}
                        className={styles.pendingItem}
                      >
                        <div className={styles.studentInfo}>
                          {pending.student.passportPhotoUrl && (
                            <img
                              src={`http://localhost:4000${pending.student.passportPhotoUrl}`}
                              alt={pending.student.name}
                              className={styles.studentPhoto}
                              loading="lazy"
                            />
                          )}
                          <div className={styles.studentDetails}>
                            <h3>{pending.student.name}</h3>
                            <p>
                              <i className="bx bx-envelope"></i>{" "}
                              {pending.student.email}
                            </p>
                            <p>
                              <i className="bx bx-id-card"></i>{" "}
                              {pending.student.rollNo}
                            </p>
                            <p>
                              <i className="bx bx-building"></i>{" "}
                              {pending.student.college}
                            </p>
                            <p>
                              <i className="bx bx-phone"></i>{" "}
                              {pending.student.countryCode}{" "}
                              {pending.student.mobileNumber}
                            </p>
                            <p className={styles.requestDate}>
                              Requested:{" "}
                              {new Date(pending.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className={styles.pendingActions}>
                          <button
                            className={styles.approveButton}
                            onClick={() => {
                              const notes = prompt(
                                "Add approval notes (optional):"
                              );
                              if (notes !== null) {
                                handleStudentAction(
                                  pending.pendingId,
                                  "approve",
                                  notes
                                );
                              }
                            }}
                            type="button"
                          >
                            <i className="bx bx-check"></i>
                            Approve
                          </button>
                          <button
                            className={styles.rejectButton}
                            onClick={() => {
                              const notes = prompt(
                                "Add rejection reason (optional):"
                              );
                              if (notes !== null) {
                                handleStudentAction(
                                  pending.pendingId,
                                  "reject",
                                  notes
                                );
                              }
                            }}
                            type="button"
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
            <StatCard
              value={registeredCourses.length}
              label="Total Courses"
              icon="bx-book"
              variant="info"
              onClick={() => navigate("/faculty/courses")}
            />
            <StatCard
              value={stats.presentCount}
              label="Present"
              icon="bx-check-circle"
              variant="success"
            />
            <StatCard
              value={stats.absentCount}
              label="Absent"
              icon="bx-x-circle"
              variant="error"
            />
            <StatCard
              value={stats.studentsInRoster}
              label="Total Students"
              icon="bx-group"
              variant="default"
            />
          </div>
        </section>

        {/* Pending course registrations */}
        {facultyProfile && (
          <section className={styles.assistSection}>
            <PendingCourseRegistrations
              facultyId={facultyProfile.userId || facultyProfile.id}
              onRegistrationProcessed={(_id, action) => {
                showToast(`Course registration ${action}`, "success");
              }}
            />
          </section>
        )}

        {/* Main Content Grid */}
        <section className={styles.mainContent}>
          <div className={styles.contentGrid}>
            {/* Session Management Card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <i className="bx bx-calendar-check"></i>
                  Attendance Session
                </h2>
                {activeSession && (
                  <span className={styles.activeBadge}>Active</span>
                )}
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
                        type="button"
                      >
                        <i className="bx bx-play-circle"></i>
                        Generate Session Code
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={styles.activeSession}>
                    <div className={styles.sessionInfo}>
                      <h3 className={styles.sessionCourseName}>
                        {activeSession.courseName}
                      </h3>
                      <div className={styles.codeDisplay}>
                        <span className={styles.codeLabel}>Session Code:</span>
                        <span className={styles.codeValue}>
                          {activeSession.code}
                        </span>
                      </div>
                    </div>

                    <div className={styles.sessionStats}>
                      <div className={styles.statItem}>
                        <span className={styles.statItemValue}>
                          {stats.presentCount}
                        </span>
                        <span className={styles.statItemLabel}>Present</span>
                      </div>
                      <div className={styles.statDivider}></div>
                      <div className={styles.statItem}>
                        <span className={styles.statItemValue}>
                          {stats.studentsInRoster}
                        </span>
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
                        title="Check for duplicate submissions"
                        type="button"
                      >
                        <i className="bx bx-error-circle"></i>
                        Check Duplicates
                      </button>
                      <button
                        className={styles.endButton}
                        onClick={() => endSession(false)}
                        type="button"
                      >
                        <i className="bx bx-stop-circle"></i>
                        End Session
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Roster Card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <i className="bx bx-list-ul"></i>
                  {activeSession ? "Live Attendance" : "Course Roster"}
                </h2>
                {currentSelectedCourse && (
                  <span className={styles.rosterCount}>
                    {stats.studentsInRoster} students
                  </span>
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
                            student.present
                              ? styles.rosterPresent
                              : styles.rosterAbsent
                          } ${
                            student.overridden ? styles.rosterOverridden : ""
                          }`}
                        >
                          <div className={styles.studentInfo}>
                            <span className={styles.studentName}>
                              {student.name}
                            </span>
                            <span className={styles.studentRoll}>
                              {student.roll_no}
                            </span>
                          </div>
                          <div className={styles.studentStatus}>
                            <span
                              className={`${styles.statusBadge} ${
                                student.present
                                  ? styles.badgePresent
                                  : styles.badgeAbsent
                              }`}
                            >
                              {student.present
                                ? "PRESENT"
                                : activeSession
                                ? "PENDING"
                                : "N/A"}
                              {student.overridden && (
                                <i
                                  className="bx bx-edit"
                                  title="Manually Overridden"
                                ></i>
                              )}
                            </span>
                            {student.statusTime && (
                              <span className={styles.statusTime}>
                                {student.statusTime}
                              </span>
                            )}
                          </div>
                          {activeSession && (
                            <button
                              className={`${styles.overrideButton} ${
                                student.present
                                  ? styles.overrideAbsent
                                  : styles.overridePresent
                              }`}
                              onClick={() => handleManualOverride(student.id)}
                              title={
                                student.present ? "Mark Absent" : "Mark Present"
                              }
                              type="button"
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
                        type="button"
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
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>
                <i className="bx bx-plus-circle"></i>
                <span>Course Management</span>
              </h2>
              <button
                className={styles.toggleButton}
                onClick={() => {
                  setIsRegistering((prev) => !prev);
                  setRegistrationError("");
                }}
                type="button"
                aria-label={
                  isRegistering
                    ? "Cancel course registration"
                    : "Register new course"
                }
              >
                {isRegistering ? (
                  <>
                    <i className="bx bx-x" aria-hidden="true"></i>
                    <span>Cancel</span>
                  </>
                ) : (
                  <>
                    <i className="bx bx-plus" aria-hidden="true"></i>
                    <span>Register New Course</span>
                  </>
                )}
              </button>
            </div>

            {isRegistering && (
              <form
                onSubmit={handleCourseRegistration}
                className={styles.registrationForm}
              >
                {registrationError && (
                  <div className={styles.registrationError}>
                    {registrationError}
                  </div>
                )}

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Course Code</label>
                    <input
                      type="text"
                      placeholder="e.g., CS401"
                      value={newCourseCode}
                      onChange={(e) =>
                        setNewCourseCode(e.target.value.toUpperCase())
                      }
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
                  disabled={
                    !newCourseCode ||
                    !newCourseTitle ||
                    parseInt(numClasses) < 1
                  }
                >
                  <i className="bx bx-check"></i>
                  Register Course
                </button>
              </form>
            )}
          </div>
        </section>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default React.memo(InClassFaculty);
