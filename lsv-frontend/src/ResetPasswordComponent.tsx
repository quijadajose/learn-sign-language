import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Label, TextInput } from "flowbite-react";
import { Link } from "react-router-dom";
import { Toast } from "flowbite-react";
import { HiCheck, HiX } from "react-icons/hi";
import { authApi } from "./services/api";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [toastMessages, setToastMessages] = useState<
    { id: number; type: "success" | "error"; message: string }[]
  >([]);
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (!token) {
      addToast("error", "Token inválido o expirado");
      setTimeout(() => {
        navigate("/forgotPassword");
      }, 3000);
    }
  }, [token, navigate]);

  const addToast = (type: "success" | "error", message: string) => {
    const id = Date.now();
    setToastMessages((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToastMessages((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const validatePasswords = () => {
    if (newPassword.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres");
      return false;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden");
      return false;
    }

    setPasswordError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
          message || "Tu contraseña ha sido restablecida correctamente",
        );
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        addToast(
          "error",
          response.message ||
            "Ha ocurrido un error al restablecer tu contraseña",
        );
      }
    } catch (error) {
      addToast("error", "Ha ocurrido un error inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed right-5 top-5 z-50 flex flex-col gap-3">
        {toastMessages.map((toast) => (
          <Toast key={toast.id}>
            <div
              className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${
                toast.type === "success"
                  ? "bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200"
                  : "bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200"
              }`}
            >
              {toast.type === "success" ? (
                <HiCheck className="size-5" />
              ) : (
                <HiX className="size-5" />
              )}
            </div>
            <div className="ml-3 text-sm font-normal">{toast.message}</div>
            <Toast.Toggle
              onDismiss={() =>
                setToastMessages((prev) =>
                  prev.filter((t) => t.id !== toast.id),
                )
              }
            />
          </Toast>
        ))}
      </div>
      <section className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-8 dark:bg-gray-900">
        <Link
          to="/"
          className="mb-6 flex items-center text-2xl font-semibold text-gray-900 dark:text-white"
        >
          <img className="mr-2 size-8" src="public/LogoLogin.png" alt="logo" />
          Lenguaje de señas venezolano
        </Link>
        <div className="w-full rounded-lg bg-white shadow dark:border dark:border-gray-700 dark:bg-gray-800 sm:max-w-md xl:p-0">
          <div className="space-y-4 p-6 sm:p-8 md:space-y-6">
            <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white md:text-2xl">
              Restablecer contraseña
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ingresa tu nueva contraseña para restablecer tu cuenta.
            </p>
            <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
              <div>
                <Label
                  htmlFor="newPassword"
                  className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                >
                  Nueva contraseña
                </Label>
                <TextInput
                  id="newPassword"
                  type="password"
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
                  Confirmar contraseña
                </Label>
                <TextInput
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {passwordError && (
                <p className="text-sm text-red-600 dark:text-red-500">
                  {passwordError}
                </p>
              )}
              <Button
                type="submit"
                className="w-full px-4 py-2 font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Procesando..." : "Restablecer contraseña"}
              </Button>
              <p className="text-center text-sm font-medium text-gray-600 dark:text-gray-400">
                ¿Recordaste tu contraseña?{" "}
                <Link
                  to="/login"
                  className="text-blue-700 hover:underline dark:text-blue-500"
                >
                  Volver al inicio de sesión
                </Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}

export default ResetPassword;
