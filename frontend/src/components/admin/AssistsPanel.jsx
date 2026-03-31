import React, { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "../../utils/apiClient";
import Modal from "../shared/Modal";
import styles from "./AssistsPanel.module.css";

const AssistsPanel = ({ onAssistUpdated }) => {
  const [assists, setAssists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssist, setSelectedAssist] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [faculties, setFaculties] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    college_id: "",
    department_id: "",
    search: "",
  });

  const fetchAssists = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.college_id) params.college_id = filters.college_id;
      if (filters.department_id) params.department_id = filters.department_id;

      const response = await apiClient.get("/biometrics/assist", { params });
      const assistsData = response.data.assists || response.data || [];
      setAssists(assistsData);
    } catch (error) {
      console.error("Failed to fetch assists:", error);
      setAssists([]);
    } finally {
      setLoading(false);
    }
  }, [filters.status, filters.college_id, filters.department_id]);

  useEffect(() => {
    fetchAssists();
  }, [fetchAssists]);

  // Fetch faculties for assignment
  const fetchFaculties = useCallback(async () => {
    try {
      const response = await apiClient.get("/users", {
        params: { role: "faculty" },
      });
      setFaculties(response.data.users || response.data || []);
    } catch (error) {
      console.error("Failed to fetch faculties:", error);
      setFaculties([]);
    }
  }, []);

  useEffect(() => {
    if (showAssignModal || showReassignModal) {
      fetchFaculties();
    }
  }, [showAssignModal, showReassignModal, fetchFaculties]);

  // Filter assists by search term
  const filteredAssists = useMemo(() => {
    let result = assists;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (a) =>
          (a.student_name || a.studentName || "").toLowerCase().includes(searchLower) ||
          (a.student_roll_no || a.studentRollNo || "").toLowerCase().includes(searchLower) ||
          (a.college_name || "").toLowerCase().includes(searchLower) ||
          (a.department_name || "").toLowerCase().includes(searchLower)
      );
    }
    return result;
  }, [assists, filters.search]);

  const handleViewDetails = useCallback((assist) => {
    setSelectedAssist(assist);
    setShowDetailsModal(true);
  }, []);

  const handleAssign = useCallback((assist) => {
    setSelectedAssist(assist);
    setShowAssignModal(true);
  }, []);

  const handleReassign = useCallback((assist) => {
    setSelectedAssist(assist);
    setShowReassignModal(true);
  }, []);

  const handleAssignSubmit = useCallback(
    async (facultyId) => {
      if (!selectedAssist || !facultyId) return;

      try {
        const response = await apiClient.post("/biometrics/assist/assign", {
          requestId: selectedAssist.id || selectedAssist.request_id,
          facultyId: facultyId,
        });

        if (response.data.success) {
          setShowAssignModal(false);
          setSelectedAssist(null);
          fetchAssists();
          onAssistUpdated?.();
        }
      } catch (error) {
        console.error("Failed to assign assist:", error);
        alert(
          error.response?.data?.message || "Failed to assign assist."
        );
      }
    },
    [selectedAssist, fetchAssists, onAssistUpdated]
  );

  const handleReassignSubmit = useCallback(
    async (facultyId) => {
      if (!selectedAssist || !facultyId) return;

      try {
        // Use assign endpoint with reassign flag or create reassign endpoint
        const response = await apiClient.post("/biometrics/assist/assign", {
          requestId: selectedAssist.id || selectedAssist.request_id,
          facultyId: facultyId,
          reassign: true,
        });

        if (response.data.success) {
          setShowReassignModal(false);
          setSelectedAssist(null);
          fetchAssists();
          onAssistUpdated?.();
        }
      } catch (error) {
        console.error("Failed to reassign assist:", error);
        alert(
          error.response?.data?.message || "Failed to reassign assist."
        );
      }
    },
    [selectedAssist, fetchAssists, onAssistUpdated]
  );

  const handleMarkUnable = useCallback(
    async (assist) => {
      if (
        !window.confirm(
          "Mark this request as unable to complete? This will notify the student."
        )
      ) {
        return;
      }

      try {
        // Use cancel endpoint with special reason
        const response = await apiClient.post("/biometrics/assist/cancel", {
          requestId: assist.id || assist.request_id,
          reason: "Marked as unable to complete by admin",
        });

        if (response.data.success) {
          fetchAssists();
          onAssistUpdated?.();
        }
      } catch (error) {
        console.error("Failed to mark unable:", error);
        alert(
          error.response?.data?.message || "Failed to mark request as unable."
        );
      }
    },
    [fetchAssists, onAssistUpdated]
  );

  const getStatusBadgeClass = (status) => {
    const statusLower = (status || "").toLowerCase();
    if (statusLower === "completed") return styles.statusCompleted;
    if (statusLower === "assigned" || statusLower === "in_progress")
      return styles.statusAssigned;
    if (statusLower === "cancelled") return styles.statusCancelled;
    return styles.statusPending;
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Assist Management</h2>
        <button
          className={styles.refreshBtn}
          onClick={fetchAssists}
          type="button"
          disabled={loading}
        >
          <i className="bx bx-refresh"></i>
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search by student name, roll no, college..."
          className={styles.searchInput}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          className={styles.filterSelect}
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className={styles.loading}>Loading assists...</div>
      ) : filteredAssists.length === 0 ? (
        <div className={styles.empty}>No assist requests found.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Student</th>
                <th>College</th>
                <th>Department</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssists.map((assist) => (
                <tr key={assist.id || assist.request_id}>
                  <td>#{assist.id || assist.request_id}</td>
                  <td>
                    <div className={styles.studentCell}>
                      <strong>{assist.student_name || assist.studentName}</strong>
                      <span className={styles.rollNo}>
                        {assist.student_roll_no || assist.studentRollNo}
                      </span>
                    </div>
                  </td>
                  <td>{assist.college_name || "N/A"}</td>
                  <td>{assist.department_name || "N/A"}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${getStatusBadgeClass(
                        assist.status
                      )}`}
                    >
                      {assist.status || "pending"}
                    </span>
                  </td>
                  <td>
                    {assist.assigned_faculty_id
                      ? `Faculty #${assist.assigned_faculty_id}`
                      : "Unassigned"}
                  </td>
                  <td>
                    {new Date(
                      assist.created_at || assist.requested_at
                    ).toLocaleDateString()}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleViewDetails(assist)}
                        title="View details"
                        type="button"
                      >
                        <i className="bx bx-show"></i>
                      </button>
                      {assist.status === "pending" && (
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleAssign(assist)}
                          title="Assign to faculty"
                          type="button"
                        >
                          <i className="bx bx-user-plus"></i>
                        </button>
                      )}
                      {(assist.status === "assigned" ||
                        assist.status === "in_progress") && (
                        <button
                          className={styles.actionBtn}
                          onClick={() => handleReassign(assist)}
                          title="Reassign"
                          type="button"
                        >
                          <i className="bx bx-transfer"></i>
                        </button>
                      )}
                      {assist.status !== "completed" &&
                        assist.status !== "cancelled" && (
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleMarkUnable(assist)}
                            title="Mark unable"
                            type="button"
                          >
                            <i className="bx bx-x-circle"></i>
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedAssist && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedAssist(null);
          }}
          title="Assist Request Details"
        >
          <div className={styles.detailsContent}>
            <div className={styles.detailRow}>
              <strong>Request ID:</strong> #{selectedAssist.id || selectedAssist.request_id}
            </div>
            <div className={styles.detailRow}>
              <strong>Student:</strong> {selectedAssist.student_name || selectedAssist.studentName}
            </div>
            <div className={styles.detailRow}>
              <strong>Roll No:</strong> {selectedAssist.student_roll_no || selectedAssist.studentRollNo}
            </div>
            <div className={styles.detailRow}>
              <strong>College:</strong> {selectedAssist.college_name || "N/A"}
            </div>
            <div className={styles.detailRow}>
              <strong>Department:</strong> {selectedAssist.department_name || "N/A"}
            </div>
            <div className={styles.detailRow}>
              <strong>Status:</strong>{" "}
              <span
                className={`${styles.statusBadge} ${getStatusBadgeClass(
                  selectedAssist.status
                )}`}
              >
                {selectedAssist.status || "pending"}
              </span>
            </div>
            {selectedAssist.message && (
              <div className={styles.detailRow}>
                <strong>Message:</strong>
                <p>{selectedAssist.message}</p>
              </div>
            )}
            {selectedAssist.device_info && (
              <div className={styles.detailRow}>
                <strong>Device Info:</strong>
                <pre className={styles.deviceInfo}>
                  {JSON.stringify(selectedAssist.device_info, null, 2)}
                </pre>
              </div>
            )}
            <div className={styles.detailRow}>
              <strong>Created:</strong>{" "}
              {new Date(
                selectedAssist.created_at || selectedAssist.requested_at
              ).toLocaleString()}
            </div>
          </div>
        </Modal>
      )}

      {/* Assign Modal */}
      {showAssignModal && selectedAssist && (
        <AssignModal
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedAssist(null);
          }}
          assist={selectedAssist}
          faculties={faculties}
          onSubmit={handleAssignSubmit}
        />
      )}

      {/* Reassign Modal */}
      {showReassignModal && selectedAssist && (
        <AssignModal
          isOpen={showReassignModal}
          onClose={() => {
            setShowReassignModal(false);
            setSelectedAssist(null);
          }}
          assist={selectedAssist}
          faculties={faculties}
          onSubmit={handleReassignSubmit}
          isReassign={true}
        />
      )}
    </div>
  );
};

// Assign Modal Component
const AssignModal = ({
  isOpen,
  onClose,
  assist,
  faculties,
  onSubmit,
  isReassign = false,
}) => {
  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const [filteredFaculties, setFilteredFaculties] = useState([]);

  useEffect(() => {
    if (assist && faculties.length > 0) {
      // Filter faculties by college and department if available
      let filtered = faculties;
      if (assist.college_id) {
        filtered = filtered.filter((f) => f.college_id === assist.college_id);
      }
      if (assist.department_id) {
        filtered = filtered.filter(
          (f) => f.department_id === assist.department_id
        );
      }
      setFilteredFaculties(filtered);
    } else {
      setFilteredFaculties(faculties);
    }
  }, [assist, faculties]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedFacultyId) {
      onSubmit(selectedFacultyId);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReassign ? "Reassign Assist Request" : "Assign Assist Request"}
    >
      <form onSubmit={handleSubmit} className={styles.assignForm}>
        <div className={styles.formGroup}>
          <label>Select Faculty:</label>
          <select
            value={selectedFacultyId}
            onChange={(e) => setSelectedFacultyId(e.target.value)}
            required
            className={styles.facultySelect}
          >
            <option value="">-- Select Faculty --</option>
            {filteredFaculties.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.name} ({faculty.roll_no || faculty.email})
                {faculty.college && ` - ${faculty.college}`}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formActions}>
          <button type="button" onClick={onClose} className={styles.cancelBtn}>
            Cancel
          </button>
          <button type="submit" className={styles.submitBtn}>
            {isReassign ? "Reassign" : "Assign"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AssistsPanel;









