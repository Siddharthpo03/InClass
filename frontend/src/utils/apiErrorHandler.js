/**
 * API Error Handler Utility
 * 
 * Provides consistent error handling for API calls across the frontend.
 * Suppresses noisy 404 errors while preserving important error information.
 */

/**
 * Handle API errors gracefully
 * @param {Error} error - Axios error object
 * @param {Object} options - Handling options
 * @param {boolean} options.suppress404 - Suppress 404 errors (default: true)
 * @param {boolean} options.suppressLogging - Suppress console logging (default: false)
 * @param {string} options.endpointName - Name of endpoint for logging
 * @returns {Object} - Error information object
 */
export const handleApiError = (error, options = {}) => {
  const {
    suppress404 = true,
    suppressLogging = false,
    endpointName = "API endpoint",
  } = options;

  const status = error.response?.status;
  const errorMessage =
    error.response?.data?.message ||
    error.response?.data?.error?.message ||
    error.message ||
    "An error occurred";

  // Handle 404 errors
  if (status === 404 && suppress404) {
    if (!suppressLogging) {
      console.warn(`${endpointName} not found (404)`);
    }
    return {
      status: 404,
      message: `${endpointName} temporarily unavailable`,
      is404: true,
      isNetworkError: false,
    };
  }

  // Handle network errors
  if (error.request && !error.response) {
    if (!suppressLogging) {
      console.error(`Network error calling ${endpointName}:`, error.message);
    }
    return {
      status: 0,
      message: "Network error. Please check your connection.",
      is404: false,
      isNetworkError: true,
    };
  }

  // Handle other errors
  if (!suppressLogging && status !== 404) {
    console.error(`Error calling ${endpointName}:`, {
      status,
      message: errorMessage,
      url: error.config?.url,
    });
  }

  return {
    status: status || 0,
    message: errorMessage,
    is404: status === 404,
    isNetworkError: false,
    originalError: error,
  };
};

/**
 * Create a safe API call wrapper that handles errors gracefully
 * @param {Function} apiCall - Async function that returns a promise
 * @param {Object} options - Error handling options
 * @returns {Promise} - Promise that resolves with data or rejects with handled error
 */
export const safeApiCall = async (apiCall, options = {}) => {
  try {
    const response = await apiCall();
    return { success: true, data: response.data, response };
  } catch (error) {
    const errorInfo = handleApiError(error, options);
    
    // For 404s, return success with empty data instead of throwing
    if (errorInfo.is404 && options.suppress404 !== false) {
      return { success: false, data: null, error: errorInfo, is404: true };
    }
    
    // Re-throw for other errors
    throw { ...error, handled: true, errorInfo };
  }
};

/**
 * Check if an error is a 404
 */
export const is404Error = (error) => {
  return error.response?.status === 404 || error.errorInfo?.is404;
};

/**
 * Check if an error is a network error
 */
export const isNetworkError = (error) => {
  return (
    (error.request && !error.response) || error.errorInfo?.isNetworkError
  );
};

