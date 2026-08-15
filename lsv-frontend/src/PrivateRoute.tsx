import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { useAuth } from "./context/AuthContext";

type Props = {
  children: ReactElement;
};

export function PrivateRoute({ children }: Props) {
  const { isAuthenticated, user, isHydrating } = useAuth();

  if (isHydrating) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  return children;
}
