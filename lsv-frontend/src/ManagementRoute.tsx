import { Navigate } from "react-router-dom";
import { usePermissions } from "./hooks/usePermissions";
import { useAuth } from "./context/AuthContext";

type Props = {
  children: JSX.Element;
};

export function ManagementRoute({ children }: Props) {
  const { token } = useAuth();
  const { isAdmin, isModerator } = usePermissions();

  if (!token || token === "undefined") {
    return <Navigate to="/login" />;
  }

  // Permitir acceso si es admin O si es moderador (tiene al menos un permiso)
  if (isAdmin || isModerator) {
    return children;
  } else {
    return <Navigate to="/dashboard" />;
  }
}
