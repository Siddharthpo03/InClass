import axios from "axios";

export const BASE_URL = "https://api.inclass.siddharthp.com";
export const API_BASE_URL = `${BASE_URL}/api`;

// Shared axios instance for endpoints mounted under /api
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Reusable axios instance for non-/api mounted routes (e.g. /inclass/admin/*).
export const adminApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default BASE_URL;

