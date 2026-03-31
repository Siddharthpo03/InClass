import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import ActiveSessionsList from "../../components/student/ActiveSessionsList";
import AttendanceMarking from "../../components/student/AttendanceMarking";
import Modal from "../../components/shared/Modal";
import ToastContainer from "../../components/shared/ToastContainer";
import useStudentSocket from "../../hooks/useStudentSocket";
import styles from "./InClassStudent.module.css";

const MOCK_STUDENT_PROFILE = {
  userId: 0,
  id: 0,
  name: "Preview Student",
  email: "preview@test.com",
  role: "student",
  college_id: 1,
  department_id: 1,
};

const InClassStudent = ({ previewMode = false }) => {
  const navigate = useNavigate();
  const portalRef = useRef(null);
  const intervalRef = useRef(null);
  const autoLogoutRef = useRef(null);

  // User data state
  const [userData, setUserData] = useState(previewMode ? MOCK_STUDENT_PROFILE : null);
  const [loading, setLoading] = useState(!previewMode);
  const [biometricStatus, setBiometricStatus] = useState({
    webauthn: false,
    face: false,
    isLoading: true,
  });
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [faceEnrolled, setFaceEnrolled] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({
    percentage: 0,
    totalClasses: 0,
    present: 0,
    absent: 0,
  });

  // Session state
  const [sessionCode, setSessionCode] = useState("");
  const [isAttendanceMarked, setIsAttendanceMarked] = useState(false);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionMessage, setSessionMessage] = useState("");
  const [timer, setTimer] = useState(0);
  const [currentSession, setCurrentSession] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  
  // New state for real-time sessions
  const [activeSessions, setActiveSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
  
  // Auto-logout timer (5 minutes for students during attendance session)
  const STUDENT_AUTO_LOGOUT_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

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

  // Fetch user profile (skip when preview mode)
  useEffect(() => {
    if (previewMode) {
      setUserData(MOCK_STUDENT_PROFILE);
      setBiometricStatus((prev) => ({ ...prev, isLoading: false }));
      setLoading(false);
      return;
    }
    const fetchUserProfile = async () => {
      try {
        const response = await apiClient.get("/auth/profile");
        console.log("📋 Profile response:", response.data);
        setUserData(response.data);
        
        // Fetch biometric status
        if (response.data?.userId) {
          try {
            const bioResponse = await apiClient.get(`/biometrics/status?userId=${response.data.userId}`);
            if (bioResponse.data) {
              setBiometricStatus({
                webauthn: bioResponse.data.webauthn || false,
                face: bioResponse.data.face || false,
                isLoading: false,
              });
              setFaceEnrolled(!!bioResponse.data.face);
            } else {
              setBiometricStatus((prev) => ({ ...prev, isLoading: false }));
            }
          } catch (bioError) {
            // Endpoint might not exist yet, that's okay
            console.log("Biometric status check failed (endpoint may not exist):", bioError);
            setBiometricStatus((prev) => ({ ...prev, isLoading: false }));
          }
        }
        
        // Fetch enrolled courses for Socket.io
        try {
          const enrollmentsResponse = await apiClient.get("/registrations/my-registrations");
          const registrations = enrollmentsResponse.data?.registrations || [];
          const approvedCourseIds = registrations
            .filter((reg) => reg.status === "approved")
            .map((reg) => reg.course?.id);
          setEnrolledCourseIds(approvedCourseIds);
        } catch (enrollError) {
          console.log("Failed to fetch enrollments:", enrollError);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        if (!previewMode && (error.response?.status === 401 || error.response?.status === 403)) {
          localStorage.removeItem("inclass_token");
          localStorage.removeItem("user_role");
          navigate("/login");
        }
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [navigate, previewMode]);

  // Derive attendance statistics from history
  useEffect(() => {
    const calculateStats = () => {
      const total = attendanceHistory.length;
      const present = attendanceHistory.filter((item) => item.status === "Present").length;
      const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
      setAttendanceStats({
        percentage: parseFloat(percentage),
        totalClasses: total,
        present,
        absent: total - present,
      });
    };
    calculateStats();
  }, [attendanceHistory]);

  // NOTE: Attendance history uses placeholder data. See GitHub issue for real API integration.
  useEffect(() => {
    setAttendanceHistory([
      { date: "2025-01-20", course: "CS401", status: "Present", time: "10:00 AM" },
      { date: "2025-01-18", course: "MA205", status: "Present", time: "02:00 PM" },
      { date: "2025-01-15", course: "EE310", status: "Absent", time: "09:00 AM" },
      { date: "2025-01-13", course: "CS401", status: "Present", time: "10:00 AM" },
    ]);

    // Mock current session (replace with real API call)
    setCurrentSession({
      courseId: "CS401",
      courseName: "CS401 - Database Systems",
      instructor: "Dr. Evelyn Reed",
      initialDuration: 300, // 5 minutes
      isActive: true,
    });
  }, []);

  // Toast management
  const showToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, show: true }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Socket.io integration for real-time sessions
  const { isConnected } = useStudentSocket(
    enrolledCourseIds,
    (sessionData) => {
      // Handle session started
      setActiveSessions((prev) => {
        const exists = prev.find((s) => s.id === sessionData.sessionId);
        if (exists) return prev;
        return [
          ...prev,
          {
            id: sessionData.sessionId,
            courseId: sessionData.courseId,
            courseName: sessionData.courseName || "Unknown Course",
            facultyName: sessionData.facultyName || sessionData.facultyId || "Unknown Professor",
            code: sessionData.code,
            expiresAt: sessionData.expiresAt,
            isActive: true,
            studentId: userData?.userId,
          },
        ];
      });
      
      // Show toast notification
      showToast(
        `Professor ${sessionData.facultyName || "Unknown"} started attendance for ${sessionData.courseName || "course"} — tap to mark.`,
        "info"
      );
    },
    (sessionData) => {
      // Handle session ended
      setActiveSessions((prev) =>
        prev.filter((s) => s.id !== sessionData.sessionId)
      );
    },
    (attendanceData) => {
      // Handle attendance updates (optional)
      console.log("Attendance updated:", attendanceData);
    },
    true // enabled
  );

  // Enforce attendance rules
  const enforceAbsentAndExit = useCallback(
    (reason) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsSessionActive(false);
      setTimer(0);
      alert(`❌ Attendance Failed: ${reason} Session terminated. Marked ABSENT.`);
      navigate("/login");
    },
    [navigate]
  );

  // Fullscreen and tab switching enforcement
  useEffect(() => {
    const enforceRules = () => {
      if (isSessionActive && !isAttendanceMarked) {
        if (document.visibilityState === "hidden") {
          enforceAbsentAndExit("You switched tabs or minimized the browser!");
          return;
        }
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

  // Timer logic
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

  // Auto-logout timer: 5 minutes for students during active attendance session
  useEffect(() => {
    if (isSessionActive && !isAttendanceMarked) {
      // Start auto-logout timer
      autoLogoutRef.current = setTimeout(() => {
        handleLogout();
        alert("Session expired. You have been logged out for security.");
      }, STUDENT_AUTO_LOGOUT_TIME);
    } else {
      // Clear timer if session ends or attendance is marked
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- STUDENT_AUTO_LOGOUT_TIME and handleLogout are stable
  }, [isSessionActive, isAttendanceMarked]);

  // Check biometric enrollment before starting session
  const checkBiometricEnrollment = () => {
    const skipped = localStorage.getItem("biometricSkipped") === "true";
    const hasEnrolled = biometricStatus.webauthn || biometricStatus.face;
    
    if (!hasEnrolled && !skipped) {
      setShowBiometricModal(true);
      return false;
    }
    return true;
  };

  // Start attendance session (reserved for fullscreen flow)
  const _handleStartSession = (e) => {
    e.preventDefault();
    if (!currentSession) return;

    // Check biometric enrollment
    if (!checkBiometricEnrollment()) {
      return;
    }

    if (portalRef.current && portalRef.current.requestFullscreen) {
      portalRef.current
        .requestFullscreen()
        .then(() => {
          setIsSessionActive(true);
          setTimer(currentSession.initialDuration);
          setSessionMessage("");
        })
        .catch((err) => {
          alert(`❌ Could not enter fullscreen: ${err.message}. Attendance rules still apply!`);
          setIsSessionActive(true);
          setTimer(currentSession.initialDuration);
        });
    } else {
      setIsSessionActive(true);
      setTimer(currentSession.initialDuration);
      alert("⚠️ Fullscreen not supported. Attendance rules still apply!");
    }
  };

  // Handle code submit
  // Logout handler
  const handleLogout = () => {
    // Clear intervals and timers before logging out
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (autoLogoutRef.current) {
      clearTimeout(autoLogoutRef.current);
      autoLogoutRef.current = null;
    }
    // Remove token and redirect
    localStorage.removeItem("inclass_token");
    localStorage.removeItem("user_role");
    navigate("/login");
  };

  const [showExpiredReportModal, setShowExpiredReportModal] = useState(false);
  const [expiredSessionId, setExpiredSessionId] = useState(null);
  const [reportReason, setReportReason] = useState("");

  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setSessionMessage("");

    if (sessionCode.length !== 6) {
      setSessionMessage("❌ Invalid code length. Code must be 6 characters.");
      return;
    }

    const submitButton = e.currentTarget.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      const response = await apiClient.post("/attendance/mark", {
        code: sessionCode,
      });

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsAttendanceMarked(true);
      setIsSessionActive(false);
      setSessionMessage(
        response.data.message || "✅ Attendance marked successfully! You may now exit fullscreen."
      );

      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }

      // Append the just-marked record so the UI reflects it immediately
      const session = selectedSession || currentSession;
      if (session) {
        const now = new Date();
        setAttendanceHistory((prev) => [
          {
            date: now.toISOString().split("T")[0],
            course: session.course_code || session.courseId || "N/A",
            status: "Present",
            time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
          ...prev,
        ]);
      }
    } catch (error) {
      const errorData = error.response?.data;
      const errorMessage = errorData?.error?.message || errorData?.message || "Attendance submission failed.";
      
      // Use Case 04: Handle expired code reporting
      if (errorData?.expired && errorData?.session_id) {
        setExpiredSessionId(errorData.session_id);
        setShowExpiredReportModal(true);
        setSessionMessage("⚠️ Code has expired. Please report the issue.");
      } else {
      setSessionMessage(`❌ ${errorMessage}`);
      }
      console.error("Attendance Submission Error:", error.response || error);
      if (submitButton) submitButton.disabled = false;
    }
  };

  const handleExpiredCodeReport = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) {
      alert("Please provide a reason for reporting the expired code.");
      return;
    }

    try {
      await apiClient.post("/reports/expired-code", {
        session_id: expiredSessionId,
        reason: reportReason,
      });

      alert("✅ Report submitted successfully! Faculty will be notified.");
      setShowExpiredReportModal(false);
      setReportReason("");
      setExpiredSessionId(null);
      setSessionMessage("Report submitted. Your attendance will be updated if faculty approves.");
    } catch (error) {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        "Failed to submit report.";
      alert(`❌ ${errorMessage}`);
    }
  };

  if (loading) {
      return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Loading your dashboard...</p>
        </div>
      );
    }

  if (!userData) {
      return (
      <div className={styles.errorContainer}>
        <p>Failed to load profile. Please try again.</p>
        <button onClick={() => navigate("/login")}>Go to Login</button>
        </div>
      );
    }

  const formatDisplayName = (name) => {
    if (!name || typeof name !== "string") return name || "Student";
    return name.replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const displayDepartment = userData.department_name ?? userData.department ?? "N/A";
  const displayCollege = userData.college_name ?? userData.college ?? "Tech University";

  // If session is active, show only the attendance form in fullscreen mode
    if (isSessionActive) {
      return (
      <div className={styles.fullscreenSession} ref={portalRef}>
        <form onSubmit={handleCodeSubmit} className={styles.fullscreenForm}>
          <div className={styles.fullscreenHeader}>
            <h2 className={styles.fullscreenTitle}>Enter Attendance Code</h2>
            <p className={styles.fullscreenCourse}>{currentSession?.courseName}</p>
          </div>

          <div className={styles.fullscreenTimer}>
            <i className="bx bx-time-five"></i>
            <span>
              {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
            </span>
          </div>

          <div className={styles.fullscreenInputWrapper}>
          <input
            type="text"
            value={sessionCode}
            onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              placeholder="Enter 6-digit code"
              className={styles.fullscreenInput}
            maxLength="6"
            required
              autoFocus
          />
          </div>

          {sessionMessage && (
            <div
              className={`${styles.fullscreenMessage} ${
                sessionMessage.startsWith("✅") ? styles.messageSuccess : styles.messageError
              }`}
            >
              {sessionMessage}
            </div>
          )}

          <button
            type="submit"
            className={styles.fullscreenSubmit}
            disabled={timer <= 0 || sessionCode.length !== 6}
          >
            <i className="bx bx-check"></i>
            Mark Attendance
          </button>

          <div className={styles.fullscreenWarning}>
            <i className="bx bx-error-circle"></i>
            <p>Do not switch tabs or exit fullscreen</p>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.dashboardWrapper} ref={portalRef}>
      {previewMode && (
        <div style={{ background: "#f59e0b", color: "#000", padding: "8px 16px", textAlign: "center", fontSize: "14px", fontWeight: 600 }}>
          Preview mode — no login (testing only)
        </div>
      )}
      <Navigation />
      
      <div className={styles.dashboardContainer}>
        {/* Header Section */}
        <header className={styles.dashboardHeader}>
          <div className={styles.headerContent}>
            <div className={styles.welcomeSection}>
              <h1 className={styles.welcomeTitle}>Welcome back, {formatDisplayName(userData.name)}!</h1>
              <p className={styles.welcomeSubtitle}>
                {userData.role} • {userData.id || "N/A"}
              </p>
              <p className={styles.welcomeDetails}>
                {displayDepartment} • {displayCollege}
              </p>
            </div>
            <div className={styles.headerActions}>
              <Link
                to="/student/register-courses"
                className={styles.registerLink}
                title="Register for courses"
              >
                <i className="bx bx-book-add"></i>
                <span>Register Courses</span>
              </Link>
              <div className={styles.attendanceBadge}>
                <div
                  className={styles.badgeCircle}
                  style={{ ["--pct"]: attendanceStats.percentage }}
                  aria-label={`Attendance: ${attendanceStats.percentage}%`}
                >
                  <span className={styles.badgePercentage}>{attendanceStats.percentage}%</span>
                </div>
                <p className={styles.badgeLabel}>Attendance</p>
              </div>
              <button className={styles.logoutButton} onClick={handleLogout} title="Logout">
                <i className="bx bx-log-out"></i>
                <span>Logout</span>
          </button>
            </div>
        </div>
      </header>


        {/* Stats Cards Section */}
        <section className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <i className="bx bx-check-circle"></i>
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statValue}>{attendanceStats.present}</h3>
                <p className={styles.statLabel}>Present</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconAbsent}`}>
                <i className="bx bx-x-circle"></i>
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statValue}>{attendanceStats.absent}</h3>
                <p className={styles.statLabel}>Absent</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={`${styles.statIcon} ${styles.statIconTotal}`}>
                <i className="bx bx-book"></i>
              </div>
              <div className={styles.statContent}>
                <h3 className={styles.statValue}>{attendanceStats.totalClasses}</h3>
                <p className={styles.statLabel}>Total Classes</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <section className={styles.mainContent}>
          <div className={styles.contentGrid}>
            {/* Active Sessions List */}
            <div className={styles.sessionCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <i className="bx bx-calendar-check"></i>
                  Active Sessions
                </h2>
                {isConnected && (
                  <span className={styles.connectionBadge} title="Real-time updates active">
                    <i className="bx bx-wifi"></i>
                    Connected
                  </span>
                )}
              </div>

              <div className={styles.cardBody}>
                <ActiveSessionsList
                  sessions={activeSessions}
                  onSessionClick={(session) => setSelectedSession(session)}
                  currentTime={Date.now()}
                />
              </div>
            </div>

            {/* Attendance History Card */}
            <div className={styles.historyCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <i className="bx bx-history"></i>
                  Recent History
                </h2>
                <button className={styles.viewAllButton}>View All</button>
              </div>

              <div className={styles.cardBody}>
                {attendanceHistory.length === 0 ? (
                  <div className={styles.emptyState}>
                    <i className="bx bx-inbox"></i>
                    <p>No attendance records yet</p>
                  </div>
                ) : (
                  <div className={styles.historyList}>
                    {attendanceHistory.map((item, index) => (
                      <div
                        key={index}
                        className={`${styles.historyItem} ${
                          item.status === "Present" ? styles.historyPresent : styles.historyAbsent
                        }`}
                      >
                        <div className={styles.historyDate}>
                          <span className={styles.dateText}>
                            {new Date(item.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
              </span>
                          <span className={styles.timeText}>{item.time}</span>
                        </div>
                        <div className={styles.historyCourse}>{item.course}</div>
                        <div
                          className={`${styles.historyStatus} ${
                            item.status === "Present"
                              ? styles.statusPresent
                              : styles.statusAbsent
                          }`}
                        >
                          <i
                            className={`bx ${
                              item.status === "Present" ? "bx-check" : "bx-x"
                            }`}
                          ></i>
                          {item.status}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
        </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Attendance Marking Modal */}
      {selectedSession && (
        <Modal
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          title="Mark Attendance"
          size="large"
        >
          <AttendanceMarking
            session={selectedSession}
            onSuccess={() => {
              setSelectedSession(null);
              showToast("Attendance recorded.", "success");
              // Remove from active sessions
              setActiveSessions((prev) =>
                prev.filter((s) => s.id !== selectedSession.id)
              );
            }}
            onCancel={() => setSelectedSession(null)}
            hasFaceEnrolled={faceEnrolled}
          />
        </Modal>
      )}

      {/* Biometric Enrollment Modal */}
      {showBiometricModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Biometric Enrollment Required</h3>
              <button
                className={styles.modalClose}
                onClick={() => {
                  const skipped = localStorage.getItem("biometricSkipped") === "true";
                  if (skipped) {
                    setShowBiometricModal(false);
                  }
                }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.biometricModalContent}>
                <i className="bx bx-face" style={{ fontSize: "3rem", color: "#10b981", marginBottom: "16px" }}></i>
                <p className={styles.modalDescription}>
                  You need to enroll your face to mark attendance. This ensures secure and accurate attendance tracking.
                </p>
                {localStorage.getItem("biometricSkipped") === "true" ? (
                  <p className={styles.modalNote}>
                    You can enroll biometrics later from Profile → Biometrics. Faculty can manually mark your attendance in the meantime.
                  </p>
                ) : (
                  <p className={styles.modalNote}>
                    Please complete biometric enrollment to continue.
                  </p>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              {localStorage.getItem("biometricSkipped") === "true" ? (
                <button
                  type="button"
                  className={styles.modalCancel}
                  onClick={() => setShowBiometricModal(false)}
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className={styles.modalCancel}
                    onClick={() => {
                      localStorage.setItem("biometricSkipped", "true");
                      setShowBiometricModal(false);
                    }}
                  >
                    Skip for Now
                  </button>
                  <button
                    type="button"
                    className={styles.modalSubmit}
                    onClick={() => {
                      setShowBiometricModal(false);
                      navigate(`/onboard/biometrics?userId=${userData?.userId || userData?.id}`);
                    }}
                  >
                    Go to Biometric Enrollment
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expired Code Report Modal (Use Case 04) */}
      {showExpiredReportModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Report Expired Code</h3>
              <button
                className={styles.modalClose}
                onClick={() => {
                  setShowExpiredReportModal(false);
                  setReportReason("");
                  setExpiredSessionId(null);
                }}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>
            <form onSubmit={handleExpiredCodeReport} className={styles.modalForm}>
              <div className={styles.modalBody}>
                <p className={styles.modalDescription}>
                  The attendance code has expired. Please provide a reason for reporting this issue.
                  Faculty will review your report and may approve your attendance.
                </p>
                <div className={styles.formGroup}>
                  <label>Reason for Reporting</label>
                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="e.g., Code expired before I could enter it, technical issues, etc."
                    rows="4"
                    required
                  />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.modalCancel}
                  onClick={() => {
                    setShowExpiredReportModal(false);
                    setReportReason("");
                    setExpiredSessionId(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.modalSubmit}>
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default InClassStudent;



