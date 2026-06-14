import axios from "axios";

export const AUTH_SESSION_EXPIRED_EVENT = "splitwise-auth-session-expired";

const storageKeys = {
  access: "access_token",
  refresh: "refresh_token",
};

const baseURL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/+$/, "");

function getStoredItem(key) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(key);
}

function setStoredItem(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  if (value) {
    window.localStorage.setItem(key, value);
    return;
  }

  window.localStorage.removeItem(key);
}

export function getAccessToken() {
  return getStoredItem(storageKeys.access);
}

export function getRefreshToken() {
  return getStoredItem(storageKeys.refresh);
}

export function setAuthTokens({ accessToken, refreshToken }) {
  setStoredItem(storageKeys.access, accessToken || "");
  setStoredItem(storageKeys.refresh, refreshToken || "");
}

export function clearAuthTokens() {
  setStoredItem(storageKeys.access, "");
  setStoredItem(storageKeys.refresh, "");
}

function notifySessionExpired() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
}

function isAuthEndpoint(url = "") {
  return ["/api/auth/login/", "/api/auth/register/", "/api/auth/refresh/", "/api/auth/me/"]
    .some((endpoint) => url.includes(endpoint));
}

const apiClient = axios.create({
  baseURL,
});

const refreshClient = axios.create({
  baseURL,
});

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();

  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthEndpoint(originalRequest.url ?? "")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuthTokens();
      notifySessionExpired();
      return Promise.reject(error);
    }

    try {
      const refreshResponse = await refreshClient.post("/api/auth/refresh/", {
        refresh: refreshToken,
      });
      const nextAccessToken = refreshResponse.data?.access;

      if (!nextAccessToken) {
        throw new Error("Refresh response did not include an access token.");
      }

      setStoredItem(storageKeys.access, nextAccessToken);
      originalRequest.headers = originalRequest.headers ?? {};
      originalRequest.headers.Authorization = `Bearer ${nextAccessToken}`;

      return apiClient(originalRequest);
    } catch (refreshError) {
      clearAuthTokens();
      notifySessionExpired();
      return Promise.reject(refreshError);
    }
  },
);

export default apiClient;
