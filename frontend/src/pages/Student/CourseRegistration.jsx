import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FixedSizeList as List } from "react-window";
import apiClient from "../../utils/apiClient";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ToastContainer from "../../components/shared/ToastContainer";
import styles from "./CourseRegistration.module.css";

/**
 * CourseRegistration - Student course registration page
 * 
 * Shows faculty filtered by college/department with their courses.
 * Allows students to register for courses.
 */
const CourseRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [faculty, setFaculty] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

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

  // Fetch user profile to get college/department
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/auth/profile");
        setUserProfile(response.data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        showToast("Failed to load profile", "error");
      }
    };
    fetchProfile();
  }, [showToast]);

  // Fetch faculty filtered by college/department
  useEffect(() => {
    const fetchFaculty = async () => {
      if (!userProfile) return;

      setLoading(true);
      try {
        const collegeId = userProfile.college_id || userProfile.collegeId;
        const departmentId = userProfile.department_id || userProfile.departmentId;

        console.log("User profile:", userProfile);
        console.log("College ID:", collegeId, "Department ID:", departmentId);

        if (!collegeId || !departmentId) {
          console.error("Missing college or department ID:", { collegeId, departmentId });
          showToast(
            `College and department information required. College: ${collegeId || "missing"}, Department: ${departmentId || "missing"}`,
            "error"
          );
          setLoading(false);
          return;
        }

        const response = await apiClient.get(
          `/faculty/list?collegeId=${collegeId}&departmentId=${departmentId}`
        );

        // Backend returns { faculty: [...] }
        const facultyList = response.data?.faculty || response.data || [];
        
        console.log("API Response:", response.data);
        console.log("Fetched faculty:", facultyList.length, "faculty members");
        console.log("College ID:", collegeId, "Department ID:", departmentId);
        console.log("Faculty data:", facultyList);

        if (!Array.isArray(facultyList)) {
          console.error("Faculty list is not an array:", facultyList);
          showToast("Invalid response format from server", "error");
          setLoading(false);
          return;
        }

        if (facultyList.length === 0) {
          console.warn("No faculty found with filters:", { collegeId, departmentId });
          showToast("No faculty found for your department. Please contact your administrator.", "warning");
          setLoading(false);
          return;
        }

        // Fetch courses for each faculty
        const facultyWithCourses = await Promise.all(
          facultyList.map(async (fac) => {
            try {
              console.log(`Fetching courses for faculty ${fac.id} (${fac.name})...`);
              const coursesResponse = await apiClient.get(
                `/faculty/${fac.id}/courses`
              );
              
              // Backend returns { courses: [...] }
              const courses = coursesResponse.data?.courses || coursesResponse.data || [];
              console.log(`Found ${courses.length} courses for faculty ${fac.id}:`, courses);
              
              return {
                ...fac,
                courses: Array.isArray(courses) ? courses : [],
              };
            } catch (err) {
              console.error(`Failed to fetch courses for faculty ${fac.id} (${fac.name}):`, err);
              console.error("Error details:", err.response?.data || err.message);
              return { ...fac, courses: [] };
            }
          })
        );
        
        console.log("Faculty with courses:", facultyWithCourses);
        
        // Log course counts for each faculty
        facultyWithCourses.forEach((fac) => {
          console.log(`Faculty ${fac.name}: ${fac.courses?.length || 0} courses`, fac.courses);
        });

        setFaculty(facultyWithCourses);
      } catch (error) {
        console.error("Failed to fetch faculty:", error);
        showToast(
          error.response?.data?.message || "Failed to load faculty list",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFaculty();
  }, [userProfile, showToast]);

  const toggleCourseSelection = useCallback((courseId) => {
    setSelectedCourses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (selectedCourses.size === 0) {
      showToast("Please select at least one course", "warning");
      return;
    }

    setSubmitting(true);
    try {
      console.log("📝 Submitting course registrations:", Array.from(selectedCourses));
      
      const registrations = await Promise.all(
        Array.from(selectedCourses).map(async (courseId) => {
          try {
            console.log(`📝 Registering for course ${courseId}...`);
            const response = await apiClient.post("/registrations", { courseId });
            console.log(`✅ Successfully registered for course ${courseId}:`, response.data);
            return response;
          } catch (err) {
            console.error(`❌ Failed to register for course ${courseId}:`, err);
            throw err; // Re-throw to be caught by outer catch
          }
        })
      );

      console.log("✅ All registrations submitted successfully:", registrations);

      showToast(
        `Registration request sent for ${selectedCourses.size} course${selectedCourses.size > 1 ? 's' : ''}. Wait for faculty approval.`,
        "success"
      );

      // Clear selections and navigate back after a delay
      setTimeout(() => {
        navigate("/student/dashboard");
      }, 2000);
    } catch (error) {
      console.error("❌ Registration error:", error);
      console.error("Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        selectedCourses: Array.from(selectedCourses)
      });
      
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error?.message ||
        error.message ||
        "Failed to submit registration";
      
      showToast(errorMessage, "error");
    } finally {
      setSubmitting(false);
    }
  }, [selectedCourses, showToast, navigate]);

  const FacultyRow = ({ index, style, data }) => {
    const fac = data[index];
    if (!fac) return null;

    return (
      <div style={style} className={styles.facultyCard}>
        <div className={styles.facultyHeader}>
          <div className={styles.facultyInfo}>
            <h3 className={styles.facultyName}>{fac.name || "Unknown"}</h3>
            <p className={styles.facultyEmail}>{fac.email || ""}</p>
          </div>
        </div>

        <div className={styles.coursesList}>
          {fac.courses && Array.isArray(fac.courses) && fac.courses.length > 0 ? (
            fac.courses.map((course) => {
              console.log("Rendering course:", course);
              const isSelected = selectedCourses.has(course.id);
              return (
                <div
                  key={course.id}
                  className={`${styles.courseItem} ${isSelected ? styles.selected : ""}`}
                  onClick={() => toggleCourseSelection(course.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleCourseSelection(course.id);
                    }
                  }}
                >
                  <div className={styles.courseCheckbox}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleCourseSelection(course.id)}
                      tabIndex={-1}
                    />
                  </div>
                  <div className={styles.courseDetails}>
                    <h4 className={styles.courseTitle}>
                      {course.courseName || course.course_name || course.title || "Unknown Course"}
                    </h4>
                    <p className={styles.courseCode}>
                      {course.courseCode || course.course_code || ""}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className={styles.noCourses}>
              {fac.courses === undefined 
                ? "Loading courses..." 
                : fac.courses === null 
                ? "Courses data unavailable" 
                : "No courses available for this faculty"}
            </p>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner fullScreen message="Loading faculty and courses..." />
      </div>
    );
  }

  return (
    <div className={styles.registrationPage}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate("/student/dashboard")}
          aria-label="Go back to dashboard"
        >
          <i className="bx bx-arrow-back" aria-hidden="true"></i>
          <span>Back</span>
        </button>
        <h1 className={styles.pageTitle}>Course Registration</h1>
      </div>

      <div className={styles.content}>
        {faculty.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="bx bx-user-x" aria-hidden="true"></i>
            <p>No faculty available for your department</p>
            <span className={styles.emptySubtext}>
              Please contact your administrator if you believe this is an error.
            </span>
          </div>
        ) : (
          <>
            <div className={styles.facultyList}>
              <List
                height={600}
                itemCount={faculty.length}
                itemSize={300}
                itemData={faculty}
                width="100%"
                overscanCount={2}
              >
                {FacultyRow}
              </List>
            </div>

            <div className={styles.footer}>
              <div className={styles.selectionInfo}>
                <span>
                  {selectedCourses.size} course{selectedCourses.size !== 1 ? "s" : ""} selected
                </span>
              </div>
              <button
                className={styles.submitButton}
                onClick={handleSubmit}
                disabled={submitting || selectedCourses.size === 0}
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="small" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  "Submit Registration"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(CourseRegistration);

