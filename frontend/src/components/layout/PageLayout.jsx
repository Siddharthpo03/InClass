import React from "react";
import Navigation from "../Navigation";
import Footer from "../Footer";
import useDarkMode from "../../hooks/useDarkMode";
import styles from "./PageLayout.module.css";

/**
 * Shared layout for all content pages. Keeps Nav, container margin, optional hero, and Footer in sync.
 * Use: <PageLayout heroBadge="About" heroTitle="..." heroSubtitle="...">{content}</PageLayout>
 */
const PageLayout = ({
  heroBadge,
  heroTitle,
  heroSubtitle,
  children,
  className = "",
}) => {
  useDarkMode();

  return (
    <div className={`${styles.pageWrapper} ${className}`.trim()}>
      <Navigation />
      <div
        className={styles.pageContainer}
        style={{ marginTop: "80px", marginBottom: "80px" }}
      >
        {(heroBadge || heroTitle) && (
          <section className={styles.heroSection}>
            {heroBadge && <div className={styles.heroBadge}>{heroBadge}</div>}
            {heroTitle && <h1>{heroTitle}</h1>}
            {heroSubtitle && <p className={styles.heroSubtitle}>{heroSubtitle}</p>}
          </section>
        )}
        {children}
      </div>
      <Footer />
    </div>
  );
};

export default PageLayout;
