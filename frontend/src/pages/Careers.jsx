import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import styles from "./Careers.module.css";

const Careers = () => {
  const navigate = useNavigate();

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

  const jobOpenings = [
    {
      id: 1,
      title: "Senior Full-Stack Developer",
      department: "Engineering",
      location: "Remote / Hybrid",
      type: "Full-time",
      experience: "5+ years",
      description: "Lead development of innovative features for our attendance management platform. Work with cutting-edge technologies including React, Node.js, and PostgreSQL.",
      requirements: [
        "Expertise in React and Node.js",
        "Experience with PostgreSQL",
        "Strong problem-solving skills",
        "Excellent communication abilities"
      ]
    },
    {
      id: 2,
      title: "UI/UX Designer",
      department: "Design",
      location: "Remote",
      type: "Full-time",
      experience: "3+ years",
      description: "Create beautiful, intuitive user experiences that make attendance management seamless. Work closely with our engineering team to bring designs to life.",
      requirements: [
        "Portfolio demonstrating modern design skills",
        "Proficiency in Figma, Adobe XD, or similar",
        "Understanding of user-centered design",
        "Experience with responsive design"
      ]
    },
    {
      id: 3,
      title: "Product Manager",
      department: "Product",
      location: "Hybrid",
      type: "Full-time",
      experience: "4+ years",
      description: "Drive product strategy and roadmap for InClass. Collaborate with engineering, design, and stakeholders to deliver exceptional user experiences.",
      requirements: [
        "Proven track record in product management",
        "Strong analytical skills",
        "Excellent stakeholder management",
        "Experience with agile methodologies"
      ]
    },
    {
      id: 4,
      title: "DevOps Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      experience: "3+ years",
      description: "Ensure our infrastructure is scalable, secure, and reliable. Manage deployments, monitoring, and automation for our cloud-based platform.",
      requirements: [
        "Experience with cloud platforms (AWS, Azure, GCP)",
        "Knowledge of CI/CD pipelines",
        "Containerization experience (Docker, Kubernetes)",
        "Strong scripting skills"
      ]
    }
  ];

  return (
    <div className={styles.careersPageWrapper}>
      <Navigation />

      <div className={styles.careersContainer}>
        <section className={styles.heroSection}>
          <div className={styles.heroBadge}>Join Our Team</div>
          <h1>Build the Future of Education</h1>
          <p className={styles.subtitle}>
            We're looking for passionate individuals who want to make a difference
            in education technology. Join us in creating innovative solutions that
            transform how universities manage attendance.
          </p>
        </section>

        <section className={styles.benefitsSection}>
          <h2>Why Work With Us?</h2>
          <div className={styles.benefitsGrid}>
            <div className={styles.benefitCard}>
              <div className={styles.benefitIcon}>
                <i className="fas fa-heart" />
              </div>
              <h3>Impact</h3>
              <p>Make a real difference in education technology</p>
            </div>
            <div className={styles.benefitCard}>
              <div className={styles.benefitIcon}>
                <i className="fas fa-users" />
              </div>
              <h3>Great Team</h3>
              <p>Work with talented, passionate professionals</p>
            </div>
            <div className={styles.benefitCard}>
              <div className={styles.benefitIcon}>
                <i className="fas fa-laptop-code" />
              </div>
              <h3>Flexible Work</h3>
              <p>Remote and hybrid options available</p>
            </div>
            <div className={styles.benefitCard}>
              <div className={styles.benefitIcon}>
                <i className="fas fa-graduation-cap" />
              </div>
              <h3>Growth</h3>
              <p>Continuous learning and development opportunities</p>
            </div>
            <div className={styles.benefitCard}>
              <div className={styles.benefitIcon}>
                <i className="fas fa-dollar-sign" />
              </div>
              <h3>Competitive Pay</h3>
              <p>Attractive compensation packages</p>
            </div>
            <div className={styles.benefitCard}>
              <div className={styles.benefitIcon}>
                <i className="fas fa-calendar-alt" />
              </div>
              <h3>Work-Life Balance</h3>
              <p>Flexible hours and generous time off</p>
            </div>
          </div>
        </section>

        <section className={styles.jobsSection}>
          <h2>Open Positions</h2>
          <div className={styles.jobsGrid}>
            {jobOpenings.map((job) => (
              <div key={job.id} className={styles.jobCard}>
                <div className={styles.jobHeader}>
                  <div className={styles.jobTitleSection}>
                    <h3>{job.title}</h3>
                    <div className={styles.jobMeta}>
                      <span className={styles.jobDepartment}>{job.department}</span>
                      <span className={styles.jobLocation}>
                        <i className="fas fa-map-marker-alt" /> {job.location}
                      </span>
                      <span className={styles.jobType}>
                        <i className="fas fa-briefcase" /> {job.type}
                      </span>
                    </div>
                  </div>
                  <div className={styles.jobExperience}>{job.experience}</div>
                </div>
                <p className={styles.jobDescription}>{job.description}</p>
                <div className={styles.jobRequirements}>
                  <h4>Key Requirements:</h4>
                  <ul>
                    {job.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
                <button
                  className={styles.applyButton}
                  onClick={() => navigate("/contact")}
                >
                  Apply Now
                  <i className="fas fa-arrow-right" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.ctaSection}>
          <h2>Don't See a Role That Fits?</h2>
          <p>
            We're always looking for talented people. Send us your resume and
            we'll keep you in mind for future opportunities.
          </p>
          <button
            className={styles.contactButton}
            onClick={() => navigate("/contact")}
          >
            Get in Touch
          </button>
        </section>
      </div>

      <Footer />
    </div>
  );
};

export default Careers;

