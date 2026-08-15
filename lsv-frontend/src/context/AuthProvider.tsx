import { useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { UserData } from "../types/user";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  unwrapApiData,
  userApi,
  authApi,
  setMemoryAccessToken,
  markSessionActive,
} from "../services/api";
import { AuthContext } from "./AuthContext";

const HYDRATE_MAX_ATTEMPTS = 3;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useLocalStorage<UserData | null>("user", null);
  const [token, setToken] = useState<string | null>(null);
  const [, setSelectedRegionId] = useLocalStorage<string | null>(
    "selectedRegionId",
    null,
  );
  const [, setSelectedLanguageId] = useLocalStorage<string | null>(
    "selectedLanguageId",
    null,
  );
  const [isHydrating, setIsHydrating] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    setMemoryAccessToken(null);
    markSessionActive(false);
    setSelectedRegionId(null);
    setSelectedLanguageId(null);
    try {
      localStorage.removeItem("auth");
    } catch {
      /* ignore */
    }
  }, [setUser, setSelectedRegionId, setSelectedLanguageId]);

  const isAuthenticated = !!user;

  const refreshUser = useCallback(async (): Promise<UserData | null> => {
    try {
      const response = await userApi.getMe();
      if (response.success && response.data) {
        const next = unwrapApiData<UserData>(response.data);
        setUser(next);
        markSessionActive(true);
        return next;
      }
      if (response.status === 401 || response.status === 403) {
        clearSession();
      }
      return null;
    } catch (error) {
      console.error("Error refreshing user session:", error);
      return null;
    }
  }, [setUser, clearSession]);

  useEffect(() => {
    let cancelled = false;
    setIsHydrating(true);
    try {
      localStorage.removeItem("auth");
    } catch {
      /* ignore */
    }

    const hydrate = async () => {
      let lastError: unknown;
      for (let attempt = 1; attempt <= HYDRATE_MAX_ATTEMPTS; attempt++) {
        if (cancelled) return;
        try {
          const response = await userApi.getMe();
          if (cancelled) return;

          if (response.success && response.data) {
            setUser(unwrapApiData<UserData>(response.data));
            markSessionActive(true);
            setIsHydrating(false);
            return;
          }

          if (response.status === 401 || response.status === 403) {
            clearSession();
            setIsHydrating(false);
            return;
          }

          lastError = response.message || "hydrate failed";
        } catch (error) {
          lastError = error;
        }

        if (attempt < HYDRATE_MAX_ATTEMPTS) {
          await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
        }
      }

      if (cancelled) return;
      console.error("Error hydrating user session after retries:", lastError);
      clearSession();
      setIsHydrating(false);
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [setUser, clearSession]);

  const login = useCallback(
    (userData: UserData, userToken?: string) => {
      setUser(userData);
      if (userToken) {
        setToken(userToken);
        setMemoryAccessToken(userToken);
      }
      markSessionActive(true);
      setIsHydrating(false);
    },
    [setUser],
  );

  const logout = useCallback(() => {
    void authApi.logout();
    clearSession();
    setIsHydrating(false);
  }, [clearSession]);

  useEffect(() => {
    const onSessionExpired = () => {
      clearSession();
      setIsHydrating(false);
    };
    window.addEventListener("session-expired", onSessionExpired);
    return () => {
      window.removeEventListener("session-expired", onSessionExpired);
    };
  }, [clearSession]);

  const updateUser = useCallback(
    (userData: UserData) => {
      setUser(userData);
    },
    [setUser],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated,
      isHydrating,
      login,
      logout,
      updateUser,
      refreshUser,
    }),
    [
      user,
      token,
      isAuthenticated,
      isHydrating,
      login,
      logout,
      updateUser,
      refreshUser,
    ],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};
