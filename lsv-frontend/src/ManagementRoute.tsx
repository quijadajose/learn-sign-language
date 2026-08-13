import type { ReactElement } from "react";
import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { Spinner } from "flowbite-react";
import { usePermissions } from "./hooks/usePermissions";
import { useAuth } from "./context/AuthContext";

type Props = {
  children: ReactElement;
};

/**
 * UI gate only — every management/sign-record API must still enforce
 * authorization server-side. Client role/permission checks can be bypassed.
 */
export function ManagementRoute({ children }: Props) {
  const { token, user, isHydrating, refreshUser } = useAuth();
  const { isAdmin, isModerator } = usePermissions();
  const refreshed = useRef(false);

  useEffect(() => {
    if (refreshed.current || !token || token === "undefined" || isHydrating) {
      return;
    }
    refreshed.current = true;
    void refreshUser();
  }, [token, isHydrating, refreshUser]);

  if (!token || token === "undefined") {
    return <Navigate to="/login" />;
  }

  if (isHydrating) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (isAdmin || isModerator) {
    return children;
  }

  return <Navigate to="/dashboard" />;
}
