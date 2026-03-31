import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../utils/apiClient";
import TopNav from "../../components/faculty/TopNav";
import Sidebar from "../../components/faculty/Sidebar";
import LoadingSpinner from "../../components/shared/LoadingSpinner";
import ToastContainer from "../../components/shared/ToastContainer";
import styles from "./ProfileEdit.module.css";

const ProfileEdit = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Editable fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");

  const showToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type, show: true }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/auth/profile");
        const data = response.data;
        setProfile(data);
        setName(data.name || "");
        setEmail(data.email || "");
        setMobileNumber(data.mobile_number || "");
        setCountryCode(data.country_code || "+91");
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          navigate("/login");
        } else {
          showToast("Failed to load profile.", "error");
          setLoading(false);
        }
      }
    };
    fetchProfile();
  }, [navigate, showToast]);

  const handleSave = useCallback(
    async (e) => {
      e.preventDefault();
      setSaving(true);

      try {
        await apiClient.put("/auth/profile", {
          name,
          email,
          mobile_number: mobileNumber,
          country_code: countryCode,
        });

        showToast("Profile updated successfully", "success");
        setTimeout(() => {
          navigate("/faculty/dashboard");
        }, 1500);
      } catch (error) {
        const msg =
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          "Failed to update profile.";
        showToast(msg, "error");
      } finally {
        setSaving(false);
      }
    },
    [name, email, mobileNumber, countryCode, navigate, showToast]
  );

  const handleLogout = useCallback(() => {
    localStorage.removeItem("inclass_token");
    localStorage.removeItem("user_role");
    navigate("/login");
  }, [navigate]);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading profile..." />;
  }

  if (!profile) {
    return (
      <div className={styles.errorContainer}>
        <p>Failed to load profile</p>
        <button onClick={() => navigate("/faculty/dashboard")}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className={styles.profileWrapper}>
      <TopNav profile={profile} onLogout={handleLogout} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={styles.profileContainer}>
        <button
          className={styles.mobileMenuButton}
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
          type="button"
        >
          <i className="bx bx-menu"></i>
        </button>

        <header className={styles.header}>
          <button
            className={styles.backButton}
            onClick={() => navigate("/faculty/dashboard")}
            type="button"
          >
            <i className="bx bx-arrow-back"></i>
            Back
          </button>
          <div>
            <h1 className={styles.title}>Edit Profile</h1>
            <p className={styles.subtitle}>Update your profile information</p>
          </div>
        </header>

        <section className={styles.profileSection}>
          <form onSubmit={handleSave} className={styles.profileForm}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={styles.formInput}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.formInput}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Country Code</label>
              <input
                type="text"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className={styles.formInput}
                placeholder="+91"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Mobile Number</label>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                className={styles.formInput}
                placeholder="1234567890"
              />
            </div>

            <div className={styles.readOnlyFields}>
              <h3 className={styles.readOnlyTitle}>Read-Only Information</h3>
              <div className={styles.readOnlyItem}>
                <span className={styles.readOnlyLabel}>Role:</span>
                <span className={styles.readOnlyValue}>{profile.role}</span>
              </div>
              {profile.department && (
                <div className={styles.readOnlyItem}>
                  <span className={styles.readOnlyLabel}>Department:</span>
                  <span className={styles.readOnlyValue}>{profile.department}</span>
                </div>
              )}
              {profile.college && (
                <div className={styles.readOnlyItem}>
                  <span className={styles.readOnlyLabel}>College:</span>
                  <span className={styles.readOnlyValue}>{profile.college}</span>
                </div>
              )}
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => navigate("/faculty/dashboard")}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default React.memo(ProfileEdit);




