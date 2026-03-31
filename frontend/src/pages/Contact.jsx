import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";
import styles from "./Contact.module.css";

const classNames = (...classes) =>
  classes
    .filter(Boolean)
    .map((cls) => {
      if (typeof cls === "string") {
        const camelCase = cls.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        return styles[camelCase] || styles[cls] || cls;
      }
      return null;
    })
    .filter(Boolean)
    .join(" ");

const Contact = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSubmitMessage("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitMessage("Thank you! Your message has been sent successfully.");
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 1500);
  };

  return (
    <PageLayout
      heroBadge="Contact Us"
      heroTitle="Get in Touch"
      heroSubtitle="Have questions or need support? We're here to help. Reach out to us and we'll respond as soon as possible."
    >
      <section className={classNames("contact-section")}>
        <h2>Reach Out</h2>
        <div className={classNames("contact-grid")}>
          <div className={classNames("feature-card")}>
            <div className={classNames("feature-icon")}>
              <i className="fas fa-envelope" />
            </div>
            <h4>Email</h4>
            <p>support@inclass.edu</p>
            <p>info@inclass.edu</p>
          </div>
          <div className={classNames("feature-card")}>
            <div className={classNames("feature-icon")}>
              <i className="fas fa-phone" />
            </div>
            <h4>Phone</h4>
            <p>+1 (555) 123-4567</p>
            <p>Mon – Fri, 9:00 AM – 5:00 PM</p>
          </div>
          <div className={classNames("feature-card")}>
            <div className={classNames("feature-icon")}>
              <i className="fas fa-map-marker-alt" />
            </div>
            <h4>Address</h4>
            <p>123 University Avenue</p>
            <p>Education City, EC 12345</p>
          </div>
        </div>

        <div className={classNames("contact-form-wrap")}>
          <h3>Send a Message</h3>
          <form className={classNames("contact-form")} onSubmit={handleSubmit}>
            <div className={classNames("form-group")}>
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your full name"
              />
            </div>
            <div className={classNames("form-group")}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your.email@example.com"
              />
            </div>
            <div className={classNames("form-group")}>
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="What is this regarding?"
              />
            </div>
            <div className={classNames("form-group")}>
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                placeholder="Tell us more about your inquiry..."
              />
            </div>
            {submitMessage && (
              <div className={classNames("submit-message")}>{submitMessage}</div>
            )}
            <button
              type="submit"
              className={classNames("submit-btn")}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </section>

      <section className={classNames("cta-section")}>
        <h2>Ready to Get Started?</h2>
        <button
          className={classNames("register-cta-btn")}
          onClick={() => navigate("/register")}
        >
          Create Account
        </button>
      </section>
    </PageLayout>
  );
};

export default Contact;
