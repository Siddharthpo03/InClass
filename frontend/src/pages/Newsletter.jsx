import React, { useState } from "react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import styles from "./Newsletter.module.css";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle subscription
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <div className={styles.newsletterWrapper}>
      <Navigation />
      <div className={styles.newsletterContainer}>
        <div className={styles.newsletterHeader}>
          <h1>Subscribe to Newsletter</h1>
          <p>Stay updated with the latest features, updates, and news from InClass</p>
        </div>

        <div className={styles.newsletterContent}>
          <div className={styles.newsletterForm}>
            {subscribed ? (
              <div className={styles.successMessage}>
                <i className="bx bx-check-circle"></i>
                <h3>Successfully Subscribed!</h3>
                <p>Thank you for subscribing. You'll receive our latest updates via email.</p>
              </div>
            ) : (
              <>
                <h2>Get Updates</h2>
                <p>Join our newsletter to receive:</p>
                <ul>
                  <li><i className="bx bx-check"></i> Latest feature announcements</li>
                  <li><i className="bx bx-check"></i> System updates and improvements</li>
                  <li><i className="bx bx-check"></i> Tips and best practices</li>
                  <li><i className="bx bx-check"></i> Security updates</li>
                </ul>
                <form onSubmit={handleSubmit}>
                  <div className={styles.inputGroup}>
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <button type="submit">Subscribe</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Newsletter;

