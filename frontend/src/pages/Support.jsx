import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import styles from "./Support.module.css";

const Support = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "general"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    alert("Support request submitted! We'll get back to you soon.");
    setFormData({ name: "", email: "", subject: "", message: "", category: "general" });
  };

  return (
    <div className={styles.supportWrapper}>
      <Navigation />
      <div className={styles.supportContainer}>
        <div className={styles.supportHeader}>
          <h1>Get Support</h1>
          <p>We're here to help you with any questions or issues</p>
        </div>

        <div className={styles.supportGrid}>
          <div className={styles.supportOptions}>
            <div className={styles.optionCard}>
              <i className="bx bx-envelope"></i>
              <h3>Email Support</h3>
              <p>support@inclass.com</p>
              <p>Response within 24 hours</p>
            </div>

            <div className={styles.optionCard}>
              <i className="bx bx-help-circle"></i>
              <h3>Help Center</h3>
              <p>Browse our knowledge base</p>
              <a href="/help" className={styles.optionLink}>Visit Help Center →</a>
            </div>

            <div className={styles.optionCard}>
              <i className="bx bx-bug"></i>
              <h3>Report Issue</h3>
              <p>Found a bug? Let us know</p>
              <a href="/report" className={styles.optionLink}>Report Issue →</a>
            </div>
          </div>

          <div className={styles.supportForm}>
            <h2>Contact Support</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="general">General Inquiry</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing</option>
                  <option value="feature">Feature Request</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Message</label>
                <textarea
                  rows="6"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                ></textarea>
              </div>

              <button type="submit" className={styles.submitButton}>
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Support;

