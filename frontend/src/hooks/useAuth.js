/**
 * useAuth - Integration notes for authentication
 *
 * The existing app uses JWT tokens stored in localStorage:
 * - Token: localStorage.getItem("inclass_token")
 * - Role: localStorage.getItem("user_role")
 *
 * The apiClient (utils/apiClient.js) automatically attaches the token
 * to requests via the Authorization header.
 *
 * For faculty components, you can:
 * 1. Use apiClient.get("/auth/profile") to get current user
 * 2. Check localStorage.getItem("user_role") === "faculty"
 * 3. Redirect to /login if token is missing or invalid
 *
 * Example usage in components:
 *
 * ```jsx
 * import { useEffect, useState } from "react";
 * import { useNavigate } from "react-router-dom";
 * import apiClient from "../utils/apiClient";
 *
 * const MyComponent = () => {
 *   const navigate = useNavigate();
 *   const [profile, setProfile] = useState(null);
 *   const [loading, setLoading] = useState(true);
 *
 *   useEffect(() => {
 *     const fetchProfile = async () => {
 *       try {
 *         const response = await apiClient.get("/auth/profile");
 *         if (response.data.role !== "faculty") {
 *           navigate("/login");
 *           return;
 *         }
 *         setProfile(response.data);
 *       } catch (error) {
 *         if (error.response?.status === 401) {
 *           localStorage.removeItem("inclass_token");
 *           localStorage.removeItem("user_role");
 *           navigate("/login");
 *         }
 *       } finally {
 *         setLoading(false);
 *       }
 *     };
 *
 *     fetchProfile();
 *   }, [navigate]);
 *
 *   if (loading) return <LoadingSpinner />;
 *   if (!profile) return <div>Failed to load profile</div>;
 *
 *   return <div>Welcome, {profile.name}</div>;
 * };
 * ```
 *
 * If you want to create a proper AuthContext, you can wrap the app:
 *
 * ```jsx
 * // contexts/AuthContext.jsx
 * import { createContext, useContext, useState, useEffect } from "react";
 * import apiClient from "../utils/apiClient";
 *
 * const AuthContext = createContext(null);
 *
 * export const AuthProvider = ({ children }) => {
 *   const [user, setUser] = useState(null);
 *   const [loading, setLoading] = useState(true);
 *
 *   useEffect(() => {
 *     const token = localStorage.getItem("inclass_token");
 *     if (token) {
 *       apiClient.get("/auth/profile")
 *         .then(res => setUser(res.data))
 *         .catch(() => {
 *           localStorage.removeItem("inclass_token");
 *           localStorage.removeItem("user_role");
 *         })
 *         .finally(() => setLoading(false));
 *     } else {
 *       setLoading(false);
 *     }
 *   }, []);
 *
 *   return (
 *     <AuthContext.Provider value={{ user, loading, setUser }}>
 *       {children}
 *     </AuthContext.Provider>
 *   );
 * };
 *
 * export const useAuth = () => {
 *   const context = useContext(AuthContext);
 *   if (!context) {
 *     throw new Error("useAuth must be used within AuthProvider");
 *   }
 *   return context;
 * };
 * ```
 */

// This file serves as documentation only
// No default export needed



