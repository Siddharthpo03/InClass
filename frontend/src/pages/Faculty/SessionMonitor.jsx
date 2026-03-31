import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FixedSizeList as List } from "react-window";
import apiClient from "../../utils/apiClient";
import TopNav from "../../components/faculty/TopNav";
import Sidebar from "../../components/faculty/Sidebar";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ToastContainer from "../../components/shared/ToastContainer";
import StatCard from "../../components/shared/StatCard";
import Modal from "../../components/shared/Modal";
import useSessionSocket from "../../hooks/useSessionSocket";
import styles from "./SessionMonitor.module.css";

const SessionMonitor = () => {
  const navigate = useNavigate();
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facultyProfile, setFacultyProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const searchTimeoutRef = useRef(null);

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

  // Handle real-time attendance updates
  const handleAttendanceUpdate = useCallback((data) => {
    setAttendance((prev) => {
      const existing = prev.find((a) => a.student_id === data.studentId || a.student_id === data.student_id);
      const updatedData = {
        student_id: data.studentId || data.student_id,
        name: data.studentName || data.name,
        roll_no: data.studentRollNo || data.roll_no,
        present: data.status === "Present" || data.present,
        updated_at: data.timestamp || data.updated_at,
        face_verified: data.face_verified !== false,
      };
      
      if (existing) {
        return prev.map((a) =>
          (a.student_id === updatedData.student_id)
            ? { ...a, ...updatedData }
            : a
        );
      }
      return [...prev, updatedData];
    });
    
    // Show notification to faculty
    if (data.studentName) {
      showToast(
        `Attendance from ${data.studentName} for ${session?.course_code || "course"} at ${new Date(data.timestamp || Date.now()).toLocaleTimeString()}`,
        "success"
      );
    }
  }, [session, showToast]);

  const handleSessionEnd = useCallback(() => {
    showToast("Session has ended", "warning");
    setTimeout(() => {
      navigate("/faculty/sessions");
    }, 2000);
  }, [navigate, showToast]);

  // Socket connection
  const { isConnected } = useSessionSocket(
    sessionId,
    handleAttendanceUpdate,
    handleSessionEnd,
    !!sessionId
  );

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/auth/profile");
        setFacultyProfile(response.data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate("/login");
        }
      }
    };
    fetchProfile();
  }, [navigate]);

  // Fetch session and attendance
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionRes, attendanceRes] = await Promise.all([
          apiClient.get(`/faculty/sessions/${sessionId}`).catch(() => ({ data: null })),
          apiClient.get(`/faculty/sessions/${sessionId}/attendance`).catch(() => ({ data: [] })),
        ]);

        setSession(sessionRes.data);
        setAttendance(attendanceRes.data || []);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch session data:", error);
        showToast("Failed to load session data.", "error");
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchData();
    }
  }, [sessionId, showToast]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("inclass_token");
    localStorage.removeItem("user_role");
    navigate("/login");
  }, [navigate]);

  const handleEndSession = useCallback(async () => {
    if (!confirm("Are you sure you want to end this session?")) return;

    try {
      await apiClient.post(`/faculty/sessions/${sessionId}/end`);
      showToast("Session ended successfully", "success");
      setTimeout(() => {
        navigate("/faculty/sessions");
      }, 1500);
    } catch {
      showToast("Failed to end session", "error");
    }
  }, [sessionId, navigate, showToast]);

  // Debounce search query
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Filtered attendance based on debounced search
  const filteredAttendance = useMemo(() => {
    if (!debouncedSearchQuery) return attendance;
    const query = debouncedSearchQuery.toLowerCase();
    return attendance.filter(
      (a) =>
        a.name?.toLowerCase().includes(query) ||
        a.roll_no?.toLowerCase().includes(query) ||
        a.email?.toLowerCase().includes(query)
    );
  }, [attendance, debouncedSearchQuery]);

  const stats = useMemo(() => {
    const present = attendance.filter((a) => a.present).length;
    const absent = attendance.length - present;
    return {
      total: attendance.length,
      present,
      absent,
    };
  }, [attendance]);

  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [overriding, setOverriding] = useState(false);

  const handleManualOverride = useCallback(async () => {
    if (!selectedStudent || !overrideReason.trim()) {
      showToast("Please provide a reason for the override", "error");
      return;
    }

    try {
      setOverriding(true);
      const response = await apiClient.post("/faculty/manual-attendance", {
        student_id: selectedStudent.student_id || selectedStudent.id,
        session_id: sessionId,
        reason: overrideReason,
        status: selectedStudent.present ? "Absent" : "Present",
      });

      if (response.data.success) {
        // Update local attendance
        setAttendance((prev) =>
          prev.map((a) =>
            (a.student_id || a.id) === (selectedStudent.student_id || selectedStudent.id)
              ? {
                  ...a,
                  present: !a.present,
                  is_overridden: true,
                  override_reason: overrideReason,
                  face_verified: true, // Mark as verified after manual override
                }
              : a
          )
        );
        showToast(
          `Attendance manually updated for ${selectedStudent.name}`,
          "success"
        );
        setShowOverrideModal(false);
        setSelectedStudent(null);
        setOverrideReason("");
      }
    } catch (error) {
      console.error("Failed to override attendance:", error);
      showToast(
        error.response?.data?.message || "Failed to update attendance",
        "error"
      );
    } finally {
      setOverriding(false);
    }
  }, [selectedStudent, overrideReason, sessionId, showToast]);

  const AttendanceRow = ({ index, style, data }) => {
    const student = data[index];
    const faceVerified = student.face_verified !== false && student.face_verified !== undefined;
    const isUnverified = student.present && !faceVerified;
    
    const handleRowClick = () => {
      if (isUnverified || !faceVerified) {
        setSelectedStudent(student);
        setShowOverrideModal(true);
      }
    };

    return (
      <div style={style}>
        <div
          className={`${styles.attendanceItem} ${
            student.present ? styles.present : styles.absent
          } ${isUnverified ? styles.unverified : ""} ${
            faceVerified && student.present ? styles.verified : ""
          }`}
          onClick={isUnverified ? handleRowClick : undefined}
          style={isUnverified ? { cursor: "pointer" } : {}}
          title={
            isUnverified
              ? "Face not verified - Click to manually verify"
              : faceVerified && student.present
              ? "Face verified"
              : ""
          }
        >
          <div className={styles.studentInfo}>
            <div className={styles.studentNameRow}>
              {/* Status indicator dot */}
              {student.present && (
                <span
                  className={`${styles.statusDot} ${
                    faceVerified ? styles.statusDotGreen : styles.statusDotRed
                  }`}
                  title={
                    faceVerified
                      ? "Face verified"
                      : "Face not verified"
                  }
                ></span>
              )}
              <h4 className={styles.studentName}>{student.name}</h4>
            </div>
            <p className={styles.studentRoll}>{student.roll_no || student.rollNo}</p>
          </div>
          <div className={styles.attendanceStatus}>
            <div className={styles.statusRow}>
              <span
                className={`${styles.statusBadge} ${
                  student.present ? styles.badgePresent : styles.badgeAbsent
                }`}
              >
                {student.present ? "PRESENT" : "ABSENT"}
              </span>
              {student.present && (
                <div className={styles.verificationIcons}>
                  {faceVerified ? (
                    <i
                      className="bx bx-check-circle"
                      style={{ color: "#10b981" }}
                      title="Face verified"
                      aria-label="Face verified"
                    ></i>
                  ) : (
                    <i
                      className="bx bx-x-circle"
                      style={{ color: "#ef4444" }}
                      title="Face not verified - Click to verify manually"
                      aria-label="Face not verified"
                    ></i>
                  )}
                  {faceVerified ? (
                    <i
                      className="bx bx-check-circle"
                      style={{ color: "#10b981" }}
                      title="Face verified"
                      aria-label="Face verified"
                    ></i>
                  ) : (
                    <i
                      className="bx bx-x-circle"
                      style={{ color: "#ef4444" }}
                      title="Face not verified"
                      aria-label="Face not verified"
                    ></i>
                  )}
                </div>
              )}
            </div>
            {student.updated_at && (
              <span className={styles.updateTime}>
                {new Date(student.updated_at).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading session..." />;
  }

  if (!session) {
    return (
      <div className={styles.errorContainer}>
        <p>Session not found</p>
        <button onClick={() => navigate("/faculty/sessions")}>Back to Sessions</button>
      </div>
    );
  }

  return (
    <div className={styles.monitorWrapper}>
      <TopNav profile={facultyProfile} onLogout={handleLogout} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.monitorContainer}>
        <button
          className={styles.mobileMenuButton}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
          type="button"
        >
          <i className="bx bx-menu"></i>
        </button>

        <header className={styles.header}>
          <button
            className={styles.backButton}
            onClick={() => navigate("/faculty/sessions")}
            type="button"
          >
            <i className="bx bx-arrow-back"></i>
            Back
          </button>
          <div>
            <h1 className={styles.title}>Session Monitor</h1>
            <div className={styles.sessionInfo}>
              <span className={styles.sessionCode}>Code: {session.code}</span>
              <span
                className={`${styles.connectionStatus} ${
                  isConnected ? styles.connected : styles.disconnected
                }`}
              >
                <i className={`bx ${isConnected ? "bx-wifi" : "bx-wifi-off"}`}></i>
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
        </header>

        <section className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <StatCard
              value={stats.total}
              label="Total Students"
              icon="bx-group"
              variant="default"
            />
            <StatCard
              value={stats.present}
              label="Present"
              icon="bx-check-circle"
              variant="success"
            />
            <StatCard
              value={stats.absent}
              label="Absent"
              icon="bx-x-circle"
              variant="error"
            />
          </div>
        </section>

        <section className={styles.attendanceSection}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Live Attendance</h2>
              <div className={styles.legend}>
                <span className={styles.legendItem}>
                  <span className={`${styles.statusDot} ${styles.statusDotGreen}`}></span>
                  Face verified
                </span>
                <span className={styles.legendItem}>
                  <span className={`${styles.statusDot} ${styles.statusDotRed}`}></span>
                  Face not verified
                </span>
              </div>
            </div>
            <div className={styles.controls}>
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <button
                className={styles.endButton}
                onClick={handleEndSession}
                type="button"
              >
                <i className="bx bx-stop-circle"></i>
                End Session
              </button>
            </div>
          </div>

          {filteredAttendance.length === 0 ? (
            <div className={styles.emptyState}>
              <i className="bx bx-user-x"></i>
              <p>No attendance records yet</p>
            </div>
          ) : (
            <div className={styles.attendanceList}>
              <List
                height={500}
                itemCount={filteredAttendance.length}
                itemSize={70}
                itemData={filteredAttendance}
                width="100%"
              >
                {AttendanceRow}
              </List>
            </div>
          )}
        </section>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Manual Override Modal */}
      {showOverrideModal && selectedStudent && (
        <Modal
          isOpen={showOverrideModal}
          onClose={() => {
            setShowOverrideModal(false);
            setSelectedStudent(null);
            setOverrideReason("");
          }}
          title="Manual Attendance Override"
        >
          <div className={styles.modalContent}>
            <p>
              Student: <strong>{selectedStudent.name}</strong>
              {selectedStudent.roll_no && ` (${selectedStudent.roll_no})`}
            </p>
            <p>
              Current Status:{" "}
              <strong>{selectedStudent.present ? "Present" : "Absent"}</strong>
            </p>
            <p className={styles.warningText}>
              ⚠️ Face verification was not completed. Please provide a
              reason for manually overriding attendance.
            </p>
            <div className={styles.formGroup}>
              <label htmlFor="overrideReason">Reason for Override:</label>
              <textarea
                id="overrideReason"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Enter reason for manual verification..."
                rows={4}
                className={styles.textarea}
              />
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setShowOverrideModal(false);
                  setSelectedStudent(null);
                  setOverrideReason("");
                }}
                disabled={overriding}
              >
                Cancel
              </button>
              <button
                className={styles.overrideBtn}
                onClick={handleManualOverride}
                disabled={overriding || !overrideReason.trim()}
              >
                {overriding
                  ? "Processing..."
                  : `Mark as ${selectedStudent.present ? "Absent" : "Present"}`}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default React.memo(SessionMonitor);



