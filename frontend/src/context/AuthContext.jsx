import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import apiClient, {
  AUTH_SESSION_EXPIRED_EVENT,
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  setAuthTokens,
} from "../api/axios";

const AuthContext = createContext(null);

function extractSuccessData(response) {
  return response?.data?.data ?? response?.data ?? null;
}

function normalizeUsername(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "")
    .replace(/^\.+|\.+$/g, "") || "user";
}

function buildRegisterPayload(values) {
  const trimmedName = (values.name ?? "").trim();
  const nameParts = trimmedName.split(/\s+/).filter(Boolean);
  const firstName = (values.first_name ?? nameParts[0] ?? "").trim();
  const lastName = (values.last_name ?? nameParts.slice(1).join(" ")).trim();
  const usernameSource = values.username ?? trimmedName ?? values.email ?? "user";

  return {
    username: normalizeUsername(usernameSource),
    email: (values.email ?? "").trim(),
    password: values.password ?? "",
    first_name: firstName,
    last_name: lastName,
  };
}

function storeAuthState(payload, setCurrentUser) {
  setAuthTokens({
    accessToken: payload?.access ?? "",
    refreshToken: payload?.refresh ?? "",
  });
  setCurrentUser(payload?.user ?? null);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    clearAuthTokens();
    setCurrentUser(null);
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    const response = await apiClient.get("/api/auth/me/");
    const user = extractSuccessData(response);
    setCurrentUser(user);
    return user;
  }, []);

  const login = useCallback(async ({ login, password }) => {
    const response = await apiClient.post("/api/auth/login/", {
      login,
      password,
    });
    const payload = extractSuccessData(response);
    storeAuthState(payload, setCurrentUser);
    return payload?.user ?? null;
  }, []);

  const register = useCallback(async (values) => {
    const payload = buildRegisterPayload(values);
    const response = await apiClient.post("/api/auth/register/", payload);
    const authData = extractSuccessData(response);
    storeAuthState(authData, setCurrentUser);
    return authData?.user ?? null;
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      if (!getAccessToken() && !getRefreshToken()) {
        if (active) {
          setLoading(false);
        }
        return;
      }

      try {
        await fetchCurrentUser();
      } catch {
        clearSession();
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, [clearSession, fetchCurrentUser]);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearSession();
    };

    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    return () => {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [clearSession]);

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated: Boolean(currentUser),
      loading,
      login,
      register,
      logout,
      fetchCurrentUser,
    }),
    [currentUser, fetchCurrentUser, loading, login, logout, register],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
