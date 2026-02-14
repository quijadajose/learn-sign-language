import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

type Props = {
  children: JSX.Element;
};

export function AdminRoute({ children }: Props) {
  const { user, token, logout } = useAuth();

  if (!token || token === "undefined") {
    return <Navigate to="/login" />;
  }

  if (user && user.role === "admin") {
    return children;
  } else if (user) {
    return <Navigate to="/dashboard" />;
  } else {
    logout();
    return <Navigate to="/login" />;
  }
}
