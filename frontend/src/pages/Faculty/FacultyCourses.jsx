import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FixedSizeList as List } from "react-window";
import apiClient from "../../utils/apiClient";
import TopNav from "../../components/faculty/TopNav";
import Sidebar from "../../components/faculty/Sidebar";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import SkeletonLoader from "../../components/shared/SkeletonLoader";
import ToastContainer from "../../components/shared/ToastContainer";
import Modal from "../../components/shared/Modal";
import StatCard from "../../components/shared/StatCard";
import useFormValidation from "../../hooks/useFormValidation";
import styles from "./FacultyCourses.module.css";

const FacultyCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facultyProfile, setFacultyProfile] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Course creation form state with validation
  const {
    values: formValues,
    errors: formErrors,
    touched: formTouched,
    handleChange: handleFormChange,
    handleBlur: handleFormBlur,
    validateAll: validateForm,
    reset: resetForm,
  } = useFormValidation(
    { courseCode: "", courseTitle: "", numClasses: "" },
    {
      courseCode: [
        { required: true, message: "Course code is required" },
        { min: 2, message: "Course code must be at least 2 characters" },
        { max: 10, message: "Course code must be at most 10 characters" },
        {
          pattern: /^[A-Z0-9]+$/,
          message: "Course code must contain only uppercase letters and numbers",
        },
      ],
      courseTitle: [
        { required: true, message: "Course title is required" },
        { min: 3, message: "Course title must be at least 3 characters" },
        { max: 255, message: "Course title must be at most 255 characters" },
      ],
      numClasses: [
        { required: true, message: "Total classes is required" },
        { minValue: 1, message: "Total classes must be at least 1" },
        { maxValue: 1000, message: "Total classes must be at most 1000" },
      ],
    }
  );

  const [creating, setCreating] = useState(false);

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

  // Fetch courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await apiClient.get("/faculty/my-courses");
        
        // Handle different response formats
        let coursesData = [];
        if (Array.isArray(response.data)) {
          coursesData = response.data;
        } else if (response.data?.courses) {
          coursesData = response.data.courses;
        } else if (response.data?.data) {
          coursesData = response.data.data;
        } else {
          coursesData = [];
        }
        
        console.log("Parsed courses:", coursesData);
        setCourses(coursesData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        console.error("Error details:", error.response?.data || error.message);
        showToast(
          error.response?.data?.message || 
          "Failed to load courses. Please refresh.", 
          "error"
        );
        setCourses([]); // Set empty array on error
        setLoading(false);
      }
    };
    fetchCourses();
  }, [showToast]);

  const handleCreateCourse = useCallback(
    async (e) => {
      e.preventDefault();
      
      // Validate form
      if (!validateForm()) {
        showToast("Please fix form errors before submitting.", "error");
        return;
      }

      setCreating(true);

      // Optimistic update - add course immediately
      const optimisticCourse = {
        id: `temp-${Date.now()}`,
        course_code: formValues.courseCode.toUpperCase(),
        title: formValues.courseTitle,
        total_classes: parseInt(formValues.numClasses),
        student_count: 0,
        has_active_session: false,
        isOptimistic: true,
      };

      // Add optimistically
      setCourses((prev) => [...prev, optimisticCourse]);
      const formData = {
        course_code: formValues.courseCode.toUpperCase(),
        title: formValues.courseTitle,
        total_classes: parseInt(formValues.numClasses),
      };

      // Clear form immediately for better UX
      resetForm();
      setShowCreateModal(false);

      try {
        const payload = {
          course_code: formData.course_code,
          title: formData.title,
          total_classes: formData.total_classes,
        };

        const response = await apiClient.post("/faculty/register-course", payload);
        const newCourse = response.data.course;

        // Replace optimistic course with real one
        setCourses((prev) =>
          prev.map((c) => (c.isOptimistic ? newCourse : c))
        );
        showToast(`Course ${newCourse.title} created successfully.`, "success");
      } catch (error) {
        // Rollback optimistic update
        setCourses((prev) => prev.filter((c) => !c.isOptimistic));
        // Restore form data
        handleFormChange("courseCode", formData.course_code);
        handleFormChange("courseTitle", formData.title);
        handleFormChange("numClasses", formData.total_classes.toString());
        setShowCreateModal(true);
        
        const msg =
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          "Failed to create course.";
        showToast(msg, "error");
      } finally {
        setCreating(false);
      }
    },
    [formValues, validateForm, resetForm, handleFormChange, showToast]
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem("inclass_token");
    localStorage.removeItem("user_role");
    navigate("/login");
  }, [navigate]);

  const stats = useMemo(() => {
    const totalStudents = courses.reduce((sum, course) => sum + (course.student_count || 0), 0);
    return {
      totalCourses: courses.length,
      totalStudents,
      activeSessions: courses.filter((c) => c.has_active_session).length,
    };
  }, [courses]);

  const CourseRow = ({ index, style, data }) => {
    const course = data[index];
    if (!course) return null;
    return (
      <div style={style}>
        <div
          className={styles.courseItem}
          onClick={() => navigate(`/faculty/courses/${course.id}`)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate(`/faculty/courses/${course.id}`);
            }
          }}
        >
          <div className={styles.courseInfo}>
            <h3 className={styles.courseTitle}>{course.title || course.course_code || 'Untitled Course'}</h3>
            <p className={styles.courseCode}>{course.course_code || 'N/A'}</p>
            <div className={styles.courseMeta}>
              <span>
                <i className="bx bx-group"></i> {course.student_count || 0} students
              </span>
              <span>
                <i className="bx bx-calendar"></i> {course.total_classes || 0} classes
              </span>
            </div>
          </div>
          <div className={styles.courseActions}>
            <button
              className={styles.viewButton}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/faculty/courses/${course.id}`);
              }}
              type="button"
              aria-label={`View ${course.title || course.course_code}`}
            >
              <i className="bx bx-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.coursesWrapper}>
        <TopNav profile={facultyProfile} onLogout={handleLogout} />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className={styles.coursesContainer}>
          <div className={styles.skeletonContainer}>
            <SkeletonLoader variant="text" lines={2} width="60%" />
            <div style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
              <SkeletonLoader variant="card" />
              <SkeletonLoader variant="card" />
              <SkeletonLoader variant="card" />
            </div>
            <div style={{ marginTop: "2rem" }}>
              <SkeletonLoader variant="card" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.coursesWrapper}>
      <TopNav profile={facultyProfile} onLogout={handleLogout} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.coursesContainer}>
        <button
          className={styles.mobileMenuButton}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
          type="button"
        >
          <i className="bx bx-menu"></i>
        </button>

        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>My Courses</h1>
            <p className={styles.subtitle}>Manage your courses and students</p>
          </div>
          <button
            className={styles.createButton}
            onClick={() => setShowCreateModal(true)}
            type="button"
          >
            <i className="bx bx-plus"></i>
            Create Course
          </button>
        </header>

        <section className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <StatCard
              value={stats.totalCourses}
              label="Total Courses"
              icon="bx-book"
              variant="info"
            />
            <StatCard
              value={stats.totalStudents}
              label="Total Students"
              icon="bx-group"
              variant="default"
            />
            <StatCard
              value={stats.activeSessions}
              label="Active Sessions"
              icon="bx-calendar-check"
              variant="success"
            />
          </div>
        </section>

        <section className={styles.coursesSection}>
          {courses.length === 0 ? (
            <div className={styles.emptyState}>
              <i className="bx bx-book-open"></i>
              <h3>No courses yet</h3>
              <p>Create your first course to get started</p>
              <button
                className={styles.createButton}
                onClick={() => setShowCreateModal(true)}
                type="button"
              >
                <i className="bx bx-plus"></i>
                Create Course
              </button>
            </div>
          ) : (
            <div className={styles.coursesList}>
              {courses && courses.length > 0 ? (
                <List
                  height={Math.min(600, Math.max(300, courses.length * 100))}
                  itemCount={courses.length}
                  itemSize={100}
                  itemData={courses}
                  width="100%"
                  overscanCount={3}
                >
                  {CourseRow}
                </List>
              ) : (
                <div className={styles.emptyState}>
                  <i className="bx bx-book-open"></i>
                  <h3>No courses found</h3>
                  <p>Try refreshing the page or create a new course</p>
                  <button
                    className={styles.createButton}
                    onClick={() => setShowCreateModal(true)}
                    type="button"
                  >
                    <i className="bx bx-plus"></i>
                    Create Course
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Create Course Modal */}
        <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Course"
      >
        <form onSubmit={handleCreateCourse} className={styles.createForm}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Course Code <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., CS401"
              value={formValues.courseCode}
              onChange={(e) =>
                handleFormChange("courseCode", e.target.value.toUpperCase())
              }
              onBlur={() => handleFormBlur("courseCode")}
              className={`${styles.formInput} ${
                formTouched.courseCode && formErrors.courseCode
                  ? styles.inputError
                  : ""
              }`}
            />
            {formTouched.courseCode && formErrors.courseCode && (
              <span className={styles.errorMessage}>
                {formErrors.courseCode}
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Course Title <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Database Systems"
              value={formValues.courseTitle}
              onChange={(e) => handleFormChange("courseTitle", e.target.value)}
              onBlur={() => handleFormBlur("courseTitle")}
              className={`${styles.formInput} ${
                formTouched.courseTitle && formErrors.courseTitle
                  ? styles.inputError
                  : ""
              }`}
            />
            {formTouched.courseTitle && formErrors.courseTitle && (
              <span className={styles.errorMessage}>
                {formErrors.courseTitle}
              </span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              Total Classes <span className={styles.required}>*</span>
            </label>
            <input
              type="number"
              placeholder="e.g., 40"
              value={formValues.numClasses}
              onChange={(e) => handleFormChange("numClasses", e.target.value)}
              onBlur={() => handleFormBlur("numClasses")}
              className={`${styles.formInput} ${
                formTouched.numClasses && formErrors.numClasses
                  ? styles.inputError
                  : ""
              }`}
              min="1"
            />
            {formTouched.numClasses && formErrors.numClasses && (
              <span className={styles.errorMessage}>
                {formErrors.numClasses}
              </span>
            )}
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={creating || !formValues.courseCode || !formValues.courseTitle || !formValues.numClasses || parseInt(formValues.numClasses) < 1}
            >
              {creating ? "Creating..." : "Create Course"}
            </button>
          </div>
        </form>
      </Modal>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default React.memo(FacultyCourses);


