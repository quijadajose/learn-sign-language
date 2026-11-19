import type { ReactElement } from "react";
import { Navigate } from "react-router-dom";
import { Alert, Button } from "flowbite-react";
import { useTranslation } from "react-i18next";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { useAuth } from "./context/AuthContext";

type Props = {
  children: ReactElement;
};

export function PrivateRoute({ children }: Props) {
  const { isAuthenticated, user, isHydrating, sessionUnavailable } = useAuth();
  const { t } = useTranslation();

  if (isHydrating) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated || !user) {
    // AF-F6-02: si no pudimos verificar la sesión, no es una sesión caducada: se explica y se reintenta.
    if (sessionUnavailable) {
      return (
        <div className="mx-auto w-full max-w-xl p-6">
          <Alert color="failure">
            {t("common:network.serviceUnavailable")}
          </Alert>
          <Button
            className="mt-4"
            color="gray"
            onClick={() => window.location.reload()}
          >
            {t("common:network.retry")}
          </Button>
        </div>
      );
    }
    return <Navigate to="/login" />;
  }

  return children;
}
