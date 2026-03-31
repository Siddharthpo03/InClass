import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../../utils/apiClient";
import styles from "./AuditExport.module.css";

const AuditExport = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "",
    startDate: "",
    endDate: "",
    search: "",
  });
  const [exporting, setExporting] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.type) params.type = filters.type;
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;

      // Try to fetch from reports endpoint or create a mock for now
      try {
        const response = await apiClient.get("/reports/audit-logs", { params });
        setLogs(response.data.logs || response.data || []);
      } catch {
        // Endpoint may not exist yet - use biometric_assist table as audit source
        console.warn("Audit logs endpoint not available, using assist requests as audit source");
        const assistsResponse = await apiClient.get("/biometrics/assist", {});
        const assists = assistsResponse.data.assists || assistsResponse.data || [];
        // Convert assists to audit log format
        setLogs(
          assists.map((a) => ({
            id: a.id || a.request_id,
            type: "biometric_assist",
            action: a.status,
            user_id: a.student_id,
            user_name: a.student_name || a.studentName,
            details: {
              request_id: a.id || a.request_id,
              status: a.status,
              assigned_to: a.assigned_faculty_id,
            },
            timestamp: a.created_at || a.requested_at,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filters.type, filters.startDate, filters.endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Filter logs by search term
  const filteredLogs = logs.filter((log) => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      (log.user_name || "").toLowerCase().includes(searchLower) ||
      (log.action || "").toLowerCase().includes(searchLower) ||
      (log.type || "").toLowerCase().includes(searchLower)
    );
  });

  const handleExportCSV = useCallback(async () => {
    try {
      setExporting(true);
      const csvContent = [
        ["Timestamp", "Type", "Action", "User", "Details"].join(","),
        ...filteredLogs.map((log) =>
          [
            new Date(log.timestamp).toISOString(),
            log.type || "",
            log.action || "",
            log.user_name || "",
            JSON.stringify(log.details || {}).replace(/"/g, '""'),
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export CSV:", error);
      alert("Failed to export CSV");
    } finally {
      setExporting(false);
    }
  }, [filteredLogs]);

  const handleExportPDF = useCallback(async () => {
    alert(
      "PDF export feature requires a backend endpoint. Please use CSV export for now."
    );
  }, []);

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Audit Logs & Exports</h2>
        <div className={styles.headerActions}>
          <button
            className={styles.exportBtn}
            onClick={handleExportCSV}
            disabled={exporting || filteredLogs.length === 0}
            type="button"
          >
            <i className="bx bx-download"></i>
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
          <button
            className={styles.exportBtn}
            onClick={handleExportPDF}
            disabled={true}
            type="button"
            title="PDF export coming soon"
          >
            <i className="bx bx-file"></i>
            Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Search logs..."
          className={styles.searchInput}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select
          className={styles.filterSelect}
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="">All Types</option>
          <option value="biometric_assist">Biometric Assist</option>
          <option value="registration">Registration</option>
          <option value="attendance">Attendance</option>
          <option value="user_action">User Action</option>
        </select>
        <input
          type="date"
          className={styles.dateInput}
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
          placeholder="Start Date"
        />
        <input
          type="date"
          className={styles.dateInput}
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
          placeholder="End Date"
        />
      </div>

      {/* Logs Table */}
      {loading ? (
        <div className={styles.loading}>Loading audit logs...</div>
      ) : filteredLogs.length === 0 ? (
        <div className={styles.empty}>No audit logs found for the selected filters.</div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Type</th>
                <th>Action</th>
                <th>User</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id}>
                  <td>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td>
                    <span className={styles.typeBadge}>{log.type || "N/A"}</span>
                  </td>
                  <td>{log.action || "N/A"}</td>
                  <td>{log.user_name || "N/A"}</td>
                  <td>
                    <details className={styles.details}>
                      <summary>View Details</summary>
                      <pre className={styles.detailsContent}>
                        {JSON.stringify(log.details || {}, null, 2)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredLogs.length > 0 && (
        <div className={styles.footer}>
          <p>Showing {filteredLogs.length} of {logs.length} audit log entries</p>
        </div>
      )}
    </div>
  );
};

export default AuditExport;









