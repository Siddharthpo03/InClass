import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import Favicon from "../../assets/favicon.jpg";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import CountryCodeSelector from "../../components/CountryCodeSelector";
import styles from "./InClassRegister.module.css";

const InClassRegister = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // College dropdown state
  const [collegeDropdownOpen, setCollegeDropdownOpen] = useState(false);
  const [collegesList, setCollegesList] = useState([]);
  const [collegeSearch, setCollegeSearch] = useState("");
  const [collegesLoading, setCollegesLoading] = useState(false);
  const collegeDropdownRef = useRef(null);

  // Department dropdown state
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const departmentDropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile_number: "",
    country_code: "+1",
    password: "",
    confirmPassword: "",
    roll_no: "",
    college: "",
    department: "",
  });

  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});
  const [registerMessage, setRegisterMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Initialize dark mode
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

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setValidationErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    setRegisterMessage("");
  };

  const handleCountryCodeChange = (code) => {
    setFormData({ ...formData, country_code: code });
    setValidationErrors((prev) => ({ ...prev, country_code: "" }));
  };

  const handleCollegeSelect = (college) => {
    setFormData({ ...formData, college: college.name });
    setCollegeSearch("");
    setCollegeDropdownOpen(false);
    setValidationErrors((prev) => ({ ...prev, college: "" }));
  };

  const handleDepartmentSelect = (department) => {
    setFormData({ ...formData, department: department.name });
    setDepartmentSearch("");
    setDepartmentDropdownOpen(false);
    setValidationErrors((prev) => ({ ...prev, department: "" }));
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setDropdownOpen(false);
    setFormData((prev) => ({ ...prev, roll_no: "" }));
    setValidationErrors((prev) => ({ ...prev, role: "", roll_no: "" }));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (
        collegeDropdownRef.current &&
        !collegeDropdownRef.current.contains(e.target)
      ) {
        setCollegeDropdownOpen(false);
      }
      if (
        departmentDropdownRef.current &&
        !departmentDropdownRef.current.contains(e.target)
      ) {
        setDepartmentDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Fetch colleges on mount and when search changes
  useEffect(() => {
    const fetchColleges = async () => {
      setCollegesLoading(true);
      try {
        console.log("Fetching colleges with search:", collegeSearch || "");
        const response = await apiClient.get("/auth/colleges", {
          params: { search: collegeSearch || "" },
        });
        console.log("Colleges response:", response.data);
        setCollegesList(response.data.colleges || []);
      } catch (error) {
        console.error("Error fetching colleges:", error);
        console.error("Error details:", error.response?.data || error.message);
        setCollegesList([]);
      } finally {
        setCollegesLoading(false);
      }
    };

    // Fetch immediately on mount, then debounce for search
    if (collegeSearch.length === 0) {
      fetchColleges();
    } else {
      const timeoutId = setTimeout(() => {
        fetchColleges();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [collegeSearch]);

  // Fetch departments on mount and when search changes
  useEffect(() => {
    const fetchDepartments = async () => {
      setDepartmentsLoading(true);
      try {
        console.log(
          "Fetching departments with search:",
          departmentSearch || ""
        );
        const response = await apiClient.get("/auth/departments", {
          params: { search: departmentSearch || "" },
        });
        console.log("Departments response:", response.data);
        setDepartmentsList(response.data.departments || []);
      } catch (error) {
        console.error("Error fetching departments:", error);
        console.error("Error details:", error.response?.data || error.message);
        setDepartmentsList([]);
      } finally {
        setDepartmentsLoading(false);
      }
    };

    // Fetch immediately on mount, then debounce for search
    if (departmentSearch.length === 0) {
      fetchDepartments();
    } else {
      const timeoutId = setTimeout(() => {
        fetchDepartments();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [departmentSearch]);

  useEffect(() => {
    const requiredFields = [
      "name",
      "email",
      "mobile_number",
      "password",
      "confirmPassword",
      "roll_no",
      "college",
      "department",
    ];
    if (role) {
      const allFilled = requiredFields.every((field) =>
        formData[field]?.trim()
      );
      setIsButtonDisabled(!allFilled);
    } else {
      setIsButtonDisabled(true);
    }
  }, [formData, role]);

  const validateForm = () => {
    let isValid = true;
    let errors = {};

    if (!role) {
      errors.role = "Please select a role";
      isValid = false;
    }

    if (!formData.name.trim()) {
      errors.name = "Name is required";
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
      isValid = false;
    }

    if (!formData.mobile_number.trim()) {
      errors.mobile_number = "Mobile number is required";
      isValid = false;
    } else if (!/^\d{10}$/.test(formData.mobile_number.trim())) {
      errors.mobile_number = "Please enter a valid 10-digit mobile number";
      isValid = false;
    }

    if (!formData.password.trim()) {
      errors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your password";
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    if (role && !formData.roll_no.trim()) {
      errors.roll_no =
        role === "Student"
          ? "Student ID is required"
          : "Faculty ID is required";
      isValid = false;
    }

    if (!formData.college.trim()) {
      errors.college = "College/University is required";
      isValid = false;
    }

    if (!formData.department.trim()) {
      errors.department = "Department is required";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRegisterMessage("");

    if (!validateForm()) {
      setRegisterMessage("❌ Please correct the errors above.");
      return;
    }

    setLoading(true);

    const payload = {
      name: formData.name,
      email: formData.email,
      mobile_number: formData.mobile_number,
      country_code: formData.country_code,
      password: formData.password,
      role: role.toLowerCase(),
      roll_no: formData.roll_no,
      college: formData.college,
      department: formData.department,
    };

    try {
      const response = await apiClient.post("/auth/register", payload);

      // Check if biometric enrollment is required
      const requireBiometric = response.data?.requireBiometric !== false;
      const userId = response.data?.userId || response.data?.user?.id;

      if (requireBiometric && userId) {
        // Store token if provided for authenticated requests
        if (response.data?.token) {
          localStorage.setItem("inclass_token", response.data.token);
        }

        setRegisterMessage(
          "✅ Registration successful! Continue to biometric onboarding..."
        );

        // Redirect to biometric onboarding after 1 second
        setTimeout(() => {
          navigate(`/onboard/biometrics?userId=${userId}`);
        }, 1000);
      } else {
        // Fallback: redirect to login if no biometric required
        setRegisterMessage(
          "✅ Registration successful! Redirecting to login..."
        );
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (error) {
      setLoading(false);
      let errorMessage = "Registration failed. Please try again.";

      if (error.response?.data) {
        if (error.response.data.error?.message) {
          errorMessage = error.response.data.error.message;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      setRegisterMessage(`❌ ${errorMessage}`);
      console.error("Registration Error:", error.response || error);
    }
  };

  const passwordInputType = showPassword ? "text" : "password";
  const confirmPasswordInputType = showConfirmPassword ? "text" : "password";

  return (
    <div className={styles.registerPageWrapper}>
      <Navigation />

      <div className={styles.registerContainer}>
        <div className={styles.registerCard}>
          <div className={styles.registerHeader}>
            <div className={styles.logoSection}>
              <div className={styles.logoIcon}>
                <img src={Favicon} alt="InClass Logo" />
              </div>
            </div>
            <h1 className={styles.registerTitle}>Create Account</h1>
            <p className={styles.registerSubtitle}>
              Join InClass and start your journey
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.registerForm}>
            {registerMessage && (
              <div
                className={`${styles.messageBox} ${
                  registerMessage.startsWith("✅")
                    ? styles.messageSuccess
                    : styles.messageError
                }`}
              >
                <i
                  className={`bx ${
                    registerMessage.startsWith("✅")
                      ? "bx-check-circle"
                      : "bx-error-circle"
                  }`}
                ></i>
                <span>{registerMessage}</span>
              </div>
            )}

            {/* Role Selection */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <i className="bx bx-user-circle"></i>
                Select Your Role
              </label>
              <div className={styles.dropdownWrapper} ref={dropdownRef}>
                <div
                  className={`${styles.dropdown} ${
                    validationErrors.role ? styles.inputError : ""
                  } ${dropdownOpen ? styles.dropdownOpen : ""}`}
                  onClick={() => setDropdownOpen((prev) => !prev)}
                >
                  <div className={styles.dropdownContent}>
                    {role && (
                      <i
                        className={`bx ${
                          role === "Student" ? "bx-user" : "bx-user-circle"
                        }`}
                      ></i>
                    )}
                    <span>{role || "Select Role"}</span>
                  </div>
                  <i
                    className={`bx bx-chevron-down ${styles.chevronIcon} ${
                      dropdownOpen ? styles.rotate : ""
                    }`}
                  ></i>
                </div>
                {dropdownOpen && (
                  <ul className={styles.dropdownMenu}>
                    {["Student", "Faculty"].map((r) => (
                      <li
                        key={r}
                        className={styles.dropdownItem}
                        onClick={() => handleRoleSelect(r)}
                      >
                        <i
                          className={`bx ${
                            r === "Student" ? "bx-user" : "bx-user-circle"
                          }`}
                        ></i>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {validationErrors.role && (
                  <span className={styles.errorText}>
                    <i className="bx bx-error-circle"></i>
                    {validationErrors.role}
                  </span>
                )}
              </div>
            </div>

            {/* Name Input */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <i className="bx bx-user"></i>
                Full Name
              </label>
              <div className={styles.inputWrapper}>
                <i className="bx bx-user"></i>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className={validationErrors.name ? styles.inputError : ""}
                  required
                />
              </div>
              {validationErrors.name && (
                <span className={styles.errorText}>
                  <i className="bx bx-error-circle"></i>
                  {validationErrors.name}
                </span>
              )}
            </div>

            {/* Email Input */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <i className="bx bx-envelope"></i>
                Email Address
              </label>
              <div className={styles.inputWrapper}>
                <i className="bx bx-envelope"></i>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className={validationErrors.email ? styles.inputError : ""}
                  required
                />
              </div>
              {validationErrors.email && (
                <span className={styles.errorText}>
                  <i className="bx bx-error-circle"></i>
                  {validationErrors.email}
                </span>
              )}
            </div>

            {/* Mobile Number Input */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <i className="bx bx-phone"></i>
                Mobile Number
              </label>
              <div className={styles.mobileInputContainer}>
                <CountryCodeSelector
                  value={formData.country_code}
                  onChange={handleCountryCodeChange}
                  error={validationErrors.country_code}
                />
                <div className={styles.inputWrapper} style={{ flex: 1 }}>
                  <i className="bx bx-phone"></i>
                  <input
                    type="tel"
                    name="mobile_number"
                    placeholder="Enter 10-digit mobile number"
                    value={formData.mobile_number}
                    onChange={handleFormChange}
                    className={
                      validationErrors.mobile_number ? styles.inputError : ""
                    }
                    maxLength="10"
                    required
                  />
                </div>
              </div>
              {validationErrors.mobile_number && (
                <span className={styles.errorText}>
                  <i className="bx bx-error-circle"></i>
                  {validationErrors.mobile_number}
                </span>
              )}
            </div>

            {/* College/University Input */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <i className="bx bx-buildings"></i>
                College/University
              </label>
              <div className={styles.dropdownWrapper} ref={collegeDropdownRef}>
                <div
                  className={`${styles.dropdown} ${
                    validationErrors.college ? styles.inputError : ""
                  } ${collegeDropdownOpen ? styles.dropdownOpen : ""}`}
                  onClick={() => {
                    setCollegeDropdownOpen((prev) => !prev);
                    if (!collegeDropdownOpen) {
                      setCollegeSearch("");
                    }
                  }}
                >
                  <div className={styles.dropdownContent}>
                    <i className="bx bx-buildings"></i>
                    <input
                      type="text"
                      placeholder="Search or select college/university"
                      value={
                        collegeDropdownOpen ? collegeSearch : formData.college
                      }
                      onChange={(e) => {
                        setCollegeSearch(e.target.value);
                        setCollegeDropdownOpen(true);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={styles.dropdownInput}
                    />
                  </div>
                  <i
                    className={`bx bx-chevron-down ${styles.chevronIcon} ${
                      collegeDropdownOpen ? styles.rotate : ""
                    }`}
                  ></i>
                </div>
                {collegeDropdownOpen && (
                  <ul className={styles.dropdownMenu}>
                    {collegesLoading ? (
                      <li
                        className={styles.dropdownItem}
                        style={{ cursor: "default", justifyContent: "center" }}
                      >
                        <span>Loading colleges...</span>
                      </li>
                    ) : collegesList.length > 0 ? (
                      collegesList.map((college) => (
                        <li
                          key={college.id}
                          className={styles.dropdownItem}
                          onClick={() => handleCollegeSelect(college)}
                        >
                          <i className="bx bx-buildings"></i>
                          <div className={styles.dropdownItemContent}>
                            <span className={styles.dropdownItemName}>
                              {college.name}
                            </span>
                            {(college.city || college.state) && (
                              <span className={styles.dropdownItemSubtext}>
                                {[college.city, college.state]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            )}
                          </div>
                        </li>
                      ))
                    ) : (
                      <li
                        className={styles.dropdownItem}
                        style={{ cursor: "default" }}
                      >
                        <span>
                          {collegeSearch
                            ? "No colleges found matching your search"
                            : "No colleges available. Please check your database."}
                        </span>
                      </li>
                    )}
                  </ul>
                )}
                {validationErrors.college && (
                  <span className={styles.errorText}>
                    <i className="bx bx-error-circle"></i>
                    {validationErrors.college}
                  </span>
                )}
              </div>
            </div>

            {/* Department Input */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <i className="bx bx-book-bookmark"></i>
                Department
              </label>
              <div
                className={styles.dropdownWrapper}
                ref={departmentDropdownRef}
              >
                <div
                  className={`${styles.dropdown} ${
                    validationErrors.department ? styles.inputError : ""
                  } ${departmentDropdownOpen ? styles.dropdownOpen : ""}`}
                  onClick={() => {
                    setDepartmentDropdownOpen((prev) => !prev);
                    if (
                      !departmentDropdownOpen &&
                      departmentsList.length === 0
                    ) {
                      // Fetch departments when opening for the first time
                      setDepartmentSearch("");
                    }
                  }}
                >
                  <div className={styles.dropdownContent}>
                    <i className="bx bx-book-bookmark"></i>
                    <input
                      type="text"
                      placeholder="Search or select department"
                      value={
                        departmentDropdownOpen
                          ? departmentSearch
                          : formData.department
                      }
                      onChange={(e) => {
                        setDepartmentSearch(e.target.value);
                        setDepartmentDropdownOpen(true);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!departmentDropdownOpen) {
                          setDepartmentDropdownOpen(true);
                        }
                      }}
                      className={styles.dropdownInput}
                    />
                  </div>
                  <i
                    className={`bx bx-chevron-down ${styles.chevronIcon} ${
                      departmentDropdownOpen ? styles.rotate : ""
                    }`}
                  ></i>
                </div>
                {departmentDropdownOpen && (
                  <ul className={styles.dropdownMenu}>
                    {departmentsLoading ? (
                      <li
                        className={styles.dropdownItem}
                        style={{ cursor: "default", justifyContent: "center" }}
                      >
                        <span>Loading departments...</span>
                      </li>
                    ) : departmentsList.length > 0 ? (
                      departmentsList.map((department) => (
                        <li
                          key={department.id}
                          className={styles.dropdownItem}
                          onClick={() => handleDepartmentSelect(department)}
                        >
                          <i className="bx bx-book-bookmark"></i>
                          <div className={styles.dropdownItemContent}>
                            <span className={styles.dropdownItemName}>
                              {department.name}
                            </span>
                            {department.code && (
                              <span className={styles.dropdownItemSubtext}>
                                {department.code}
                              </span>
                            )}
                          </div>
                        </li>
                      ))
                    ) : (
                      <li
                        className={styles.dropdownItem}
                        style={{ cursor: "default" }}
                      >
                        <span>
                          {departmentSearch
                            ? "No departments found matching your search"
                            : "No departments available. Please check your database."}
                        </span>
                      </li>
                    )}
                  </ul>
                )}
                {validationErrors.department && (
                  <span className={styles.errorText}>
                    <i className="bx bx-error-circle"></i>
                    {validationErrors.department}
                  </span>
                )}
              </div>
            </div>

            {/* Password Input */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <i className="bx bx-lock-alt"></i>
                Password
              </label>
              <div className={styles.inputWrapper}>
                <i className="bx bx-lock-alt"></i>
                <input
                  type={passwordInputType}
                  name="password"
                  placeholder="Create a password (min. 6 characters)"
                  value={formData.password}
                  onChange={handleFormChange}
                  className={validationErrors.password ? styles.inputError : ""}
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowPassword(!showPassword);
                  }}
                  tabIndex={0}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <i className="bx bx-hide-alt"></i>
                  ) : (
                    <i className="bx bx-show-alt"></i>
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <span className={styles.errorText}>
                  <i className="bx bx-error-circle"></i>
                  {validationErrors.password}
                </span>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                <i className="bx bx-lock-alt"></i>
                Confirm Password
              </label>
              <div className={styles.inputWrapper}>
                <i className="bx bx-lock-alt"></i>
                <input
                  type={confirmPasswordInputType}
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleFormChange}
                  className={
                    validationErrors.confirmPassword ? styles.inputError : ""
                  }
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowConfirmPassword(!showConfirmPassword);
                  }}
                  tabIndex={0}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  title={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <i className="bx bx-hide-alt"></i>
                  ) : (
                    <i className="bx bx-show-alt"></i>
                  )}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <span className={styles.errorText}>
                  <i className="bx bx-error-circle"></i>
                  {validationErrors.confirmPassword}
                </span>
              )}
            </div>

            {/* Roll No / ID Input (conditional) */}
            {role !== "admin" && role && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <i className="bx bx-id-card"></i>
                  {role === "Student" ? "Student ID" : "Faculty ID"}
                </label>
                <div className={styles.inputWrapper}>
                  <i className="bx bx-id-card"></i>
                  <input
                    type="text"
                    name="roll_no"
                    placeholder={
                      role === "Student"
                        ? "Enter Student ID (e.g., STU12345)"
                        : "Enter Faculty ID (e.g., FAC67890)"
                    }
                    value={formData.roll_no}
                    onChange={handleFormChange}
                    className={
                      validationErrors.roll_no ? styles.inputError : ""
                    }
                    required
                  />
                </div>
                {validationErrors.roll_no && (
                  <span className={styles.errorText}>
                    <i className="bx bx-error-circle"></i>
                    {validationErrors.roll_no}
                  </span>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isButtonDisabled || loading}
            >
              {loading ? (
                <>
                  <div className={styles.spinner}></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <i className="bx bx-user-plus"></i>
                  <span>Create Account</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className={styles.divider}>
              <span>or</span>
            </div>

            {/* Login Link */}
            <div className={styles.loginLink}>
              <p>
                Already have an account?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/login");
                  }}
                >
                  Sign In
                </a>
              </p>
            </div>
          </form>
        </div>

        {/* Side Illustration */}
        <div className={styles.illustrationSection}>
          <div className={styles.illustrationContent}>
            <div className={styles.illustrationIcon}>
              <i className="bx bx-user-plus"></i>
            </div>
            <h2>Join InClass Today</h2>
            <p>
              Experience the future of attendance management with cutting-edge
              features
            </p>
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <i className="bx bx-check-circle"></i>
                <span>Secure registration</span>
              </div>
              <div className={styles.featureItem}>
                <i className="bx bx-check-circle"></i>
                <span>Biometric support</span>
              </div>
              <div className={styles.featureItem}>
                <i className="bx bx-check-circle"></i>
                <span>Real-time updates</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default InClassRegister;
