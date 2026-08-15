import { useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { UserData } from "../types/user";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  unwrapApiData,
  userApi,
  authApi,
  markSessionActive,
} from "../services/api";
import { AuthContext } from "./AuthContext";
import { clearAllStageSelections } from "../utils/learningStorage";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useLocalStorage<UserData | null>("user", null);
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
    markSessionActive(false);
    setSelectedRegionId(null);
    setSelectedLanguageId(null);
    clearAllStageSelections();
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
        void authApi.logout();
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
      try {
        const response = await userApi.getMe();
        if (cancelled) return;

        if (response.success && response.data) {
          setUser(unwrapApiData<UserData>(response.data));
          markSessionActive(true);
          return;
        }

        if (response.status === 401 || response.status === 403) {
          void authApi.logout();
        }
        clearSession();
      } catch (error) {
        console.error("Error hydrating user session:", error);
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setIsHydrating(false);
      }
    };

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [setUser, clearSession]);

  const login = useCallback(
    (userData: UserData) => {
      setUser(userData);
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
      void authApi.logout();
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
      isAuthenticated,
      isHydrating,
      login,
      logout,
      updateUser,
      refreshUser,
    }),
    [user, isAuthenticated, isHydrating, login, logout, updateUser, refreshUser],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};
