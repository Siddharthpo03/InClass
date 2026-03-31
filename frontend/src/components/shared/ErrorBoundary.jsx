import React from "react";
import styles from "./ErrorBoundary.module.css";

const DEFAULT_MESSAGE = "Something went wrong. Please refresh the page.";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
    if (typeof window !== "undefined" && window.Sentry) {
      try {
        window.Sentry.captureException(error);
      } catch (_) {
        // ignore Sentry reporting errors
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const message =
        this.props.fallbackMessage ??
        this.state.error?.message ??
        DEFAULT_MESSAGE;
      const showDetails = this.props.showDetails && this.state.errorInfo;

      return (
        <div className={styles.errorBoundary}>
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>
              <i className="bx bx-error-circle" aria-hidden />
            </div>
            <h2 className={styles.errorTitle}>
              {this.props.fallbackTitle ?? "Something went wrong"}
            </h2>
            <p className={styles.errorMessage}>{message}</p>
            {showDetails && (
              <details className={styles.errorDetails}>
                <summary>Error Details</summary>
                <pre className={styles.errorStack}>
                  {this.state.error?.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <div className={styles.errorActions}>
              <button
                className={styles.retryButton}
                onClick={this.handleReset}
                type="button"
              >
                <i className="bx bx-refresh" aria-hidden />
                Try again
              </button>
              <button
                className={styles.reloadButton}
                onClick={this.handleReload}
                type="button"
              >
                <i className="bx bx-revision" aria-hidden />
                Reload page
              </button>
              {this.props.homeUrl && (
                <button
                  className={styles.homeButton}
                  onClick={() => (window.location.href = this.props.homeUrl)}
                  type="button"
                >
                  <i className="bx bx-home" aria-hidden />
                  Go to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


