import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { Spinner } from "flowbite-react";
import { useAuth } from "./context/AuthContext";

type Props = {
  children: ReactElement;
};

export function PrivateRoute({ children }: Props) {
  const { isAuthenticated, token, user, isHydrating } = useAuth();

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

  // Require a hydrated user so a token-only half-session cannot access the app.
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  return children;
}
