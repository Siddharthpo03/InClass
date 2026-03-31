import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FixedSizeList as List } from "react-window";
import apiClient from "../../utils/apiClient";
import TopNav from "../../components/faculty/TopNav";
import Sidebar from "../../components/faculty/Sidebar";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ToastContainer from "../../components/shared/ToastContainer";
import StatCard from "../../components/shared/StatCard";
import styles from "./CourseDetail.module.css";

const CourseDetail = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facultyProfile, setFacultyProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

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

  // Fetch course and roster
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, rosterRes] = await Promise.all([
          apiClient.get(`/faculty/courses/${courseId}`).catch((err) => {
            console.error("Course fetch error:", err);
            return { data: null };
          }),
          apiClient.get(`/faculty/course-roster/${courseId}`).catch((err) => {
            console.error("Roster fetch error:", err);
            return { data: { roster: [] } };
          }),
        ]);

        console.log("Course response:", courseRes.data);
        console.log("Roster response:", rosterRes.data);

        if (courseRes.data) {
          setCourse(courseRes.data);
        } else {
          showToast("Course not found or access denied.", "error");
        }
        
        setRoster(rosterRes.data?.roster || rosterRes.data || []);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch course data:", error);
        showToast(
          error.response?.data?.message || "Failed to load course data.",
          "error"
        );
        setLoading(false);
      }
    };

    if (courseId) {
      fetchData();
    }
  }, [courseId, showToast]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("inclass_token");
    localStorage.removeItem("user_role");
    navigate("/login");
  }, [navigate]);

  const stats = useMemo(() => {
    return {
      totalStudents: roster.length,
      enrolled: roster.filter((s) => s.enrolled).length,
      pending: roster.filter((s) => s.status === "pending").length,
    };
  }, [roster]);

  const StudentRow = ({ index, style, data }) => {
    const student = data[index];
    return (
      <div style={style}>
        <div className={styles.studentItem}>
          <div className={styles.studentInfo}>
            <h4 className={styles.studentName}>{student.name}</h4>
            <p className={styles.studentRoll}>{student.roll_no || student.rollNo}</p>
            <p className={styles.studentEmail}>{student.email}</p>
          </div>
          <div className={styles.studentStatus}>
            <span
              className={`${styles.statusBadge} ${
                student.enrolled ? styles.enrolled : styles.pending
              }`}
            >
              {student.enrolled ? "Enrolled" : "Pending"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading course details..." />;
  }

  if (!course) {
    return (
      <div className={styles.errorContainer}>
        <p>Course not found</p>
        <button onClick={() => navigate("/faculty/courses")}>Back to Courses</button>
      </div>
    );
  }

  return (
    <div className={styles.detailWrapper}>
      <TopNav profile={facultyProfile} onLogout={handleLogout} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.detailContainer}>
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
            onClick={() => navigate("/faculty/courses")}
            type="button"
          >
            <i className="bx bx-arrow-back"></i>
            Back
          </button>
          <div>
            <h1 className={styles.title}>{course.title}</h1>
            <p className={styles.courseCode}>{course.course_code}</p>
          </div>
        </header>

        <section className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <StatCard
              value={stats.totalStudents}
              label="Total Students"
              icon="bx-group"
              variant="default"
            />
            <StatCard
              value={stats.enrolled}
              label="Enrolled"
              icon="bx-check-circle"
              variant="success"
            />
            <StatCard
              value={stats.pending}
              label="Pending"
              icon="bx-time"
              variant="warning"
            />
          </div>
        </section>

        <section className={styles.rosterSection}>
          <h2 className={styles.sectionTitle}>Course Roster</h2>
          {roster.length === 0 ? (
            <div className={styles.emptyState}>
              <i className="bx bx-user-x"></i>
              <p>No students enrolled in this course</p>
            </div>
          ) : (
            <div className={styles.rosterList}>
              <List
                height={Math.min(500, Math.max(300, roster.length * 80))}
                itemCount={roster.length}
                itemSize={80}
                itemData={roster}
                width="100%"
                overscanCount={3}
              >
                {StudentRow}
              </List>
            </div>
          )}
        </section>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default React.memo(CourseDetail);


