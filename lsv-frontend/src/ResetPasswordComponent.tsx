import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Label, TextInput } from "flowbite-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "./services/api";
import { useToast } from "./components/ToastProvider";
import { MAIN_CONTENT_ID } from "./components/SkipLink";

/** Prefer hash (`#token=`) so the reset token is not sent in Referer / query logs. */
function readResetToken(searchParams: URLSearchParams): string | null {
  if (typeof window !== "undefined") {
    const hash = window.location.hash.replace(/^#/, "");
    if (hash) {
      const fromHashParams = new URLSearchParams(hash).get("token");
      if (fromHashParams) return fromHashParams;
      if (hash.startsWith("token=")) {
        return decodeURIComponent(hash.slice("token=".length));
      }
    }
  }
  // Legacy emails that still use ?token=
  return searchParams.get("token");
}

function ResetPassword() {
  const { t } = useTranslation(["auth", "common"]);
  const [searchParams] = useSearchParams();
  const token = readResetToken(searchParams);
  const addToast = useToast();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const navigateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearNavigateTimeout = useCallback(() => {
    if (navigateTimeoutRef.current !== null) {
      clearTimeout(navigateTimeoutRef.current);
      navigateTimeoutRef.current = null;
    }
  }, []);

  const scheduleNavigate = useCallback(
    (path: string, ms: number) => {
      clearNavigateTimeout();
      navigateTimeoutRef.current = setTimeout(() => {
        navigateTimeoutRef.current = null;
        navigate(path);
      }, ms);
    },
    [clearNavigateTimeout, navigate],
  );

  useEffect(() => {
    return () => clearNavigateTimeout();
  }, [clearNavigateTimeout]);

  useEffect(() => {
    if (!token) {
      addToast("error", t("resetPassword.invalidToken"));
      const timeoutId = setTimeout(() => navigate("/forgotPassword"), 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [token, addToast, navigate, t]);

  const validatePasswords = () => {
    if (newPassword.length < 8) {
      setPasswordError(t("resetPassword.minLength"));
      return false;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t("resetPassword.mismatch"));
      return false;
    }

    setPasswordError("");
    return true;
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validatePasswords()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authApi.confirmPasswordReset(newPassword, token!);

      if (response.success) {
        const message = response.message;
        addToast(
          "success",
          message || t("resetPassword.success"),
        );
        scheduleNavigate("/login", 3000);
      } else {
        addToast(
          "error",
          response.message || t("resetPassword.error"),
        );
      }
    } catch {
      addToast("error", t("common:api.unexpected"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      id={MAIN_CONTENT_ID}
      className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-8 dark:bg-gray-900"
    >
      <Link
        to="/"
        className="mb-6 flex items-center text-2xl font-semibold text-gray-900 dark:text-white"
      >
        <img
          className="mr-2 size-8 dark:invert"
          src="/logo.svg"
          alt=""
        />
        {t("common:appName")}
      </Link>
      <div className="w-full rounded-lg bg-white shadow dark:border dark:border-gray-700 dark:bg-gray-800 sm:max-w-md xl:p-0">
        <div className="space-y-4 p-6 sm:p-8 md:space-y-6">
          <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white md:text-2xl">
            {t("resetPassword.title")}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("resetPassword.description")}
          </p>
          <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
            <div>
              <Label
                htmlFor="newPassword"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                {t("resetPassword.newPassword")}
              </Label>
              <TextInput
                id="newPassword"
                type="password"
                name="newPassword"
                autoComplete="new-password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <Label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                {t("resetPassword.confirmPassword")}
              </Label>
              <TextInput
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {passwordError && (
              <p role="alert" className="text-sm text-red-600 dark:text-red-500">
                {passwordError}
              </p>
            )}
            <Button
              type="submit"
              color="blue"
              className="w-full bg-blue-700 px-4 py-2 font-semibold hover:bg-blue-800"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t("resetPassword.submitting")
                : t("resetPassword.submit")}
            </Button>
            <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
              {t("resetPassword.remembered")}{" "}
              <Link
                to="/login"
                className="text-blue-700 hover:underline dark:text-blue-500"
              >
                {t("resetPassword.backToLogin")}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}

export default ResetPassword;
