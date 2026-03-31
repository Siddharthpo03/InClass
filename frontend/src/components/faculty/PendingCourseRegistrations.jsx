import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../../utils/apiClient";
import Modal from "../shared/Modal";
import styles from "./PendingCourseRegistrations.module.css";

const PendingCourseRegistrations = ({
  onRegistrationProcessed,
}) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [action, setAction] = useState(null); // 'approve' or 'reject'
  const [rejectionReason, setRejectionReason] = useState("");
  const [endpointUnavailable, setEndpointUnavailable] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      setEndpointUnavailable(false);
      
      const response = await apiClient.get("/registrations/pending");
      
      const regData = response.data.registrations || response.data || [];
      setRegistrations(regData);
    } catch (error) {
      // Handle 404 gracefully - suppress stack traces and show friendly message
      if (error.response?.status === 404) {
        // Log compact single-line warning (no stack trace)
        console.warn("Pending registrations endpoint not found (404)");
        
        // Set state for UI fallback
        setEndpointUnavailable(true);
        setRegistrations([]);
        return; // Exit early to prevent further error handling
      }
      
      // Only log non-404 errors
      if (error.response?.status !== 404) {
        console.error("Failed to fetch course registrations:", error);
      }
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (expanded) {
      fetchRegistrations();
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchRegistrations, 30000);
      return () => clearInterval(interval);
    }
  }, [expanded, fetchRegistrations]);

  const handleApprove = useCallback(
    async (registrationId) => {
      if (processingId) return;
      
      try {
        setProcessingId(registrationId);
        setAction("approve");
        
        // Call approve endpoint (you may need to create this)
        const response = await apiClient.post(
          `/faculty/registrations/${registrationId}/approve`
        );

        if (response.data.success) {
          setRegistrations((prev) =>
            prev.filter((r) => r.id !== registrationId)
          );
          onRegistrationProcessed?.(registrationId, "approved", response.data);
        }
      } catch (error) {
        console.error("Failed to approve registration:", error);
        alert(
          error.response?.data?.message ||
            "Failed to approve course registration."
        );
      } finally {
        setProcessingId(null);
        setAction(null);
      }
    },
    [onRegistrationProcessed, processingId]
  );

  const handleReject = useCallback(
    async (registrationId) => {
      if (processingId || !rejectionReason.trim()) {
        if (!rejectionReason.trim()) {
          alert("Please provide a reason for rejection");
        }
        return;
      }
      
      try {
        setProcessingId(registrationId);
        setAction("reject");
        
        const response = await apiClient.post(
          `/faculty/registrations/${registrationId}/reject`,
          { reason: rejectionReason }
        );

        if (response.data.success) {
          setRegistrations((prev) =>
            prev.filter((r) => r.id !== registrationId)
          );
          setRejectionReason("");
          onRegistrationProcessed?.(registrationId, "rejected", response.data);
        }
      } catch (error) {
        console.error("Failed to reject registration:", error);
        alert(
          error.response?.data?.message ||
            "Failed to reject course registration."
        );
      } finally {
        setProcessingId(null);
        setAction(null);
      }
    },
    [onRegistrationProcessed, processingId, rejectionReason]
  );

  const handleViewDetails = useCallback((registration) => {
    setSelectedRegistration(registration);
    setShowDetailsModal(true);
  }, []);

  const pendingRegistrations = registrations.filter(
    (r) => r.status === "pending" || !r.status
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
          <i className="bx bx-book-add"></i>
          Pending Course Registrations
          {pendingRegistrations.length > 0 && (
            <span className={styles.badge}>{pendingRegistrations.length}</span>
          )}
        </h3>
        <i
          className={`bx ${expanded ? "bx-chevron-up" : "bx-chevron-down"}`}
        ></i>
      </div>

      {expanded && (
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>Loading registrations...</div>
          ) : endpointUnavailable ? (
            <div className={styles.empty}>
              <p>Pending registrations temporarily unavailable.</p>
              <button
                className={styles.retryBtn}
                onClick={fetchRegistrations}
                type="button"
              >
                Retry
              </button>
            </div>
          ) : pendingRegistrations.length === 0 ? (
            <div className={styles.empty}>
              No pending course registration requests.
            </div>
          ) : (
            <ul className={styles.list}>
              {pendingRegistrations.map((reg) => {
                const isProcessing = processingId === reg.id;

                return (
                  <li key={reg.id} className={styles.item}>
                    <div className={styles.itemHeader}>
                      <div className={styles.studentInfo}>
                        <strong>{reg.studentName || reg.student_name}</strong>
                        {reg.studentRollNo || reg.student_roll_no ? (
                          <span className={styles.rollNo}>
                            ({reg.studentRollNo || reg.student_roll_no})
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className={styles.course}>
                      <strong>Course:</strong> {reg.courseName || reg.course_name} ({reg.courseCode || reg.course_code})
                    </div>

                    <div className={styles.footer}>
                      <span className={styles.timestamp}>
                        {new Date(
                          reg.requestedAt || reg.requested_at
                        ).toLocaleString()}
                      </span>
                      <div className={styles.actions}>
                        <button
                          className={styles.viewBtn}
                          onClick={() => handleViewDetails(reg)}
                        >
                          View Details
                        </button>
                        <button
                          className={styles.rejectBtn}
                          onClick={() => {
                            const reason = prompt("Enter rejection reason:");
                            if (reason) {
                              setRejectionReason(reason);
                              handleReject(reg.id);
                            }
                          }}
                          disabled={isProcessing}
                        >
                          {isProcessing && action === "reject" ? "Rejecting..." : "Reject"}
                        </button>
                        <button
                          className={styles.approveBtn}
                          onClick={() => handleApprove(reg.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing && action === "approve" ? "Approving..." : "Approve"}
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

      {showDetailsModal && selectedRegistration && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRegistration(null);
          }}
          title="Course Registration Request Details"
        >
          <div className={styles.modalContent}>
            <div className={styles.detailRow}>
              <strong>Student:</strong>
              <span>
                {selectedRegistration.studentName || selectedRegistration.student_name}
                {selectedRegistration.studentRollNo || selectedRegistration.student_roll_no
                  ? ` (${selectedRegistration.studentRollNo || selectedRegistration.student_roll_no})`
                  : ""}
              </span>
            </div>
            <div className={styles.detailRow}>
              <strong>Email:</strong>
              <span>{selectedRegistration.studentEmail || selectedRegistration.student_email || "N/A"}</span>
            </div>
            <div className={styles.detailRow}>
              <strong>Course:</strong>
              <span>
                {selectedRegistration.courseName || selectedRegistration.course_name} 
                ({selectedRegistration.courseCode || selectedRegistration.course_code})
              </span>
            </div>
            <div className={styles.detailRow}>
              <strong>Requested At:</strong>
              <span>
                {new Date(
                  selectedRegistration.requestedAt || selectedRegistration.requested_at
                ).toLocaleString()}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PendingCourseRegistrations;

