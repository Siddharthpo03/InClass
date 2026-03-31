import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import Favicon from "../../assets/favicon.png";
import Navigation from "../../components/Navigation";
import Footer from "../../components/Footer";
import useDarkMode from "../../hooks/useDarkMode";
import CountryCodeSelector from "../../components/CountryCodeSelector";
import styles from "./InClassRegister.module.css";

const STEPS = [
  { id: 1, title: "Account", short: "Account" },
  { id: 2, title: "Institution", short: "Institution" },
  { id: 3, title: "Security", short: "Password" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^\d{10}$/;

function getPasswordStrength(pwd) {
  if (!pwd) return { score: 0, label: "", width: "0%" };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const labels = ["", "Weak", "Fair", "Good", "Strong", "Very strong"];
  const widths = ["0%", "20%", "40%", "60%", "80%", "100%"];
  return { score, label: labels[score], width: widths[score] };
}

const InClassRegister = () => {
  useDarkMode();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [collegeDropdownOpen, setCollegeDropdownOpen] = useState(false);
  const [collegesList, setCollegesList] = useState([]);
  const [collegeSearch, setCollegeSearch] = useState("");
  const [collegesLoading, setCollegesLoading] = useState(false);
  const collegeDropdownRef = useRef(null);

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
    college_id: null,
    department_id: null,
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [registerMessage, setRegisterMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const collegeSearchTimeoutRef = useRef(null);
  const departmentSearchTimeoutRef = useRef(null);

  // Single click-outside listener for all dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current?.contains(e.target)) return;
      if (collegeDropdownRef.current?.contains(e.target)) return;
      if (departmentDropdownRef.current?.contains(e.target)) return;
      setDropdownOpen(false);
      setCollegeDropdownOpen(false);
      setDepartmentDropdownOpen(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Debounced college fetch
  useEffect(() => {
    const fetchColleges = async () => {
      setCollegesLoading(true);
      try {
        const response = await apiClient.get("/auth/colleges", {
          params: { search: collegeSearch || "" },
        });
        setCollegesList(response.data.colleges || []);
      } catch {
        setCollegesList([]);
      } finally {
        setCollegesLoading(false);
      }
    };

    if (collegeSearch.length === 0) {
      fetchColleges();
    } else {
      collegeSearchTimeoutRef.current = setTimeout(fetchColleges, 300);
      return () => clearTimeout(collegeSearchTimeoutRef.current);
    }
  }, [collegeSearch]);

  // Debounced department fetch
  useEffect(() => {
    const fetchDepartments = async () => {
      setDepartmentsLoading(true);
      try {
        const response = await apiClient.get("/auth/departments", {
          params: { search: departmentSearch || "" },
        });
        setDepartmentsList(response.data?.departments || []);
      } catch {
        setDepartmentsList([]);
      } finally {
        setDepartmentsLoading(false);
      }
    };

    if (departmentSearch.length === 0) {
      fetchDepartments();
    } else {
      departmentSearchTimeoutRef.current = setTimeout(fetchDepartments, 300);
      return () => clearTimeout(departmentSearchTimeoutRef.current);
    }
  }, [departmentSearch]);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    setRegisterMessage("");
  }, []);

  const handleCountryCodeChange = useCallback((code) => {
    setFormData((prev) => ({ ...prev, country_code: code }));
    setValidationErrors((prev) => ({ ...prev, country_code: "" }));
  }, []);

  const handleRoleSelect = useCallback((selectedRole) => {
    setRole(selectedRole);
    setDropdownOpen(false);
    setFormData((prev) => ({ ...prev, roll_no: "" }));
    setValidationErrors((prev) => ({ ...prev, role: "", roll_no: "" }));
  }, []);

  const handleCollegeSelect = useCallback((college) => {
    setFormData((prev) => ({
      ...prev,
      college: college.name,
      college_id: college.id,
    }));
    setCollegeSearch("");
    setCollegeDropdownOpen(false);
    setValidationErrors((prev) => ({ ...prev, college: "" }));
  }, []);

  const handleDepartmentSelect = useCallback((department) => {
    setFormData((prev) => ({
      ...prev,
      department: department.name,
      department_id: department.id,
    }));
    setDepartmentSearch("");
    setDepartmentDropdownOpen(false);
    setValidationErrors((prev) => ({ ...prev, department: "" }));
  }, []);

  const validateStep1 = useCallback(() => {
    const err = {};
    if (!role) err.role = "Select your role";
    if (!formData.name?.trim()) err.name = "Name is required";
    else if (formData.name.trim().length < 2)
      err.name = "At least 2 characters";
    if (!formData.email?.trim()) err.email = "Email is required";
    else if (!EMAIL_REGEX.test(formData.email))
      err.email = "Enter a valid email";
    if (!formData.mobile_number?.trim())
      err.mobile_number = "Mobile number is required";
    else if (!MOBILE_REGEX.test(formData.mobile_number.trim()))
      err.mobile_number = "Enter a valid 10-digit number";
    setValidationErrors((prev) => ({ ...prev, ...err }));
    return Object.keys(err).length === 0;
  }, [role, formData.name, formData.email, formData.mobile_number]);

  const validateStep2 = useCallback(() => {
    const err = {};
    if (!formData.college?.trim() || !formData.college_id) {
      err.college = formData.college?.trim()
        ? "Select from the list"
        : "College is required";
    }
    if (!formData.department?.trim() || !formData.department_id) {
      err.department = formData.department?.trim()
        ? "Select from the list"
        : "Department is required";
    }
    if (role && !formData.roll_no?.trim()) {
      err.roll_no =
        role === "Student"
          ? "Student ID is required"
          : "Faculty ID is required";
    }
    setValidationErrors((prev) => ({ ...prev, ...err }));
    return Object.keys(err).length === 0;
  }, [
    role,
    formData.college,
    formData.college_id,
    formData.department,
    formData.department_id,
    formData.roll_no,
  ]);

  const validateStep3 = useCallback(() => {
    const err = {};
    if (!formData.password?.trim()) err.password = "Password is required";
    else if (formData.password.length < 6)
      err.password = "At least 6 characters";
    if (!formData.confirmPassword?.trim())
      err.confirmPassword = "Confirm your password";
    else if (formData.password !== formData.confirmPassword)
      err.confirmPassword = "Passwords do not match";
    setValidationErrors((prev) => ({ ...prev, ...err }));
    return Object.keys(err).length === 0;
  }, [formData.password, formData.confirmPassword]);

  const canProceedStep1 = useMemo(() => {
    return (
      role &&
      formData.name?.trim().length >= 2 &&
      EMAIL_REGEX.test(formData.email) &&
      MOBILE_REGEX.test(formData.mobile_number?.trim())
    );
  }, [role, formData.name, formData.email, formData.mobile_number]);

  const canProceedStep2 = useMemo(() => {
    return (
      formData.college_id && formData.department_id && formData.roll_no?.trim()
    );
  }, [formData.college_id, formData.department_id, formData.roll_no]);

  const handleNext = useCallback(() => {
    setRegisterMessage("");
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    setStep((s) => Math.min(s + 1, 3));
  }, [step, validateStep1, validateStep2]);

  const handleBack = useCallback(() => {
    setRegisterMessage("");
    setValidationErrors({});
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setRegisterMessage("");
      if (!validateStep3()) return;

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
        college_id: formData.college_id,
        department_id: formData.department_id,
      };

      try {
        const response = await apiClient.post("/auth/register", payload);
        const requireBiometric = response.data?.requireBiometric !== false;
        const userId = response.data?.userId || response.data?.user?.id;

        if (response.data?.token) {
          localStorage.setItem("inclass_token", response.data.token);
        }

        setRegisterMessage("Account created! Redirecting…");

        if (requireBiometric && userId) {
          setTimeout(
            () => navigate(`/onboard/biometrics?userId=${userId}`),
            800,
          );
        } else {
          setTimeout(() => navigate("/login"), 1200);
        }
      } catch (error) {
        setLoading(false);
        const msg =
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          error.message ||
          "Registration failed. Please try again.";
        setRegisterMessage(msg);
      }
    },
    [formData, role, validateStep3, navigate],
  );

  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password],
  );
  const passwordInputType = showPassword ? "text" : "password";
  const confirmPasswordInputType = showConfirmPassword ? "text" : "password";

  return (
    <div className={styles.registerPageWrapper}>
      <Navigation />

      <div className={styles.registerContainer}>
        <div className={styles.registerCard}>
          {/* Progress stepper */}
          <div
            className={styles.stepper}
            role="navigation"
            aria-label="Registration steps"
          >
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`${styles.stepperItem} ${step >= s.id ? styles.stepperActive : ""} ${step === s.id ? styles.stepperCurrent : ""}`}
              >
                <span className={styles.stepperDot} aria-hidden="true">
                  {step > s.id ? <i className="bx bx-check"></i> : s.id}
                </span>
                <span className={styles.stepperTitle}>{s.short}</span>
                {i < STEPS.length - 1 && (
                  <span className={styles.stepperLine} />
                )}
              </div>
            ))}
          </div>

          <div className={styles.registerHeader}>
            <div className={styles.logoSection}>
              <div className={styles.logoIcon}>
                <img src={Favicon} alt="InClass" />
              </div>
            </div>
            <h1 className={styles.registerTitle}>
              {STEPS.find((s) => s.id === step)?.title || "Create Account"}
            </h1>
            <p className={styles.registerSubtitle}>
              {step === 1 && "Enter your basic details to get started"}
              {step === 2 && "Select your institution and ID"}
              {step === 3 && "Set a secure password"}
            </p>
          </div>

          <form
            onSubmit={
              step === 3
                ? handleSubmit
                : (e) => {
                    e.preventDefault();
                    handleNext();
                  }
            }
            className={styles.registerForm}
          >
            {registerMessage && (
              <div
                className={`${styles.messageBox} ${registerMessage.startsWith("Account created") ? styles.messageSuccess : styles.messageError}`}
              >
                <i
                  className={`bx ${registerMessage.startsWith("Account created") ? "bx-check-circle" : "bx-error-circle"}`}
                />
                <span>{registerMessage}</span>
              </div>
            )}

            {/* Step 1: Role, Name, Email, Mobile */}
            {step === 1 && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Role</label>
                  <div className={styles.dropdownWrapper} ref={dropdownRef}>
                    <div
                      className={`${styles.dropdown} ${validationErrors.role ? styles.inputError : ""} ${dropdownOpen ? styles.dropdownOpen : ""}`}
                      onClick={() => setDropdownOpen((p) => !p)}
                      role="combobox"
                      aria-expanded={dropdownOpen}
                      aria-haspopup="listbox"
                      aria-label="Select role"
                    >
                      <div className={styles.dropdownContent}>
                        {role && (
                          <i
                            className={`bx ${role === "Student" ? "bx-user" : "bx-user-circle"}`}
                          />
                        )}
                        <span>{role || "Student or Faculty"}</span>
                      </div>
                      <i
                        className={`bx bx-chevron-down ${styles.chevronIcon} ${dropdownOpen ? styles.rotate : ""}`}
                      />
                    </div>
                    {dropdownOpen && (
                      <ul className={styles.dropdownMenu} role="listbox">
                        {["Student", "Faculty"].map((r) => (
                          <li
                            key={r}
                            className={styles.dropdownItem}
                            onClick={() => handleRoleSelect(r)}
                            role="option"
                          >
                            <i
                              className={`bx ${r === "Student" ? "bx-user" : "bx-user-circle"}`}
                            />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {validationErrors.role && (
                      <span className={styles.errorText}>
                        {validationErrors.role}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="reg-name">
                    Full name
                  </label>
                  <div className={styles.inputWrapper}>
                    <i className="bx bx-user" aria-hidden="true" />
                    <input
                      id="reg-name"
                      type="text"
                      name="name"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={handleFormChange}
                      className={validationErrors.name ? styles.inputError : ""}
                      autoComplete="name"
                      aria-invalid={!!validationErrors.name}
                    />
                  </div>
                  {validationErrors.name && (
                    <span className={styles.errorText}>
                      {validationErrors.name}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="reg-email">
                    Email
                  </label>
                  <div className={styles.inputWrapper}>
                    <i className="bx bx-envelope" aria-hidden="true" />
                    <input
                      id="reg-email"
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleFormChange}
                      className={
                        validationErrors.email ? styles.inputError : ""
                      }
                      autoComplete="email"
                      aria-invalid={!!validationErrors.email}
                    />
                  </div>
                  {validationErrors.email && (
                    <span className={styles.errorText}>
                      {validationErrors.email}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Mobile number</label>
                  <div className={styles.mobileInputContainer}>
                    <CountryCodeSelector
                      value={formData.country_code}
                      onChange={handleCountryCodeChange}
                      error={validationErrors.country_code}
                    />
                    <div className={styles.inputWrapper} style={{ flex: 1 }}>
                      <i className="bx bx-phone" aria-hidden="true" />
                      <input
                        type="tel"
                        name="mobile_number"
                        placeholder="10-digit number"
                        value={formData.mobile_number}
                        onChange={handleFormChange}
                        className={
                          validationErrors.mobile_number
                            ? styles.inputError
                            : ""
                        }
                        maxLength="10"
                        autoComplete="tel-national"
                        aria-invalid={!!validationErrors.mobile_number}
                      />
                    </div>
                  </div>
                  {validationErrors.mobile_number && (
                    <span className={styles.errorText}>
                      {validationErrors.mobile_number}
                    </span>
                  )}
                </div>
              </>
            )}

            {/* Step 2: College, Department, Roll No */}
            {step === 2 && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    College / University
                  </label>
                  <div
                    className={styles.dropdownWrapper}
                    ref={collegeDropdownRef}
                  >
                    <div
                      className={`${styles.dropdown} ${validationErrors.college ? styles.inputError : ""} ${collegeDropdownOpen ? styles.dropdownOpen : ""}`}
                      onClick={() => setCollegeDropdownOpen((p) => !p)}
                    >
                      <div className={styles.dropdownContent}>
                        <i className="bx bx-buildings" />
                        <input
                          type="text"
                          placeholder="Search or select"
                          value={
                            collegeDropdownOpen
                              ? collegeSearch
                              : formData.college
                          }
                          onChange={(e) => {
                            setCollegeSearch(e.target.value);
                            setCollegeDropdownOpen(true);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={styles.dropdownInput}
                          aria-label="College search"
                        />
                      </div>
                      <i
                        className={`bx bx-chevron-down ${styles.chevronIcon} ${collegeDropdownOpen ? styles.rotate : ""}`}
                      />
                    </div>
                    {collegeDropdownOpen && (
                      <ul className={styles.dropdownMenu}>
                        {collegesLoading ? (
                          <li
                            className={styles.dropdownItem}
                            style={{ justifyContent: "center" }}
                          >
                            Loading…
                          </li>
                        ) : collegesList.length > 0 ? (
                          collegesList.map((college) => (
                            <li
                              key={college.id}
                              className={styles.dropdownItem}
                              onClick={() => handleCollegeSelect(college)}
                            >
                              <i className="bx bx-buildings" />
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
                            {collegeSearch
                              ? "No matches"
                              : "No colleges loaded"}
                          </li>
                        )}
                      </ul>
                    )}
                    {validationErrors.college && (
                      <span className={styles.errorText}>
                        {validationErrors.college}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Department</label>
                  <div
                    className={styles.dropdownWrapper}
                    ref={departmentDropdownRef}
                  >
                    <div
                      className={`${styles.dropdown} ${validationErrors.department ? styles.inputError : ""} ${departmentDropdownOpen ? styles.dropdownOpen : ""}`}
                      onClick={() => setDepartmentDropdownOpen((p) => !p)}
                    >
                      <div className={styles.dropdownContent}>
                        <i className="bx bx-book-bookmark" />
                        <input
                          type="text"
                          placeholder="Search or select"
                          value={
                            departmentDropdownOpen
                              ? departmentSearch
                              : formData.department
                          }
                          onChange={(e) => {
                            setDepartmentSearch(e.target.value);
                            setDepartmentDropdownOpen(true);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={styles.dropdownInput}
                          aria-label="Department search"
                        />
                      </div>
                      <i
                        className={`bx bx-chevron-down ${styles.chevronIcon} ${departmentDropdownOpen ? styles.rotate : ""}`}
                      />
                    </div>
                    {departmentDropdownOpen && (
                      <ul className={styles.dropdownMenu}>
                        {departmentsLoading ? (
                          <li
                            className={styles.dropdownItem}
                            style={{ justifyContent: "center" }}
                          >
                            Loading…
                          </li>
                        ) : departmentsList.length > 0 ? (
                          departmentsList.map((dept) => (
                            <li
                              key={dept.id}
                              className={styles.dropdownItem}
                              onClick={() => handleDepartmentSelect(dept)}
                            >
                              <i className="bx bx-book-bookmark" />
                              <div className={styles.dropdownItemContent}>
                                <span className={styles.dropdownItemName}>
                                  {dept.name}
                                </span>
                                {dept.code && (
                                  <span className={styles.dropdownItemSubtext}>
                                    {dept.code}
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
                            {departmentSearch
                              ? "No matches"
                              : "No departments loaded"}
                          </li>
                        )}
                      </ul>
                    )}
                    {validationErrors.department && (
                      <span className={styles.errorText}>
                        {validationErrors.department}
                      </span>
                    )}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="reg-rollno">
                    {role === "Student" ? "Student ID" : "Faculty ID"}
                  </label>
                  <div className={styles.inputWrapper}>
                    <i className="bx bx-id-card" aria-hidden="true" />
                    <input
                      id="reg-rollno"
                      type="text"
                      name="roll_no"
                      placeholder={
                        role === "Student" ? "e.g. STU12345" : "e.g. FAC67890"
                      }
                      value={formData.roll_no}
                      onChange={handleFormChange}
                      className={
                        validationErrors.roll_no ? styles.inputError : ""
                      }
                      aria-invalid={!!validationErrors.roll_no}
                    />
                  </div>
                  {validationErrors.roll_no && (
                    <span className={styles.errorText}>
                      {validationErrors.roll_no}
                    </span>
                  )}
                </div>
              </>
            )}

            {/* Step 3: Password & Submit */}
            {step === 3 && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="reg-password">
                    Password
                  </label>
                  <div className={styles.inputWrapper}>
                    <i className="bx bx-lock-alt" aria-hidden="true" />
                    <input
                      id="reg-password"
                      type={passwordInputType}
                      name="password"
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={handleFormChange}
                      className={
                        validationErrors.password ? styles.inputError : ""
                      }
                      autoComplete="new-password"
                      aria-invalid={!!validationErrors.password}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={(e) => {
                        e.preventDefault();
                        setShowPassword((p) => !p);
                      }}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      <i
                        className={
                          showPassword ? "bx bx-hide-alt" : "bx bx-show-alt"
                        }
                      />
                    </button>
                  </div>
                  {formData.password && (
                    <div className={styles.passwordStrength}>
                      <div className={styles.passwordStrengthTrack}>
                        <div
                          className={styles.passwordStrengthBar}
                          style={{ width: passwordStrength.width }}
                          data-strength={passwordStrength.score}
                        />
                      </div>
                      {passwordStrength.label && (
                        <span className={styles.passwordStrengthLabel}>
                          {passwordStrength.label}
                        </span>
                      )}
                    </div>
                  )}
                  {validationErrors.password && (
                    <span className={styles.errorText}>
                      {validationErrors.password}
                    </span>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel} htmlFor="reg-confirm">
                    Confirm password
                  </label>
                  <div className={styles.inputWrapper}>
                    <i className="bx bx-lock-alt" aria-hidden="true" />
                    <input
                      id="reg-confirm"
                      type={confirmPasswordInputType}
                      name="confirmPassword"
                      placeholder="Repeat password"
                      value={formData.confirmPassword}
                      onChange={handleFormChange}
                      className={
                        validationErrors.confirmPassword
                          ? styles.inputError
                          : ""
                      }
                      autoComplete="new-password"
                      aria-invalid={!!validationErrors.confirmPassword}
                    />
                    <button
                      type="button"
                      className={styles.passwordToggle}
                      onClick={(e) => {
                        e.preventDefault();
                        setShowConfirmPassword((p) => !p);
                      }}
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    >
                      <i
                        className={
                          showConfirmPassword
                            ? "bx bx-hide-alt"
                            : "bx bx-show-alt"
                        }
                      />
                    </button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <span className={styles.errorText}>
                      {validationErrors.confirmPassword}
                    </span>
                  )}
                </div>
              </>
            )}

            <div className={styles.buttonRow}>
              {step > 1 ? (
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={handleBack}
                  disabled={loading}
                >
                  <i className="bx bx-arrow-back" />
                  Back
                </button>
              ) : (
                <div />
              )}
              {step < 3 ? (
                <button
                  type="button"
                  className={styles.nextButton}
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !canProceedStep1) ||
                    (step === 2 && !canProceedStep2)
                  }
                >
                  Next
                  <i className="bx bx-chevron-right" />
                </button>
              ) : (
                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className={styles.spinner} />
                      <span>Creating account…</span>
                    </>
                  ) : (
                    <>
                      <i className="bx bx-user-plus" />
                      <span>Create account</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className={styles.divider}>
              <span>or</span>
            </div>
            <div className={styles.loginLink}>
              <p>
                Already have an account?{" "}
                <a
                  href="/login"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/login");
                  }}
                >
                  Sign in
                </a>
              </p>
            </div>
          </form>
        </div>

        <div className={styles.illustrationSection}>
          <div className={styles.illustrationContent}>
            <div className={styles.illustrationIcon}>
              <i className="bx bx-user-plus" />
            </div>
            <h2>Join InClass</h2>
            <p>
              Secure registration, biometric support, and real-time attendance.
            </p>
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <i className="bx bx-check-circle" />
                <span>Secure</span>
              </div>
              <div className={styles.featureItem}>
                <i className="bx bx-check-circle" />
                <span>Biometric</span>
              </div>
              <div className={styles.featureItem}>
                <i className="bx bx-check-circle" />
                <span>Real-time</span>
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
