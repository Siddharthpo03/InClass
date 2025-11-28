import React, { useRef, useState } from "react";
import styles from "./PhotoUpload.module.css";

const PhotoUpload = ({ onPhotoChange, error, label = "Passport Photo" }) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      onPhotoChange(file);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    onPhotoChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={styles.photoUploadWrapper}>
      <label className={styles.label}>
        <i className="bx bx-camera"></i>
        {label}
      </label>
      <div
        className={`${styles.uploadArea} ${isDragging ? styles.dragging : ""} ${error ? styles.error : ""} ${preview ? styles.hasPreview : ""}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className={styles.fileInput}
        />
        {preview ? (
          <div className={styles.previewContainer}>
            <img src={preview} alt="Preview" className={styles.previewImage} />
            <button
              type="button"
              className={styles.removeButton}
              onClick={handleRemove}
              aria-label="Remove photo"
            >
              <i className="bx bx-x"></i>
            </button>
          </div>
        ) : (
          <div className={styles.uploadPlaceholder}>
            <i className="bx bx-cloud-upload"></i>
            <p className={styles.uploadText}>
              <span className={styles.uploadTextBold}>Click to upload</span> or drag and drop
            </p>
            <p className={styles.uploadHint}>Passport-sized photo (JPG, PNG, max 5MB)</p>
          </div>
        )}
      </div>
      {error && (
        <span className={styles.errorText}>
          <i className="bx bx-error-circle"></i>
          {error}
        </span>
      )}
    </div>
  );
};

export default PhotoUpload;

