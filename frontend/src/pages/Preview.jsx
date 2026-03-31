import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import styles from "./Preview.module.css";

const PAGES = [
  { path: "/", label: "Home", desc: "Landing page", loginRequired: false },
  { path: "/login", label: "Login", desc: "Sign in", loginRequired: false },
  { path: "/register", label: "Register", desc: "Create account", loginRequired: false },
  { path: "/about", label: "About", desc: "Mission & ownership", loginRequired: false },
  { path: "/features", label: "Features", desc: "What InClass offers", loginRequired: false },
  { path: "/contact", label: "Contact", desc: "Get in touch", loginRequired: false },
  { path: "/forgot", label: "Forgot Password", desc: "Reset password", loginRequired: false },
  { path: "/report", label: "Report", desc: "Report an issue", loginRequired: false },
  { path: "/terms", label: "Terms of Use", desc: "Legal terms", loginRequired: false },
  { path: "/privacy", label: "Privacy Policy", desc: "Privacy policy", loginRequired: false },
  { path: "/careers", label: "Careers", desc: "Jobs", loginRequired: false },
  { path: "/cookies", label: "Cookie Policy", desc: "Cookie declaration", loginRequired: false },
  { path: "/apply", label: "Job Application", desc: "Apply for a job", loginRequired: false },
  { path: "/help", label: "Help Center", desc: "Help & FAQ", loginRequired: false },
  { path: "/docs", label: "Documentation", desc: "Docs", loginRequired: false },
  { path: "/blog", label: "Blog", desc: "Blog & updates", loginRequired: false },
  { path: "/developers", label: "Developers", desc: "API & dev resources", loginRequired: false },
  { path: "/support", label: "Support", desc: "Support form", loginRequired: false },
  { path: "/newsletter", label: "Newsletter", desc: "Subscribe", loginRequired: false },
  { path: "/social", label: "Social Media", desc: "Social links", loginRequired: false },
  { path: "/accessibility", label: "Accessibility", desc: "Accessibility info", loginRequired: false },
  { path: "/guidelines", label: "Community Guidelines", desc: "Guidelines", loginRequired: false },
  { path: "/preview/student", label: "Student Dashboard (preview)", desc: "Student portal — no login", loginRequired: false },
  { path: "/preview/faculty", label: "Faculty Dashboard (preview)", desc: "Faculty portal — no login", loginRequired: false },
  { path: "/preview/admin", label: "Admin Dashboard (preview)", desc: "Admin portal — no login", loginRequired: false },
  { path: "/student/register-courses", label: "Course Registration", desc: "Requires login", loginRequired: true },
  { path: "/faculty/courses", label: "Faculty Courses", desc: "Requires login", loginRequired: true },
  { path: "/faculty/sessions", label: "Sessions", desc: "Requires login", loginRequired: true },
  { path: "/faculty/profile", label: "Faculty Profile", desc: "Requires login", loginRequired: true },
  { path: "/inclass/admin/login", label: "Admin Login", desc: "Admin sign in", loginRequired: false },
];

const Preview = () => {
  return (
    <PageLayout
      heroBadge="Preview"
      heroTitle="Page Preview Index"
      heroSubtitle="Open any page to check layout and design — no login required. Student, Faculty, and Admin dashboards have preview links below so you can view them without signing in (for testing only)."
    >
      <section className={styles.section}>
        <h2>All previewable pages (no login)</h2>
        <div className={styles.grid}>
          {PAGES.filter((p) => !p.loginRequired).map((page) => (
            <Link
              key={page.path}
              to={page.path}
              className={styles.card}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.cardLabel}>{page.label}</span>
              <span className={styles.cardDesc}>{page.desc}</span>
              <span className={styles.cardPath}>{page.path}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Other pages (login required in app)</h2>
        <div className={styles.grid}>
          {PAGES.filter((p) => p.loginRequired).map((page) => (
            <Link
              key={page.path}
              to={page.path}
              className={styles.card}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.cardLabel}>{page.label}</span>
              <span className={styles.cardDesc}>{page.desc}</span>
              <span className={styles.cardPath}>{page.path}</span>
              <span className={styles.requiresLogin}>Requires login</span>
            </Link>
          ))}
        </div>
      </section>
    </PageLayout>
  );
};

export default Preview;
