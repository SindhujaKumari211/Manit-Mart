import axios from "axios";
import { getSelectedCollege } from "../lib/college";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// The server root (no "/api" suffix) — needed to resolve relative upload URLs like "/uploads/products/x.jpg"
export const API_ORIGIN = baseURL.replace(/\/api\/?$/, "");

const API = axios.create({ baseURL });

export { COLLEGE_STORAGE_KEY, DEFAULT_COLLEGE, getSelectedCollege } from "../lib/college";

// 🔥 Attach token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  // Read at request time so a college switch is immediately reflected by every
  // API consumer, including contexts and lazily-loaded pages.
  config.headers["X-College"] = getSelectedCollege();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Session expired / invalid token — clear local auth state and send the user back to login
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default API;
