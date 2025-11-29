/**
 * JoinCourse.jsx
 * Student course registration flow:
 * 1. Display student's college and department (non-editable)
 * 2. List faculty filtered by college/department
 * 3. When faculty selected, show their courses
 * 4. Submit registration request
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import styles from "./JoinCourse.module.css";

const JoinCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [userInfo, setUserInfo] = useState(null);
  const [facultyList, setFacultyList] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [coursesList, setCoursesList] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);

  useEffect(() => {
    fetchUserInfo();
    fetchMyRegistrations();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const response = await apiClient.get("/auth/profile");
      setUserInfo(response.data);
      
      // Fetch faculty filtered by user's college and department
      if (response.data.college_id && response.data.department_id) {
        fetchFaculty(response.data.college_id, response.data.department_id);
      }
    } catch (err) {
      console.error("Error fetching user info:", err);
      setError("Failed to load your profile. Please login again.");
      setTimeout(() => navigate("/login"), 2000);
    }
  };

  const fetchFaculty = async (collegeId, departmentId) => {
    setLoading(true);
    try {
      const response = await apiClient.get("/faculty/list", {
        params: { collegeId, departmentId },
      });
      setFacultyList(response.data.faculty || []);
    } catch (err) {
      console.error("Error fetching faculty:", err);
      setError(err.response?.data?.message || "Failed to load faculty list.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyRegistrations = async () => {
    try {
      const response = await apiClient.get("/registrations/my-registrations");
      setMyRegistrations(response.data.registrations || []);
    } catch (err) {
      console.error("Error fetching registrations:", err);
    }
  };

  const handleFacultySelect = async (faculty) => {
    setSelectedFaculty(faculty);
    setSelectedCourses([]);
    setCoursesList([]);
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.get(`/faculty/${faculty.id}/courses`);
      setCoursesList(response.data.courses || []);
      if (response.data.courses?.length === 0) {
        setMessage("This faculty has not created any courses yet.");
      }
    } catch (err) {
      console.error("Error fetching courses:", err);
      setError(err.response?.data?.message || "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  };

  const handleCourseToggle = (courseId) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSubmitRegistrations = async () => {
    if (selectedCourses.length === 0) {
      setError("Please select at least one course.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const promises = selectedCourses.map((courseId) =>
        apiClient.post("/registrations", { courseId })
      );

      await Promise.all(promises);

      setMessage(`✅ Successfully submitted ${selectedCourses.length} course registration request(s)!`);
      setSelectedCourses([]);
      setSelectedFaculty(null);
      setCoursesList([]);
      fetchMyRegistrations();
    } catch (err) {
      console.error("Error submitting registrations:", err);
      setError(err.response?.data?.message || "Failed to submit registration requests.");
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyRegistered = (courseId) => {
    return myRegistrations.some((reg) => reg.course.id === courseId);
  };

  return (
    <div className={styles.joinCourseContainer}>
      <div className={styles.joinCourseCard}>
        <h1 className={styles.title}>Join Courses</h1>

        {/* User Info Section */}
        {userInfo && (
          <div className={styles.userInfoSection}>
            <h2>Your Information</h2>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.label}>College:</span>
                <span className={styles.value}>{userInfo.college || "N/A"}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Department:</span>
                <span className={styles.value}>{userInfo.department || "N/A"}</span>
              </div>
            </div>
            <p className={styles.infoNote}>
              <em>College and department are fixed and cannot be changed after registration.</em>
            </p>
          </div>
        )}

        {/* Faculty Selection */}
        <div className={styles.facultySection}>
          <h2>Select Faculty</h2>
          {loading && !selectedFaculty ? (
            <p>Loading faculty...</p>
          ) : facultyList.length === 0 ? (
            <p>No faculty found in your college and department.</p>
          ) : (
            <div className={styles.facultyGrid}>
              {facultyList.map((faculty) => (
                <div
                  key={faculty.id}
                  className={`${styles.facultyCard} ${
                    selectedFaculty?.id === faculty.id ? styles.selected : ""
                  }`}
                  onClick={() => handleFacultySelect(faculty)}
                >
                  <h3>{faculty.name}</h3>
                  <p>{faculty.email}</p>
                  <p className={styles.facultyMeta}>
                    {faculty.departmentName} • {faculty.collegeName}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Course Selection */}
        {selectedFaculty && (
          <div className={styles.courseSection}>
            <h2>Courses by {selectedFaculty.name}</h2>
            {loading ? (
              <p>Loading courses...</p>
            ) : coursesList.length === 0 ? (
              <p>This faculty has not created any courses yet.</p>
            ) : (
              <div>
                <div className={styles.courseList}>
                  {coursesList.map((course) => {
                    const alreadyRegistered = isAlreadyRegistered(course.id);
                    return (
                      <div
                        key={course.id}
                        className={`${styles.courseCard} ${
                          alreadyRegistered ? styles.disabled : ""
                        }`}
                      >
                        <label className={styles.courseLabel}>
                          <input
                            type="checkbox"
                            checked={selectedCourses.includes(course.id)}
                            onChange={() => handleCourseToggle(course.id)}
                            disabled={alreadyRegistered}
                          />
                          <div className={styles.courseDetails}>
                            <h3>{course.courseCode} - {course.courseName}</h3>
                            {course.description && <p>{course.description}</p>}
                            <div className={styles.courseMeta}>
                              {course.credits && <span>{course.credits} credits</span>}
                              {course.semester && <span>• {course.semester}</span>}
                              {course.academicYear && <span>• {course.academicYear}</span>}
                            </div>
                            {alreadyRegistered && (
                              <span className={styles.registeredBadge}>Already Registered</span>
                            )}
                          </div>
                        </label>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={handleSubmitRegistrations}
                  disabled={loading || selectedCourses.length === 0}
                  className={styles.submitButton}
                >
                  {loading ? "Submitting..." : `Submit ${selectedCourses.length} Registration(s)`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* My Registrations */}
        {myRegistrations.length > 0 && (
          <div className={styles.myRegistrationsSection}>
            <h2>My Course Registrations</h2>
            <div className={styles.registrationsList}>
              {myRegistrations.map((reg) => (
                <div key={reg.id} className={styles.registrationCard}>
                  <h3>{reg.course.courseCode} - {reg.course.courseName}</h3>
                  <p>Faculty: {reg.faculty.name}</p>
                  <p>
                    Status:{" "}
                    <span
                      className={`${styles.status} ${styles[reg.status]}`}
                    >
                      {reg.status.toUpperCase()}
                    </span>
                  </p>
                  {reg.rejectionReason && (
                    <p className={styles.rejectionReason}>
                      Reason: {reg.rejectionReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {message && <div className={styles.successMessage}>{message}</div>}
        {error && <div className={styles.errorMessage}>{error}</div>}
      </div>
    </div>
  );
};

export default JoinCourse;
