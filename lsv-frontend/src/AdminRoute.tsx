import type { ReactElement } from "react";
import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { Spinner } from "flowbite-react";
import { useAuth } from "./context/AuthContext";

type Props = {
  children: ReactElement;
};

/**
 * UI gate only — every admin API must still enforce authorization server-side.
 * Client role checks can be bypassed by tampering with localStorage.
 */
export function AdminRoute({ children }: Props) {
  const { user, token, isHydrating, refreshUser } = useAuth();
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

  if (user.role === "admin") {
    return children;
  }

  return <Navigate to="/dashboard" />;
}
