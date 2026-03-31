import React, { useState } from "react";
import PageLayout from "../components/layout/PageLayout";
import styles from "./Newsletter.module.css";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubscribed(true);
    setEmail("");
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <PageLayout
      heroTitle="Subscribe to Newsletter"
      heroSubtitle="Stay updated with the latest features, updates, and news from InClass"
    >
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
    </PageLayout>
  );
};

export default Newsletter;
