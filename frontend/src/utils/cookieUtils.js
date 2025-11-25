/**
 * Cookie Utility Functions
 * Helper functions to manage cookie consent and preferences
 */

/**
 * Get the current cookie consent status
 * @returns {string|null} 'essential', 'all', 'rejected', or null if not set
 */
export const getCookieConsent = () => {
  return localStorage.getItem("cookieConsent");
};

/**
 * Check if user has given consent
 * @returns {boolean} True if consent has been given
 */
export const hasCookieConsent = () => {
  return getCookieConsent() !== null;
};

/**
 * Check if essential cookies are allowed (always true, as they're necessary)
 * @returns {boolean} Always true
 */
export const areEssentialCookiesAllowed = () => {
  return true; // Essential cookies are always allowed
};

/**
 * Check if analytics/tracking cookies are allowed
 * @returns {boolean} True if user accepted all cookies
 */
export const areAnalyticsCookiesAllowed = () => {
  const consent = getCookieConsent();
  return consent === "all";
};

/**
 * Set cookie consent
 * @param {string} consentType - 'essential', 'all', or 'rejected'
 */
export const setCookieConsent = (consentType) => {
  localStorage.setItem("cookieConsent", consentType);
  localStorage.setItem("cookieConsentDate", new Date().toISOString());
};

/**
 * Clear cookie consent (for testing or reset)
 */
export const clearCookieConsent = () => {
  localStorage.removeItem("cookieConsent");
  localStorage.removeItem("cookieConsentDate");
};

/**
 * Get consent date
 * @returns {string|null} ISO date string or null
 */
export const getConsentDate = () => {
  return localStorage.getItem("cookieConsentDate");
};

/**
 * Set an essential cookie
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} maxAge - Max age in seconds (default: 3600 = 1 hour)
 */
export const setEssentialCookie = (name, value, maxAge = 3600) => {
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Strict`;
};

/**
 * Get a cookie value
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null
 */
export const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

/**
 * Delete a cookie
 * @param {string} name - Cookie name
 */
export const deleteCookie = (name) => {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

