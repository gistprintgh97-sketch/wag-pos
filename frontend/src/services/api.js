import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json"
  }
});

// Add tenant slug to every request
api.interceptors.request.use((config) => {
  const tenant = localStorage.getItem("wag_tenant");
  if (tenant) {
    const { slug } = JSON.parse(tenant);
    config.headers["x-tenant-slug"] = slug;
  }

  const token = localStorage.getItem("wag_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle 403 subscription errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      const code = error.response.data?.code;
      if (["TRIAL_EXPIRED", "SUBSCRIPTION_EXPIRED", "TENANT_SUSPENDED", "TENANT_CANCELLED"].includes(code)) {
        // Redirect to billing page
        window.location.href = "/billing";
      }
    }
    if (error.response?.status === 401) {
      localStorage.removeItem("wag_token");
      localStorage.removeItem("wag_user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
