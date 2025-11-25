import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import styles from "./JobApplication.module.css";

const JobApplication = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const jobData = location.state?.job || null;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    linkedin: "",
    portfolio: "",
    currentCompany: "",
    currentPosition: "",
    yearsOfExperience: "",
    availability: "",
    coverLetter: "",
    resume: null,
    resumeFileName: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [errors, setErrors] = useState({});

  // Initialize dark mode from localStorage on mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;

    const shouldBeDark =
      savedDarkMode !== null ? savedDarkMode === "true" : prefersDark;

    if (shouldBeDark) {
      document.body.classList.add("darkMode");
    } else {
      document.body.classList.remove("darkMode");
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === "resume") {
      setFormData({
        ...formData,
        resume: files[0],
        resumeFileName: files[0]?.name || "",
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    setSubmitMessage("");
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    if (!formData.yearsOfExperience) newErrors.yearsOfExperience = "Years of experience is required";
    if (!formData.availability) newErrors.availability = "Availability is required";
    if (!formData.coverLetter.trim()) {
      newErrors.coverLetter = "Cover letter is required";
    } else if (formData.coverLetter.trim().length < 100) {
      newErrors.coverLetter = "Cover letter must be at least 100 characters";
    }
    if (!formData.resume) newErrors.resume = "Resume is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSubmitMessage("❌ Please fill in all required fields correctly.");
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage("");

    // Simulate form submission (like high-end companies)
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitMessage("✅ Application submitted successfully! We'll review your application and get back to you soon.");
      
      // Reset form after successful submission
      setTimeout(() => {
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          linkedin: "",
          portfolio: "",
          currentCompany: "",
          currentPosition: "",
          yearsOfExperience: "",
          availability: "",
          coverLetter: "",
          resume: null,
          resumeFileName: "",
        });
      }, 2000);
    }, 2000);
  };

  return (
    <div className={styles.applicationPageWrapper}>
      <Navigation />

      <div className={styles.applicationContainer}>
        {/* Header Section */}
        <div className={styles.applicationHeader}>
          <button
            className={styles.backButton}
            onClick={() => navigate("/careers")}
          >
            <i className="fas fa-arrow-left" />
            Back to Careers
          </button>
          <div className={styles.headerContent}>
            <div className={styles.jobTitleSection}>
              {jobData ? (
                <>
                  <h1>{jobData.title}</h1>
                  <div className={styles.jobMetaInfo}>
                    <span className={styles.jobDepartment}>{jobData.department}</span>
                    <span className={styles.jobLocation}>
                      <i className="fas fa-map-marker-alt" /> {jobData.location}
                    </span>
                    <span className={styles.jobType}>
                      <i className="fas fa-briefcase" /> {jobData.type}
                    </span>
                  </div>
                </>
              ) : (
                <h1>Job Application</h1>
              )}
            </div>
          </div>
        </div>

        {/* Application Form */}
        <form className={styles.applicationForm} onSubmit={handleSubmit}>
          {submitMessage && (
            <div className={`${styles.submitMessage} ${submitMessage.startsWith("✅") ? styles.success : styles.error}`}>
              {submitMessage}
            </div>
          )}

          {/* Personal Information Section */}
          <section className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h2>
                <i className="fas fa-user" />
                Personal Information
              </h2>
              <p>Tell us about yourself</p>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="firstName">
                  First Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={errors.firstName ? styles.inputError : ""}
                  placeholder="John"
                  required
                />
                {errors.firstName && (
                  <span className={styles.errorText}>{errors.firstName}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="lastName">
                  Last Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={errors.lastName ? styles.inputError : ""}
                  placeholder="Doe"
                  required
                />
                {errors.lastName && (
                  <span className={styles.errorText}>{errors.lastName}</span>
                )}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="email">
                  Email Address <span className={styles.required}>*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? styles.inputError : ""}
                  placeholder="john.doe@example.com"
                  required
                />
                {errors.email && (
                  <span className={styles.errorText}>{errors.email}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone">
                  Phone Number <span className={styles.required}>*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={errors.phone ? styles.inputError : ""}
                  placeholder="+1 (555) 123-4567"
                  required
                />
                {errors.phone && (
                  <span className={styles.errorText}>{errors.phone}</span>
                )}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="linkedin">LinkedIn Profile</label>
                <input
                  type="url"
                  id="linkedin"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/johndoe"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="portfolio">Portfolio / Website</label>
                <input
                  type="url"
                  id="portfolio"
                  name="portfolio"
                  value={formData.portfolio}
                  onChange={handleChange}
                  placeholder="https://johndoe.dev"
                />
              </div>
            </div>
          </section>

          {/* Professional Experience Section */}
          <section className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h2>
                <i className="fas fa-briefcase" />
                Professional Experience
              </h2>
              <p>Your current role and experience</p>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="currentCompany">Current Company</label>
                <input
                  type="text"
                  id="currentCompany"
                  name="currentCompany"
                  value={formData.currentCompany}
                  onChange={handleChange}
                  placeholder="Company Name"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="currentPosition">Current Position</label>
                <input
                  type="text"
                  id="currentPosition"
                  name="currentPosition"
                  value={formData.currentPosition}
                  onChange={handleChange}
                  placeholder="Your Job Title"
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="yearsOfExperience">
                  Years of Experience <span className={styles.required}>*</span>
                </label>
                <select
                  id="yearsOfExperience"
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  className={errors.yearsOfExperience ? styles.inputError : ""}
                  required
                >
                  <option value="">Select experience</option>
                  <option value="0-1">0-1 years</option>
                  <option value="2-3">2-3 years</option>
                  <option value="4-5">4-5 years</option>
                  <option value="6-8">6-8 years</option>
                  <option value="9-12">9-12 years</option>
                  <option value="13+">13+ years</option>
                </select>
                {errors.yearsOfExperience && (
                  <span className={styles.errorText}>{errors.yearsOfExperience}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="availability">
                  Availability <span className={styles.required}>*</span>
                </label>
                <select
                  id="availability"
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  className={errors.availability ? styles.inputError : ""}
                  required
                >
                  <option value="">Select availability</option>
                  <option value="immediate">Immediate</option>
                  <option value="2-weeks">2 weeks notice</option>
                  <option value="1-month">1 month notice</option>
                  <option value="2-months">2 months notice</option>
                  <option value="3-months">3+ months notice</option>
                </select>
                {errors.availability && (
                  <span className={styles.errorText}>{errors.availability}</span>
                )}
              </div>
            </div>
          </section>

          {/* Cover Letter Section */}
          <section className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h2>
                <i className="fas fa-file-alt" />
                Cover Letter
              </h2>
              <p>Why are you interested in this position? (Minimum 100 characters)</p>
            </div>

            <div className={styles.formGroup}>
              <textarea
                id="coverLetter"
                name="coverLetter"
                value={formData.coverLetter}
                onChange={handleChange}
                className={errors.coverLetter ? styles.inputError : ""}
                rows="8"
                placeholder="Tell us why you're a great fit for this role. Share your relevant experience, skills, and what excites you about this opportunity..."
                required
              />
              <div className={styles.charCount}>
                {formData.coverLetter.length} characters
                {formData.coverLetter.length < 100 && formData.coverLetter.length > 0 && (
                  <span className={styles.charWarning}>
                    (Minimum 100 characters required)
                  </span>
                )}
              </div>
              {errors.coverLetter && (
                <span className={styles.errorText}>{errors.coverLetter}</span>
              )}
            </div>
          </section>

          {/* Resume Upload Section */}
          <section className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h2>
                <i className="fas fa-file-upload" />
                Resume / CV
              </h2>
              <p>Upload your resume (PDF, DOC, DOCX - Max 5MB)</p>
            </div>

            <div className={styles.fileUploadArea}>
              <input
                type="file"
                id="resume"
                name="resume"
                accept=".pdf,.doc,.docx"
                onChange={handleChange}
                className={styles.fileInput}
                required
              />
              <label htmlFor="resume" className={styles.fileUploadLabel}>
                <div className={styles.fileUploadContent}>
                  <i className="fas fa-cloud-upload-alt" />
                  <div>
                    <span className={styles.fileUploadText}>
                      {formData.resumeFileName || "Choose file or drag it here"}
                    </span>
                    <span className={styles.fileUploadHint}>
                      PDF, DOC, or DOCX (Max 5MB)
                    </span>
                  </div>
                </div>
              </label>
              {errors.resume && (
                <span className={styles.errorText}>{errors.resume}</span>
              )}
            </div>
          </section>

          {/* Submit Section */}
          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={() => navigate("/careers")}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <i className="fas fa-spinner fa-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane" />
                  Submit Application
                </>
              )}
            </button>
          </div>

          <div className={styles.formFooter}>
            <p>
              <i className="fas fa-shield-alt" />
              Your information is secure and will only be used for recruitment purposes.
            </p>
          </div>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default JobApplication;
