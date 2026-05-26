import axios from "axios";

const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://api.fitme.ioa.copupbid.com/api";

export const API_BASE = rawBaseUrl.replace(/\/+$/g, "");

export const APP_BASE = API_BASE.replace(/\/api$/i, "");

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: "application/json",
  },
});

let adminPendingRequests = 0;

function isAdminRequest(config = {}) {
  const url = String(config.url || "");
  return /^\/?admin(?:\/|$)/.test(url);
}

function emitAdminLoading() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("fitme:admin-loading", {
      detail: {
        loading: adminPendingRequests > 0,
        pending: adminPendingRequests,
      },
    })
  );
}

function beginAdminRequest(config) {
  if (!isAdminRequest(config)) return;

  config.fitmeAdminTracked = true;
  adminPendingRequests += 1;
  emitAdminLoading();
}

function finishAdminRequest(config) {
  if (!config?.fitmeAdminTracked) return;

  adminPendingRequests = Math.max(0, adminPendingRequests - 1);
  emitAdminLoading();
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("fitme_token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  beginAdminRequest(config);

  return config;
});

api.interceptors.response.use(
  (response) => {
    finishAdminRequest(response.config);
    return response;
  },
  (error) => {
    finishAdminRequest(error?.config);
    return Promise.reject(error);
  }
);

export function getApiError(error, fallback = "Something went wrong") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

export function imageUrl(path) {
  if (!path) return "";
  const value = String(path).trim();

  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${APP_BASE}${value}`;

  return `${APP_BASE}/${value}`;
}
