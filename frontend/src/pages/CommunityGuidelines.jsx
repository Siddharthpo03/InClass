import React from "react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import styles from "./CommunityGuidelines.module.css";

const CommunityGuidelines = () => {
  return (
    <div className={styles.guidelinesWrapper}>
      <Navigation />
      <div className={styles.guidelinesContainer}>
        <div className={styles.guidelinesHeader}>
          <h1>Community Guidelines</h1>
          <p>Our standards for a respectful and productive community</p>
        </div>

        <div className={styles.contentSection}>
          <h2>Be Respectful</h2>
          <p>
            Treat all members of the InClass community with respect and kindness. 
            We value diverse perspectives and encourage constructive discussions.
          </p>

          <h2>Be Honest</h2>
          <p>
            Use the attendance system honestly. Marking attendance for others or 
            providing false information violates our terms of service.
          </p>

          <h2>Protect Privacy</h2>
          <p>
            Respect the privacy of others. Do not share personal information, 
            attendance codes, or session details with unauthorized individuals.
          </p>

          <h2>Report Issues</h2>
          <p>
            If you encounter inappropriate behavior or technical issues, please 
            report them through our <a href="/report">report system</a> or{" "}
            <a href="/support">contact support</a>.
          </p>

          <h2>Follow Terms of Service</h2>
          <p>
            All users must comply with our <a href="/terms">Terms of Use</a> and{" "}
            <a href="/privacy">Privacy Policy</a>. Violations may result in 
            account suspension or termination.
          </p>

          <h2>Prohibited Activities</h2>
          <ul>
            <li>Sharing attendance codes publicly</li>
            <li>Marking attendance for others</li>
            <li>Attempting to bypass security measures</li>
            <li>Harassment or discrimination</li>
            <li>Spam or unsolicited communications</li>
            <li>Unauthorized access to accounts</li>
            <li>Selling, distributing, or transferring the software (BR01)</li>
            <li>Creating clones or breakdowns without approval from Variance Technologies</li>
            <li>Engaging in any malpractice or fraudulent activities</li>
            <li>Reverse engineering, decompiling, or disassembling the software</li>
          </ul>

          <h2>Business Rules & Ownership</h2>
          <div className={styles.businessRules}>
            <div className={styles.ruleCard}>
              <h3>BR01: No Selling of Software</h3>
              <p>
                The InClass software is proprietary and may not be sold, distributed, or
                transferred without explicit written permission from Variance Technologies.
                Violation of this rule will result in immediate termination of access and
                potential legal action.
              </p>
            </div>
            <div className={styles.ruleCard}>
              <h3>BR02: Software Ownership</h3>
              <p>
                This Software Completely Belongs to InClass Powered By Variance Technologies.
                All patents and copyrights are reserved on Variance Technologies. If found any
                malpractices with the software, strict actions can be taken by our team on the
                college and the user.
              </p>
              <p>
                Study purpose breakdowns and clones are only accepted by the approval on
                Variance Technologies only. Any unauthorized reproduction, distribution, or
                modification of the software is strictly prohibited.
              </p>
            </div>
          </div>

          <h2>Consequences of Violations</h2>
          <p>
            Violations of these guidelines, especially malpractices with the software, will
            result in strict actions being taken by Variance Technologies against both the
            institution and the user, including but not limited to:
          </p>
          <ul>
            <li>Immediate account suspension or termination</li>
            <li>Legal action and reporting to relevant authorities</li>
            <li>Permanent ban from using InClass services</li>
            <li>Financial penalties where applicable</li>
            <li>Notification to educational institutions about violations</li>
          </ul>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CommunityGuidelines;

