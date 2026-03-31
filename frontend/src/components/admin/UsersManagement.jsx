import React, { useState, useEffect, useCallback, useMemo } from "react";
import apiClient from "../../utils/apiClient";
import Modal from "../shared/Modal";
import styles from "./UsersManagement.module.css";

const UsersManagement = ({ onUserUpdated }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filters, setFilters] = useState({
    role: "",
    search: "",
    college_id: "",
    department_id: "",
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.role) params.role = filters.role;
      if (filters.college_id) params.college_id = filters.college_id;
      if (filters.department_id) params.department_id = filters.department_id;

      const response = await apiClient.get("/users", { params });
      const usersData = response.data.users || response.data || [];
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filters.role, filters.college_id, filters.department_id]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filter users by search term
  const filteredUsers = useMemo(() => {
    let result = users;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (u) =>
          (u.name || "").toLowerCase().includes(searchLower) ||
          (u.email || "").toLowerCase().includes(searchLower) ||
          (u.roll_no || "").toLowerCase().includes(searchLower)
      );
    }
    return result;
  }, [users, filters.search]);

  const handleViewDetails = useCallback((user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  }, []);

  const handleDisableUser = useCallback(
    async (user) => {
      if (
        !window.confirm(
          `Are you sure you want to disable user ${user.name}? They will not be able to log in.`
        )
      ) {
        return;
      }

      try {
        // Note: This endpoint may need to be created in backend
        const response = await apiClient.post(`/users/${user.id}/disable`, {
          reason: "Disabled by admin",
        });

        if (response.data.success) {
          fetchUsers();
          onUserUpdated?.();
          alert("User disabled successfully");
        }
      } catch (error) {
        console.error("Failed to disable user:", error);
        alert(
          error.response?.data?.message || "Failed to disable user. Endpoint may not exist yet."
        );
      }
    },
    [fetchUsers, onUserUpdated]
  );

  const handleForceLogout = useCallback(
    async (user) => {
      if (
        !window.confirm(
          `Force logout for user ${user.name}? This will invalidate all their active sessions.`
        )
      ) {
        return;
      }

      try {
        // Note: This endpoint may need to be created in backend
        const response = await apiClient.post(`/users/${user.id}/force-logout`);

        if (response.data.success) {
          alert("User logged out successfully");
        }
      } catch (error) {
        console.error("Failed to force logout:", error);
        alert(
          error.response?.data?.message || "Failed to force logout. Endpoint may not exist yet."
        );
      }
    },
    []
  );

  const getRoleBadgeClass = (role) => {
    if (role === "admin") return styles.roleAdmin;
    if (role === "faculty") return styles.roleFaculty;
    return styles.roleStudent;
  };

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>User Management</h2>
        <button
          className={styles.refreshBtn}
          onClick={fetchUsers}
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
          placeholder="Search by name, email, roll no..."
          className={styles.searchInput}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          className={styles.filterSelect}
          value={filters.role}
          onChange={(e) => setFilters({ ...filters, role: e.target.value })}
        >
          <option value="">All Roles</option>
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className={styles.loading}>Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <div className={styles.empty}>No users found.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Roll No</th>
                <th>Role</th>
                <th>College</th>
                <th>Department</th>
                <th>Biometrics</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.name}</strong>
                  </td>
                  <td>{user.email}</td>
                  <td>{user.roll_no || "N/A"}</td>
                  <td>
                    <span
                      className={`${styles.roleBadge} ${getRoleBadgeClass(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td>{user.college || "N/A"}</td>
                  <td>{user.department || "N/A"}</td>
                  <td>
                    <div className={styles.biometricStatus}>
                      {user.hasFace && (
                        <span className={styles.biometricBadge} title="Face enrolled">
                          <i className="bx bx-face"></i>
                        </span>
                      )}
                      {user.hasFace && (
                        <span className={styles.biometricBadge} title="Face enrolled">
                          <i className="bx bx-face"></i>
                        </span>
                      )}
                      {!user.hasFace && (
                        <span className={styles.biometricBadge} title="No biometrics">
                          <i className="bx bx-x"></i>
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    {user.last_login
                      ? new Date(user.last_login).toLocaleDateString()
                      : "Never"}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleViewDetails(user)}
                        title="View details"
                        type="button"
                      >
                        <i className="bx bx-show"></i>
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleDisableUser(user)}
                        title="Disable user"
                        type="button"
                      >
                        <i className="bx bx-user-x"></i>
                      </button>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleForceLogout(user)}
                        title="Force logout"
                        type="button"
                      >
                        <i className="bx bx-log-out"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedUser && (
        <Modal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
          title="User Details"
        >
          <div className={styles.detailsContent}>
            <div className={styles.detailRow}>
              <strong>Name:</strong> {selectedUser.name}
            </div>
            <div className={styles.detailRow}>
              <strong>Email:</strong> {selectedUser.email}
            </div>
            <div className={styles.detailRow}>
              <strong>Roll No:</strong> {selectedUser.roll_no || "N/A"}
            </div>
            <div className={styles.detailRow}>
              <strong>Role:</strong>{" "}
              <span
                className={`${styles.roleBadge} ${getRoleBadgeClass(
                  selectedUser.role
                )}`}
              >
                {selectedUser.role}
              </span>
            </div>
            <div className={styles.detailRow}>
              <strong>College:</strong> {selectedUser.college || "N/A"}
            </div>
            <div className={styles.detailRow}>
              <strong>Department:</strong> {selectedUser.department || "N/A"}
            </div>
            <div className={styles.detailRow}>
              <strong>Biometrics:</strong>
              <div className={styles.biometricStatus}>
                {selectedUser.hasFace && <span>✓ Face enrolled</span>}
                {!selectedUser.hasFace && (
                  <span>No face enrolled</span>
                )}
              </div>
            </div>
            <div className={styles.detailRow}>
              <strong>Last Login:</strong>{" "}
              {selectedUser.last_login
                ? new Date(selectedUser.last_login).toLocaleString()
                : "Never"}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UsersManagement;









