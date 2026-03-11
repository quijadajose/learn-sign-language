import { useState, useCallback } from "react";
import { Formity, OnReturn } from "@formity/react";
import { schema, Values } from "./schema";
import { Toast, ToastToggle } from "flowbite-react";
import { HiCheck, HiX } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { login } = useAuth();
  const [toastMessages, setToastMessages] = useState<
    { id: number; type: "success" | "error"; message: string }[]
  >([]);
  const navigate = useNavigate();

  const addToast = (type: "success" | "error", message: string) => {
    const id = Date.now();
    setToastMessages((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToastMessages((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const onReturn = useCallback<OnReturn<Values>>(async (values) => {
    try {
      const response = await authApi.register(values);

      if (response.success && response.data) {
        const { user, token } = response.data;
        login(user, token);
        addToast("success", "Registro exitoso");
        navigate("/dashboard");
      } else {
        addToast("error", response.message || "Error al registrar");
      }
    } catch (error) {
      addToast("error", "Error al conectar con el servidor");
    }
  }, [login, navigate]);

  return (
    <>
      <div className="fixed right-5 top-5 z-50 flex flex-col gap-3">
        {toastMessages.map((toast) => (
          <Toast key={toast.id}>
            <div
              className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${toast.type === "success"
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
            <ToastToggle
              onDismiss={() =>
                setToastMessages((prev) =>
                  prev.filter((t) => t.id !== toast.id),
                )
              }
            />
          </Toast>
        ))}
      </div>

      <Formity<Values> schema={schema} onReturn={onReturn} />
    </>
  );
}
