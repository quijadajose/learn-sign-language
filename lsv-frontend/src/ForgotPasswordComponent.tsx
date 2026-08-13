import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Label, TextInput } from "flowbite-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { authApi } from "./services/api";
import { useToast } from "./components/ToastProvider";

function ForgoPassword() {
  const { t } = useTranslation(["auth", "common"]);
  const addToast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await authApi.resetPassword(email);

      if (response.success) {
        addToast(
          "success",
          response.message || t("forgotPassword.success"),
        );
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        addToast(
          "error",
          response.message || t("common:api.requestFailed"),
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
            {t("forgotPassword.title")}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("forgotPassword.description")}
          </p>
          <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
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
              />
            </div>
            <Button
              type="submit"
              color="blue"
              className="w-full bg-blue-700 px-4 py-2 font-semibold hover:bg-blue-800"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? t("forgotPassword.submitting")
                : t("forgotPassword.submit")}
            </Button>
            <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
              <Link
                to="/login"
                className="text-blue-700 hover:underline dark:text-blue-500"
              >
                {t("forgotPassword.backToLogin")}
              </Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

export default ForgoPassword;
