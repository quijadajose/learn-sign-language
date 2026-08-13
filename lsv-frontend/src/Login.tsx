import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Checkbox, Label, TextInput } from "flowbite-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi, unwrapApiData, userApi } from "./services/api";
import type { UserData } from "./types/user";
import { BACKEND_BASE_URL } from "./config";
import { useAuth } from "./context/AuthContext";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useToast } from "./components/ToastProvider";

function handleGoogleLogin() {
  window.location.href = `${BACKEND_BASE_URL}/auth/google`;
}

function Login() {
  const { t } = useTranslation(["auth", "common"]);
  const { login, isAuthenticated } = useAuth();
  const addToast = useToast();
  const [searchParams] = useSearchParams();
  const oauthCode = searchParams.get("code");
  const [rememberedEmail, setRememberedEmail] = useLocalStorage<string | null>(
    "rememberedEmail",
    null,
  );
  const oauthHandled = useRef(false);
  const navigate = useNavigate();

  const [email, setEmail] = useState(rememberedEmail || "");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(!!rememberedEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleGoogleCode = async () => {
      if (!oauthCode || oauthHandled.current) return;
      oauthHandled.current = true;
      try {
        const exchange = await authApi.exchangeGoogleCode(oauthCode);
        const token = unwrapApiData<{ token: string }>(exchange.data)?.token;
        if (!exchange.success || !token) {
          addToast("error", t("login.googleError"));
          navigate("/login", { replace: true });
          return;
        }
        localStorage.setItem("auth", token);
        const response = await userApi.getMe();
        if (response.success && response.data) {
          const userData = unwrapApiData<UserData>(response.data);
          login(userData, token);
          addToast("success", t("login.googleSuccess"));
          navigate("/dashboard", { replace: true });
        } else {
          localStorage.removeItem("auth");
          addToast("error", t("login.googleProfileError"));
          navigate("/login", { replace: true });
        }
      } catch {
        localStorage.removeItem("auth");
        addToast("error", t("login.googleConnectionError"));
        navigate("/login", { replace: true });
      }
    };

    // Already signed in (e.g. visiting /login): redirect only — toast comes from handleLogin/OAuth.
    if (isAuthenticated) {
      navigate("/dashboard");
    } else if (oauthCode) {
      void handleGoogleCode();
    }
  }, [navigate, oauthCode, isAuthenticated, login, addToast, t]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await authApi.login(email, password);
      const payload = unwrapApiData<{ user: UserData; token: string }>(
        response.data,
      );
      if (response.success && payload?.user && payload?.token) {
        login(payload.user, payload.token);

        if (rememberMe) {
          setRememberedEmail(email);
        } else {
          setRememberedEmail(null);
        }

        addToast("success", t("login.success"));
        navigate("/dashboard");
      } else {
        addToast(
          "error",
          response.message || t("login.invalidCredentials"),
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-8 dark:bg-gray-900">
      <Link
        to="/"
        className="mb-6 flex items-center text-2xl font-semibold text-gray-900 dark:text-white"
      >
        <img
          className="mr-2 size-8 dark:invert"
          src="/logo.svg"
          alt={t("common:logoAlt")}
        />
        {t("common:appName")}
      </Link>
      <div className="w-full rounded-lg bg-white shadow dark:border dark:border-gray-700 dark:bg-gray-800 sm:max-w-md xl:p-0">
        <div className="space-y-4 p-6 sm:p-8 md:space-y-6">
          <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white md:text-2xl">
            {t("login.title")}
          </h1>
          <form className="space-y-4 md:space-y-6" onSubmit={handleLogin}>
            <div>
              <Label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                {t("login.email")}
              </Label>
              <TextInput
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div>
              <Label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
              >
                {t("login.password")}
              </Label>
              <TextInput
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <Label
                  htmlFor="remember"
                  className="ml-3 text-sm text-gray-500 dark:text-gray-300"
                >
                  {t("login.rememberMe")}
                </Label>
              </div>
              <Link
                to="/forgotPassword"
                className="font-medium text-blue-700 no-underline hover:underline dark:text-blue-500"
              >
                {t("login.forgotPassword")}
              </Link>
            </div>
            <p className="font-medium text-gray-600 dark:text-gray-400">
              {t("login.noAccount")}{" "}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {t("login.register")}
              </Link>
            </p>
            <Button
              type="submit"
              color="blue"
              className="w-full bg-blue-700 px-4 py-2 font-semibold hover:bg-blue-800"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("login.submitting") : t("login.submit")}
            </Button>
            <Button
              color={"red"}
              type="button"
              className="flex w-full max-w-md items-center justify-center rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
            >
              <svg
                width="20"
                height="20"
                fill="currentColor"
                className="mr-2"
                viewBox="0 0 1792 1792"
              >
                <path d="M896 786h725q12 67 12 128 0 217-91 387.5t-259.5 266.5-386.5 96q-157 0-299-60.5t-245-163.5-163.5-245-60.5-299 60.5-299 163.5-245 245-163.5 299-60.5q300 0 515 201l-209 201q-123-119-306-119-129 0-238.5 65t-173.5 176.5-64 243.5 64 243.5 173.5 176.5 238.5 65q87 0 160-24t120-60 82-82 51.5-87 22.5-78h-436v-264z"></path>
              </svg>
              {t("login.withGoogle")}
            </Button>
          </form>
          <div className="mt-4 flex justify-center gap-4 border-t pt-4 text-xs text-gray-400 dark:border-gray-700">
            <Link to="/privacy-policy" className="hover:underline">
              {t("legal.privacy")}
            </Link>
            <Link to="/terms-of-service" className="hover:underline">
              {t("legal.terms")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Login;
