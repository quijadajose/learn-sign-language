import type { ReactElement } from "react";
import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { useAuth } from "./context/AuthContext";

type Props = {
  children: ReactElement;
};

/**
 * UI gate only — every admin API must still enforce authorization server-side.
 * Client role checks can be bypassed by tampering with localStorage.
 */
export function AdminRoute({ children }: Props) {
  const { user, isAuthenticated, isHydrating, refreshUser } = useAuth();
  const refreshed = useRef(false);

  useEffect(() => {
    if (refreshed.current || !isAuthenticated || isHydrating) {
      return;
    }
    refreshed.current = true;
    void refreshUser();
  }, [isAuthenticated, isHydrating, refreshUser]);

  if (isHydrating) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  if (user.role === "admin") {
    return children;
  }

  return <Navigate to="/dashboard" />;
}
