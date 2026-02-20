import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "https://taskpulse-backend-jaye.onrender.com/api",
  withCredentials: true, // important if backend uses cookie auth
  headers: { "Content-Type": "application/json" },
  timeout: 15000, // 15 second timeout to prevent hanging
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosInstance;