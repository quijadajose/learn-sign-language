import type { ReactElement } from "react";
import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { usePermissions } from "./hooks/usePermissions";
import { useAuth } from "./context/AuthContext";
import { LoadingSpinner } from "./components/LoadingSpinner";

type Props = {
  children: ReactElement;
};

/**
 * UI gate only — every management/sign-record API must still enforce
 * authorization server-side. Client role/permission checks can be bypassed.
 */
export function ManagementRoute({ children }: Props) {
  const { isAuthenticated, user, isHydrating, refreshUser } = useAuth();
  const { isAdmin, isModerator } = usePermissions();
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

  if (isAdmin || isModerator) {
    return children;
  }

  return <Navigate to="/dashboard" />;
}
