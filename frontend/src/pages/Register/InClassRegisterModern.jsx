import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import apiClient from "../../utils/apiClient";
import useDarkMode from "../../hooks/useDarkMode";
import CountryCodeSelector from "../../components/CountryCodeSelector";
import styles from "./InClassRegisterModern.module.css";

const STEPS = [
  { id: 1, title: "Account", icon: "bx-user" },
  { id: 2, title: "Institution", icon: "bx-building" },
  { id: 3, title: "Security", icon: "bx-lock-alt" },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^\d{10}$/;

const ROLE_OPTIONS = [
  { value: "student", label: "Student", icon: "bx-book" },
  { value: "faculty", label: "Faculty", icon: "bx-briefcase" },
];

const getRoleLabel = (role) => {
  if (!role) return "";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: "", width: "0%" };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  const labels = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"];
  const colors = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#84cc16",
    "#22c55e",
    "#22c55e",
  ];
  return {
    score,
    label: labels[score],
    color: colors[score],
    width: `${(score / 5) * 100}%`,
  };
};

const InClassRegisterModern = () => {
  useDarkMode();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const collegeRef = useRef(null);
  const departmentRef = useRef(null);

  /**
   * Initial form data object. Kept as a separate constant so TypeScript/JSDoc
   * can infer the shape and editor won't treat `formData` as `{}`.
   */
  const INITIAL_FORM_DATA = {
    name: "",
    email: "",
    mobile_number: "",
    country_code: "+1",
    role: "student",
    password: "",
    confirmPassword: "",
    college: "",
    college_id: null,
    department: "",
    department_id: null,
    roll_no: "",
    gender: "",
    date_of_birth: "",
    address: "",
    section: "",
    year_semester: "",
    college_id_number: "",
    employee_id: "",
    designation: "",
  };

  /**
   * @typedef {{
   *  name: string,
   *  email: string,
   *  mobile_number: string,
   *  country_code: string,
   *  role: string,
   *  password: string,
   *  confirmPassword: string,
   *  college: string,
   *  college_id: number|string|null,
   *  department: string,
   *  department_id: number|string|null,
   *  roll_no: string,
  *  gender: string,
  *  date_of_birth: string,
  *  address: string,
  *  section: string,
  *  year_semester: string,
  *  college_id_number: string,
  *  employee_id: string,
  *  designation: string,
   * }} FormData
   */
  /**
   * `useState` tuple typing so the TS server understands the destructured array.
   * @type {[FormData, import('react').Dispatch<import('react').SetStateAction<FormData>>]}
   */
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  /**
   * Validation errors map and its setter typed as the useState tuple.
   * @type {[{[key:string]: string}, import('react').Dispatch<import('react').SetStateAction<{[key:string]: string}>>]}
   */
  const [validationErrors, setValidationErrors] = useState({});
  const [collegesList, setCollegesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [collegesOpen, setCollegesOpen] = useState(false);
  const [departmentsOpen, setDepartmentsOpen] = useState(false);
  const [collegeSearch, setCollegeSearch] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password],
  );

  // Fetch colleges
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await apiClient.get("/auth/colleges", {
          params: { search: collegeSearch || "" },
        });
        setCollegesList(response.data.colleges || []);
      } catch (err) {
        console.error("Failed to fetch colleges:", err);
        setCollegesList([]);
      }
    };

    const timer = setTimeout(fetchColleges, collegeSearch ? 300 : 0);
    return () => clearTimeout(timer);
  }, [collegeSearch]);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await apiClient.get("/auth/departments", {
          params: { search: departmentSearch || "" },
        });
        setDepartmentsList(response.data?.departments || []);
      } catch (err) {
        console.error("Failed to fetch departments:", err);
        setDepartmentsList([]);
      }
    };

    const timer = setTimeout(fetchDepartments, departmentSearch ? 300 : 0);
    return () => clearTimeout(timer);
  }, [departmentSearch]);

  const handleInputChange = (e) => {
    /** @type {{ name?: string, value?: any, target?: any }} */
    const { name, value } = e.target || {};
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  };

  const handleCountryCodeChange = (code) => {
    setFormData((prev) => ({ ...prev, country_code: code }));
    setValidationErrors((prev) => ({ ...prev, country_code: "" }));
  };

  const validateStep1 = useCallback(() => {
    /** @type {{ [key: string]: string }} */
    const errors = {};
    if (!formData.name?.trim()) errors.name = "Name is required";
    else if (formData.name.trim().length < 2)
      errors.name = "At least 2 characters";

    if (!formData.email?.trim()) errors.email = "Email is required";
    else if (!EMAIL_REGEX.test(formData.email))
      errors.email = "Invalid email format";

    if (!formData.mobile_number?.trim())
      errors.mobile_number = "Mobile number is required";
    else if (!MOBILE_REGEX.test(formData.mobile_number.trim()))
      errors.mobile_number = "10-digit number required";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.name, formData.email, formData.mobile_number]);

  const validateStep2 = useCallback(() => {
    /** @type {{ [key: string]: string }} */
    const errors = {};
    if (!formData.college_id) errors.college = "Select a college";
    if (!formData.department_id) errors.department = "Select a department";
    if (!formData.roll_no?.trim())
      errors.roll_no = `${getRoleLabel(formData.role)} ID is required`;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [
    formData.college_id,
    formData.department_id,
    formData.roll_no,
    formData.role,
  ]);

  const validateStep3 = useCallback(() => {
    /** @type {{ [key: string]: string }} */
    const errors = {};
    if (!formData.password?.trim()) errors.password = "Password is required";
    else if (formData.password.length < 6)
      errors.password = "At least 6 characters";

    if (!formData.confirmPassword?.trim())
      errors.confirmPassword = "Confirm your password";
    else if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = "Passwords don't match";

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData.password, formData.confirmPassword]);

  const handleNext = () => {
    let isValid = false;
    if (currentStep === 1) isValid = validateStep1();
    else if (currentStep === 2) isValid = validateStep2();
    else if (currentStep === 3) isValid = validateStep3();

    if (isValid) {
      if (currentStep < STEPS.length) setCurrentStep(currentStep + 1);
      else handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    setServerError("");

    try {
      const response = await apiClient.post("/auth/register", {
        name: formData.name,
        email: formData.email,
        mobile_number: formData.mobile_number,
        password: formData.password,
        role: formData.role,
        college_id: formData.college_id,
        department_id: formData.department_id,
        roll_no: formData.roll_no,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth || null,
        address: formData.address,
        section: formData.section,
        year_semester: formData.year_semester,
        college_id_number: formData.college_id_number,
        employee_id: formData.employee_id,
        designation: formData.designation,
      });

      if (response.data?.token) {
        localStorage.setItem("inclass_token", response.data.token);
        localStorage.setItem("user_id", response.data.userId);
        localStorage.setItem("user_role", response.data.role);
        navigate(`/onboard/biometrics?userId=${response.data.userId}`);
      }
    } catch (error) {
      const msg =
        error.response?.data?.error?.message ||
        "Registration failed. Try again.";
      setServerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCollegeSelect = (college) => {
    setFormData((prev) => ({
      ...prev,
      college: college.name,
      college_id:
        typeof college.id === "number" ? college.id : Number(college.id),
    }));
    setCollegeSearch("");
    setCollegesOpen(false);
    setValidationErrors((prev) => ({ ...prev, college: "" }));
  };

  const handleDepartmentSelect = (dept) => {
    setFormData((prev) => ({
      ...prev,
      department: dept.name,
      department_id: typeof dept.id === "number" ? dept.id : Number(dept.id),
    }));
    setDepartmentSearch("");
    setDepartmentsOpen(false);
    setValidationErrors((prev) => ({ ...prev, department: "" }));
  };

  return (
    <div className={`${styles.wrapper} ${styles.registerPage}`}>
      <button
        className={styles.themeToggle}
        onClick={toggleTheme}
        aria-label="Toggle theme"
        title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        <i className={`bx ${isDarkMode ? "bx-sun" : "bx-moon"}`}></i>
      </button>
      <div className={styles.container}>
        <button
          type="button"
          className={styles.backButton}
          onClick={() => navigate("/")}
          aria-label="Go back to homepage"
          title="Back to homepage"
        >
          <i className="bx bx-arrow-back"></i>
        </button>

        {/* Progress Bar */}
        <div className={styles.progressSection}>
          <div className={styles.stepsIndicator}>
            {STEPS.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className={styles.stepContainer}>
                  <span className={styles.stepLabel}>{step.title}</span>
                  <div
                    className={`${styles.stepCircle} ${
                      currentStep >= step.id ? styles.active : ""
                    }`}
                  >
                    <i className={`bx ${step.icon}`}></i>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div
                    className={`${styles.connector} ${
                      currentStep > step.id ? styles.completed : ""
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Content */}
        <div className={styles.formWrapper}>
          {serverError && (
            <div className={styles.alert} role="alert">
              <i className="bx bx-exclamation-circle"></i>
              <span>{serverError}</span>
            </div>
          )}

          {/* Step 1: Account Info */}
          {currentStep === 1 && (
            <div className={styles.step}>
              <div className={styles.stepHeader}>
                <h2>Create Your Account</h2>
                <p>Enter your basic information</p>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="name">Full Name</label>
                <div className={styles.inputWrapper}>
                  <i className="bx bx-user"></i>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={validationErrors.name ? styles.inputError : ""}
                    disabled={loading}
                  />
                </div>
                {validationErrors.name && (
                  <span className={styles.errorText}>
                    {validationErrors.name}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address</label>
                <div className={styles.inputWrapper}>
                  <i className="bx bx-envelope"></i>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={validationErrors.email ? styles.inputError : ""}
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
                {validationErrors.email && (
                  <span className={styles.errorText}>
                    {validationErrors.email}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Mobile Number</label>
                <div className={styles.mobileInputContainer}>
                  <CountryCodeSelector
                    value={formData.country_code}
                    onChange={handleCountryCodeChange}
                    error={validationErrors.country_code}
                  />
                  <div className={styles.inputWrapper} style={{ flex: 1 }}>
                    <i className="bx bx-phone"></i>
                    <input
                      id="mobile"
                      type="tel"
                      name="mobile_number"
                      placeholder="10-digit number"
                      value={formData.mobile_number}
                      onChange={handleInputChange}
                      className={
                        validationErrors.mobile_number ? styles.inputError : ""
                      }
                      disabled={loading}
                      autoComplete="tel-national"
                      maxLength={10}
                    />
                  </div>
                </div>
                {validationErrors.mobile_number && (
                  <span className={styles.errorText}>
                    {validationErrors.mobile_number}
                  </span>
                )}
              </div>

              <div className={styles.roleSelector}>
                <label>I am a</label>
                <div className={styles.roleButtons}>
                  {ROLE_OPTIONS.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      className={`${styles.roleButton} ${
                        formData.role === r.value ? styles.selected : ""
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, role: r.value }))
                      }
                      disabled={loading}
                    >
                      <i className={`bx ${r.icon}`}></i>
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Institution */}
          {currentStep === 2 && (
            <div className={styles.step}>
              <div className={styles.stepHeader}>
                <h2>Institution Details</h2>
                <p>Select your college and department</p>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="college">College</label>
                <div className={styles.autocompleteWrapper} ref={collegeRef}>
                  <div className={styles.inputWrapper}>
                    <i className="bx bx-building"></i>
                    <input
                      id="college"
                      type="text"
                      placeholder="Search college..."
                      value={collegeSearch || formData.college}
                      onChange={(e) => setCollegeSearch(e.target.value)}
                      onFocus={() => setCollegesOpen(true)}
                      className={
                        validationErrors.college ? styles.inputError : ""
                      }
                      disabled={loading}
                    />
                  </div>
                  {collegesOpen && (
                    <div className={styles.dropdown}>
                      {collegesList.length > 0 ? (
                        collegesList.map((college) => (
                          <button
                            key={college.id}
                            type="button"
                            className={styles.dropdownItem}
                            onClick={() => handleCollegeSelect(college)}
                          >
                            {college.name}
                          </button>
                        ))
                      ) : (
                        <div className={styles.dropdownEmpty}>
                          No colleges found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {validationErrors.college && (
                  <span className={styles.errorText}>
                    {validationErrors.college}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="department">Department</label>
                <div className={styles.autocompleteWrapper} ref={departmentRef}>
                  <div className={styles.inputWrapper}>
                    <i className="bx bx-folder"></i>
                    <input
                      id="department"
                      type="text"
                      placeholder="Search department..."
                      value={departmentSearch || formData.department}
                      onChange={(e) => setDepartmentSearch(e.target.value)}
                      onFocus={() => setDepartmentsOpen(true)}
                      className={
                        validationErrors.department ? styles.inputError : ""
                      }
                      disabled={loading}
                    />
                  </div>
                  {departmentsOpen && (
                    <div className={styles.dropdown}>
                      {departmentsList.length > 0 ? (
                        departmentsList.map((dept) => (
                          <button
                            key={dept.id}
                            type="button"
                            className={styles.dropdownItem}
                            onClick={() => handleDepartmentSelect(dept)}
                          >
                            {dept.name}
                          </button>
                        ))
                      ) : (
                        <div className={styles.dropdownEmpty}>
                          No departments found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {validationErrors.department && (
                  <span className={styles.errorText}>
                    {validationErrors.department}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="rollNo">{getRoleLabel(formData.role)} ID</label>
                <div className={styles.inputWrapper}>
                  <i className="bx bx-barcode"></i>
                  <input
                    id="rollNo"
                    type="text"
                    name="roll_no"
                    placeholder={
                      formData.role === "student" ? "STU12345" : "FAC001"
                    }
                    value={formData.roll_no}
                    onChange={handleInputChange}
                    className={
                      validationErrors.roll_no ? styles.inputError : ""
                    }
                    disabled={loading}
                  />
                </div>
                {validationErrors.roll_no && (
                  <span className={styles.errorText}>
                    {validationErrors.roll_no}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Gender</label>
                <div className={styles.inputWrapper}>
                  <i className="bx bx-user"></i>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Date of Birth</label>
                <div className={styles.inputWrapper}>
                  <i className="bx bx-calendar"></i>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>
              </div>

              {formData.role === "student" && (
                <>
                  <div className={styles.formGroup}>
                    <label>Section</label>
                    <div className={styles.inputWrapper}>
                      <i className="bx bx-group"></i>
                      <select
                        name="section"
                        value={formData.section}
                        onChange={handleInputChange}
                        disabled={loading}
                      >
                        <option value="">Select Section</option>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                        <option value="D">Section D</option>
                        <option value="E">Section E</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Year / Semester</label>
                    <div className={styles.inputWrapper}>
                      <i className="bx bx-book-open"></i>
                      <select
                        name="year_semester"
                        value={formData.year_semester}
                        onChange={handleInputChange}
                        disabled={loading}
                      >
                        <option value="">Select Year/Semester</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="5th Year">5th Year</option>
                        <option value="Sem 1">Semester 1</option>
                        <option value="Sem 2">Semester 2</option>
                        <option value="Sem 3">Semester 3</option>
                        <option value="Sem 4">Semester 4</option>
                        <option value="Sem 5">Semester 5</option>
                        <option value="Sem 6">Semester 6</option>
                        <option value="Sem 7">Semester 7</option>
                        <option value="Sem 8">Semester 8</option>
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>College ID Number</label>
                    <div className={styles.inputWrapper}>
                      <i className="bx bx-id-card"></i>
                      <input
                        type="text"
                        name="college_id_number"
                        placeholder="e.g. 23CSB0A46"
                        value={formData.college_id_number}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </>
              )}

              {formData.role === "faculty" && (
                <>
                  <div className={styles.formGroup}>
                    <label>Employee ID</label>
                    <div className={styles.inputWrapper}>
                      <i className="bx bx-id-card"></i>
                      <input
                        type="text"
                        name="employee_id"
                        placeholder="e.g. EMP001"
                        value={formData.employee_id}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Designation</label>
                    <div className={styles.inputWrapper}>
                      <i className="bx bx-briefcase"></i>
                      <select
                        name="designation"
                        value={formData.designation}
                        onChange={handleInputChange}
                        disabled={loading}
                      >
                        <option value="">Select Designation</option>
                        <option value="Professor">Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Lecturer">Lecturer</option>
                        <option value="Visiting Faculty">Visiting Faculty</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3: Security */}
          {currentStep === 3 && (
            <div className={styles.step}>
              <div className={styles.stepHeader}>
                <h2>Set Your Password</h2>
                <p>Create a strong password for your account</p>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password">Password</label>
                <div className={styles.inputWrapper}>
                  <i className="bx bx-lock-alt"></i>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={
                      validationErrors.password ? styles.inputError : ""
                    }
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    <i
                      className={`bx ${showPassword ? "bx-hide-alt" : "bx-show-alt"}`}
                    ></i>
                  </button>
                </div>
                {validationErrors.password && (
                  <span className={styles.errorText}>
                    {validationErrors.password}
                  </span>
                )}

                {formData.password && (
                  <div className={styles.strengthIndicator}>
                    <div className={styles.strengthBar}>
                      <div
                        className={styles.strengthFill}
                        style={{
                          width: passwordStrength.width,
                          backgroundColor: passwordStrength.color,
                        }}
                      />
                    </div>
                    <span
                      className={styles.strengthLabel}
                      style={{ color: passwordStrength.color }}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirm">Confirm Password</label>
                <div className={styles.inputWrapper}>
                  <i className="bx bx-lock-alt"></i>
                  <input
                    id="confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={
                      validationErrors.confirmPassword ? styles.inputError : ""
                    }
                    disabled={loading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    <i
                      className={`bx ${showConfirmPassword ? "bx-hide-alt" : "bx-show-alt"}`}
                    ></i>
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <span className={styles.errorText}>
                    {validationErrors.confirmPassword}
                  </span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Address (Optional)</label>
                <div className={styles.inputWrapper}>
                  <i className="bx bx-map"></i>
                  <textarea
                    name="address"
                    placeholder="Your address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
                    style={{
                      padding: "0.75rem 1rem 0.75rem 2.75rem",
                      resize: "vertical",
                    }}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className={styles.buttonGroup}>
            {currentStep > 1 && (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handlePrevious}
                disabled={loading}
              >
                <i className="bx bx-chevron-left"></i>
                Previous
              </button>
            )}
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleNext}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  <span>Processing...</span>
                </>
              ) : currentStep === STEPS.length ? (
                <>
                  <i className="bx bx-check"></i>
                  <span>Complete Registration</span>
                </>
              ) : (
                <>
                  <span>Next</span>
                  <i className="bx bx-chevron-right"></i>
                </>
              )}
            </button>
          </div>

          {/* Sign In Link */}
          <div className={styles.signInLink}>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className={styles.link}
              disabled={loading}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InClassRegisterModern;
