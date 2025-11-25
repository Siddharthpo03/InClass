import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import "./Contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setSubmitMessage("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitMessage("✅ Thank you! Your message has been sent successfully.");
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    }, 1500);
  };

  return (
    <div className="contact-page-wrapper">
      <Navigation />

      <div
        className="contact-container"
        style={{ marginTop: "80px", marginBottom: "80px" }}
      >
        <section className="hero-section">
          <div className="hero-badge">Contact Us</div>
          <h1>Get in Touch</h1>
          <p className="subtitle">
            Have questions or need support? We're here to help. Reach out to us
            and we'll respond as soon as possible.
          </p>
        </section>

        <div className="contact-content">
          <div className="contact-info">
            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-envelope" />
              </div>
              <h3>Email</h3>
              <p>support@inclass.edu</p>
              <p>info@inclass.edu</p>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-phone" />
              </div>
              <h3>Phone</h3>
              <p>+1 (555) 123-4567</p>
              <p>Mon - Fri, 9:00 AM - 5:00 PM</p>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <i className="fas fa-map-marker-alt" />
              </div>
              <h3>Address</h3>
              <p>123 University Avenue</p>
              <p>Education City, EC 12345</p>
            </div>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
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

            <div className="form-group">
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

            <div className="form-group">
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

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="6"
                placeholder="Tell us more about your inquiry..."
              />
            </div>

            {submitMessage && (
              <div className="submit-message">{submitMessage}</div>
            )}

            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;

