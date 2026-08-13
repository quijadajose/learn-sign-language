import { useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { UserData } from "../types/user";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { unwrapApiData, userApi } from "../services/api";
import { AuthContext } from "./AuthContext";

const HYDRATE_MAX_ATTEMPTS = 3;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useLocalStorage<UserData | null>("user", null);
  const [token, setToken] = useLocalStorage<string | null>("auth", null);
  const [, setSelectedRegionId] = useLocalStorage<string | null>(
    "selectedRegionId",
    null,
  );
  const [, setSelectedLanguageId] = useLocalStorage<string | null>(
    "selectedLanguageId",
    null,
  );
  const [isHydrating, setIsHydrating] = useState<boolean>(
    () => !!token && token !== "undefined" && !user,
  );

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    setSelectedRegionId(null);
    setSelectedLanguageId(null);
  }, [setUser, setToken, setSelectedRegionId, setSelectedLanguageId]);

  // Require both token and user so a failed hydrate cannot leave a half-session
  // that PrivateRoute would treat as authenticated.
  const isAuthenticated = !!token && token !== "undefined" && !!user;

  const refreshUser = useCallback(async (): Promise<UserData | null> => {
    if (!token || token === "undefined") return null;
    try {
      const response = await userApi.getMe();
      if (response.success && response.data) {
        const next = unwrapApiData<UserData>(response.data);
        setUser(next);
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
  }, [token, setUser, clearSession]);

  useEffect(() => {
    if (!token || token === "undefined") {
      setIsHydrating(false);
      return;
    }

    if (user) {
      setIsHydrating(false);
      return;
    }

    let cancelled = false;
    setIsHydrating(true);

    const hydrate = async () => {
      let lastError: unknown;
      for (let attempt = 1; attempt <= HYDRATE_MAX_ATTEMPTS; attempt++) {
        if (cancelled) return;
        try {
          const response = await userApi.getMe();
          if (cancelled) return;

          if (response.success && response.data) {
            setUser(unwrapApiData<UserData>(response.data));
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
      // Cannot verify session without a user profile — clear to avoid auth loops.
      clearSession();
      setIsHydrating(false);
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [token, user, setUser, clearSession]);

  const login = useCallback(
    (userData: UserData, userToken: string) => {
      setUser(userData);
      setToken(userToken);
      setIsHydrating(false);
    },
    [setUser, setToken],
  );

  const logout = useCallback(() => {
    clearSession();
    setIsHydrating(false);
  }, [clearSession]);

  useEffect(() => {
    const onSessionExpired = () => {
      logout();
    };
    window.addEventListener("session-expired", onSessionExpired);
    return () => {
      window.removeEventListener("session-expired", onSessionExpired);
    };
  }, [logout]);

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
