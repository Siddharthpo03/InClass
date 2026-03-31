import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../../utils/apiClient";
import styles from "./AssignedAssists.module.css";

const AssignedAssists = ({
  facultyId,
  onAssistCompleted,
  onAssistCancelled,
}) => {
  const [assists, setAssists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [endpoint404, setEndpoint404] = useState(false);

  const fetchAssists = useCallback(async () => {
    try {
      setLoading(true);
      setEndpoint404(false);
      // Note: baseURL already includes /api, so use /biometrics/assist not /api/biometrics/assist
      const response = await apiClient.get("/biometrics/assist", {
        params: {
          assigned_faculty_id: facultyId,
          status: "assigned",
        },
      });

      const assistsData = response.data.assists || response.data || [];
      setAssists(assistsData);
      setEndpoint404(false);
    } catch (error) {
      // Handle 404 gracefully - endpoint may not be available yet
      if (error.response?.status === 404) {
        // Single-line warning as requested
        console.warn("biometrics/assist returned 404 (invalid path)");
        setAssists([]);
        setEndpoint404(true);
        return;
      }

      // Only log non-404 errors
      if (error.response?.status !== 404) {
        console.error("Failed to fetch assigned assists:", error);
      }
      setAssists([]);
      setEndpoint404(false);
    } finally {
      setLoading(false);
    }
  }, [facultyId]);

  useEffect(() => {
    if (expanded) {
      fetchAssists();
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchAssists, 30000);
      return () => clearInterval(interval);
    }
  }, [expanded, fetchAssists]);

  const handleComplete = useCallback(
    async (assistId) => {
      if (completingId) return;

      if (
        !confirm(
          "Mark this assist as completed? This will notify the student."
        )
      ) {
        return;
      }

      try {
        setCompletingId(assistId);
        const response = await apiClient.post("/biometrics/assist/complete", {
          requestId: assistId,
          facultyId: facultyId,
        });

        if (response.data.success) {
          // Remove from list
          setAssists((prev) =>
            prev.filter((a) => (a.id || a.requestId) !== assistId)
          );
          onAssistCompleted?.(assistId, response.data);
        }
      } catch (error) {
        console.error("Failed to complete assist:", error);
        alert(
          error.response?.data?.message || "Failed to mark assist as completed."
        );
      } finally {
        setCompletingId(null);
      }
    },
    [facultyId, onAssistCompleted, completingId]
  );

  const handleCancel = useCallback(
    async (assist) => {
      const assistId = assist.id || assist.requestId;

      if (
        cancellingId ||
        !window.confirm(
          `Are you sure you want to cancel this assist request for ${
            assist.student_name || assist.studentName
          }?`
        )
      ) {
        return;
      }

      try {
        setCancellingId(assistId);
        const response = await apiClient.post("/biometrics/assist/cancel", {
          requestId: assistId,
          reason: "Cancelled by faculty",
        });

        if (response.data.success) {
          // Remove from list
          setAssists((prev) =>
            prev.filter((a) => (a.id || a.requestId) !== assistId)
          );

          alert("Assist request cancelled successfully.");
          onAssistCancelled?.(assist);
          fetchAssists();
        }
      } catch (error) {
        console.error("Failed to cancel assist:", error);
        alert(
          error.response?.data?.message ||
            "Failed to cancel assist request."
        );
      } finally {
        setCancellingId(null);
      }
    },
    [cancellingId, fetchAssists, onAssistCancelled]
  );

  const handleContact = useCallback((assist) => {
    const email = assist.student_email || assist.studentEmail;
    const phone = assist.student_mobile || assist.studentMobile;

    if (email) {
      window.location.href = `mailto:${email}`;
    } else if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      alert("No contact information available for this student.");
    }
  }, []);

  const activeAssists = assists.filter(
    (a) => a.status === "assigned" || a.assigned_faculty_id === facultyId
  );

  return (
    <div className={styles.container}>
      <div
        className={styles.header}
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setExpanded(!expanded);
          }
        }}
      >
        <h3 className={styles.title}>
          <i className="bx bx-user-check"></i>
          Assigned to Me
          {activeAssists.length > 0 && (
            <span className={styles.badge}>{activeAssists.length}</span>
          )}
        </h3>
        <i
          className={`bx ${expanded ? "bx-chevron-up" : "bx-chevron-down"}`}
        ></i>
      </div>

      {expanded && (
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>Loading assists...</div>
          ) : endpoint404 ? (
            <div className={styles.empty}>
              <p>Assigned assists unavailable.</p>
              <button
                className={styles.retryBtn}
                onClick={fetchAssists}
                type="button"
              >
                Retry
              </button>
            </div>
          ) : activeAssists.length === 0 ? (
            <div className={styles.empty}>
              {loading === false
                ? "No assigned assist requests."
                : ""}
            </div>
          ) : (
            <ul className={styles.list}>
              {activeAssists.map((assist) => {
                const isCompleting =
                  completingId === (assist.id || assist.requestId);

                return (
                  <li
                    key={assist.id || assist.requestId}
                    className={styles.item}
                  >
                    <div className={styles.itemHeader}>
                      <div className={styles.studentInfo}>
                        <strong>
                          {assist.student_name || assist.studentName}
                        </strong>
                        {assist.student_roll_no || assist.studentRollNo ? (
                          <span className={styles.rollNo}>
                            ({assist.student_roll_no || assist.studentRollNo})
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {assist.course_name && (
                      <div className={styles.course}>
                        Course: {assist.course_name}
                      </div>
                    )}

                    {assist.message && (
                      <div className={styles.message}>
                        {assist.message.length > 100
                          ? `${assist.message.substring(0, 100)}...`
                          : assist.message}
                      </div>
                    )}

                    <div className={styles.footer}>
                      <span className={styles.timestamp}>
                        Assigned:{" "}
                        {new Date(
                          assist.assigned_at || assist.updated_at
                        ).toLocaleString()}
                      </span>
                      <div className={styles.actions}>
                        <button
                          className={styles.contactBtn}
                          onClick={() => handleContact(assist)}
                          title="Contact student"
                        >
                          <i className="bx bx-envelope"></i>
                          Contact
                        </button>
                        <button
                          className={styles.cancelBtn}
                          onClick={() => handleCancel(assist)}
                          disabled={
                            cancellingId === (assist.id || assist.requestId)
                          }
                          title="Cancel this assist request"
                        >
                          {cancellingId === (assist.id || assist.requestId)
                            ? "Cancelling..."
                            : "Cancel"}
                        </button>
                        <button
                          className={styles.completeBtn}
                          onClick={() =>
                            handleComplete(assist.id || assist.requestId)
                          }
                          disabled={isCompleting}
                        >
                          {isCompleting ? "Completing..." : "Mark Complete"}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default AssignedAssists;
