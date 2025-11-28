import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import styles from "./InClassStudent.module.css";

const InClassStudent = () => {
  const navigate = useNavigate();
  const portalRef = useRef(null);
  const intervalRef = useRef(null);
  const autoLogoutRef = useRef(null);

  // User data state
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [biometricStatus, setBiometricStatus] = useState({
    webauthn: false,
    face: false,
    isLoading: true,
  });
  const [showBiometricModal, setShowBiometricModal] = useState(false);
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

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await apiClient.get("/auth/profile");
        console.log("📋 Profile response:", response.data);
        setUserData(response.data);
        
        // Fetch biometric status
        if (response.data?.userId) {
          try {
            const bioResponse = await apiClient.get(`/api/biometrics/status?userId=${response.data.userId}`);
            if (bioResponse.data) {
              setBiometricStatus({
                webauthn: bioResponse.data.webauthn || false,
                face: bioResponse.data.face || false,
                isLoading: false,
              });
            } else {
              setBiometricStatus((prev) => ({ ...prev, isLoading: false }));
            }
          } catch (bioError) {
            // Endpoint might not exist yet, that's okay
            console.log("Biometric status check failed (endpoint may not exist):", bioError);
            setBiometricStatus((prev) => ({ ...prev, isLoading: false }));
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem("inclass_token");
          localStorage.removeItem("user_role");
          navigate("/login");
        }
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [navigate]);

  // Fetch attendance statistics (mock for now - can be enhanced with real API)
  useEffect(() => {
    // TODO: Replace with real API call when endpoint is available
    // For now, calculate from attendance history
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

  // Mock attendance history (replace with real API call)
  useEffect(() => {
    // TODO: Replace with real API endpoint
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

  const classNames = (...classes) =>
    classes
      .flat()
      .filter(Boolean)
      .map((cls) => styles[cls] || cls)
      .join(" ")
      .trim();

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

  // Start attendance session
  const handleStartSession = (e) => {
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

      // Refresh attendance history
      // TODO: Fetch updated history from API
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
      const response = await apiClient.post("/reports/expired-code", {
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
      <Navigation />
      
      <div className={styles.dashboardContainer}>
        {/* Header Section */}
        <header className={styles.dashboardHeader}>
          <div className={styles.headerContent}>
            <div className={styles.welcomeSection}>
              <h1 className={styles.welcomeTitle}>Welcome back, {userData.name}!</h1>
              <p className={styles.welcomeSubtitle}>
                {userData.role} • {userData.id || "N/A"}
              </p>
              <p className={styles.welcomeDetails}>
                {userData.department || "N/A"} • {userData.college || "Tech University"}
              </p>
            </div>
            <div className={styles.headerActions}>
              <div className={styles.attendanceBadge}>
                <div className={styles.badgeCircle}>
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
            {/* Attendance Session Card */}
            <div className={styles.sessionCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>
                  <i className="bx bx-calendar-check"></i>
                  Attendance Session
                </h2>
                {currentSession?.isActive && !isAttendanceMarked && (
                  <span className={styles.activeBadge}>Active</span>
                )}
              </div>

              <div className={styles.cardBody}>
                {!currentSession?.isActive && !isAttendanceMarked ? (
                  <div className={styles.emptyState}>
                    <i className="bx bx-time"></i>
                    <h3>No Active Session</h3>
                    <p>Check back at your scheduled class time</p>
                  </div>
                ) : isAttendanceMarked ? (
                  <div className={styles.successState}>
                    <div className={styles.successIcon}>
                      <i className="bx bx-check-circle"></i>
                    </div>
                    <h3>Attendance Marked!</h3>
                    <p className={styles.courseName}>{currentSession?.courseName}</p>
                    <p className={styles.successMessage}>You are recorded as PRESENT</p>
                    {sessionMessage && (
                      <div className={styles.messageBox}>{sessionMessage}</div>
                    )}
                  </div>
                ) : (
                  <div className={styles.sessionReady}>
                    <div className={styles.sessionInfo}>
                      <h3>Active Session Available</h3>
                      <p className={styles.courseName}>{currentSession?.courseName}</p>
                      <p className={styles.instructorName}>
                        <i className="bx bx-user"></i>
                        {currentSession?.instructor}
                      </p>
                    </div>
                    <div className={styles.securityNotice}>
                      <i className="bx bx-shield"></i>
                      <p>
                        Your screen will be locked to ensure attendance integrity. Exiting or
                        switching tabs will result in an ABSENT mark.
                      </p>
                    </div>
                    <button className={styles.startButton} onClick={handleStartSession}>
                      <i className="bx bx-play-circle"></i>
                      Start Attendance Session
                    </button>
                  </div>
                )}
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
                <i className="bx bx-fingerprint" style={{ fontSize: "3rem", color: "#10b981", marginBottom: "16px" }}></i>
                <p className={styles.modalDescription}>
                  You need to enroll biometrics to mark attendance. This ensures secure and accurate attendance tracking.
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



