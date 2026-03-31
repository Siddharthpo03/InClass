import React from "react";

/**
 * Performance utility functions for debouncing, throttling, and memoization
 */

/**
 * Debounce function - delays execution until after wait time has passed
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @param {boolean} immediate - Execute immediately on first call
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

/**
 * Throttle function - limits execution to once per wait time
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Memoize function results based on arguments
 * @param {Function} fn - Function to memoize
 * @param {Function} [keyFn] - Optional key generator function
 * @returns {Function} Memoized function
 */
export const memoize = (fn, keyFn) => {
  const cache = new Map();
  return function memoizedFunction(...args) {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

/**
 * Create a shallow equality check for React dependencies
 * @param {Array} prevDeps - Previous dependencies
 * @param {Array} nextDeps - Next dependencies
 * @returns {boolean} True if dependencies are equal
 */
export const areDepsEqual = (prevDeps, nextDeps) => {
  if (prevDeps.length !== nextDeps.length) return false;
  return prevDeps.every((dep, i) => dep === nextDeps[i]);
};

/**
 * Batch multiple state updates to reduce re-renders
 * @param {Function} callback - Callback with batched updates
 * @returns {Promise} Promise that resolves after updates
 */
export const batchUpdates = (callback) => {
  return new Promise((resolve) => {
    // Use React's automatic batching (React 18+)
    callback();
    // Use requestAnimationFrame for next frame
    requestAnimationFrame(() => {
      resolve();
    });
  });
};

/**
 * Lazy load a component with error boundary
 * @param {Function} importFn - Dynamic import function
 * @returns {Promise} Promise resolving to component
 */
export const lazyLoad = (importFn) => {
  return importFn().catch((error) => {
    console.error("Failed to load component:", error);
    // Return a fallback component
    return {
      default: () =>
        React.createElement(
          "div",
          null,
          React.createElement(
            "p",
            null,
            "Failed to load component. Please refresh the page."
          )
        ),
    };
  });
};

/**
 * Request idle callback with fallback
 * @param {Function} callback - Callback to execute
 * @param {Object} options - Options for requestIdleCallback
 */
export const requestIdle = (callback, options = {}) => {
  if (typeof window.requestIdleCallback === "function") {
    return window.requestIdleCallback(callback, options);
  }
  // Fallback to setTimeout
  return setTimeout(callback, 1);
};

/**
 * Cancel idle callback
 * @param {number} id - Idle callback ID
 */
export const cancelIdle = (id) => {
  if (typeof window.cancelIdleCallback === "function") {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};



