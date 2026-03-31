import React, { useEffect, useRef } from "react";
import styles from "./Modal.module.css";

/**
 * Modal - Accessible modal dialog component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Callback when modal should close
 * @param {string} props.title - Modal title
 * @param {React.ReactNode} props.children - Modal content
 * @param {string} [props.size='medium'] - Size: 'small', 'medium', 'large', 'full'
 * @param {boolean} [props.closeOnOverlayClick=true] - Close when clicking overlay
 * @param {boolean} [props.showCloseButton=true] - Show close button
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = "medium",
  closeOnOverlayClick = true,
  showCloseButton = true,
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      // Focus the modal when it opens
      setTimeout(() => {
        modalRef.current?.focus();
      }, 0);
    } else {
      // Restore focus when modal closes
      previousActiveElement.current?.focus();
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`${styles.modal} ${styles[size]}`}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h2 id="modal-title" className={styles.title}>
            {title}
          </h2>
          {showCloseButton && (
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close modal"
              type="button"
            >
              <i className="bx bx-x" aria-hidden="true"></i>
            </button>
          )}
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
};

export default React.memo(Modal);



