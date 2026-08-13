/* eslint-disable react-refresh/only-export-components -- context module exports hook alongside provider */
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { Toast, ToastToggle } from "flowbite-react";
import { HiCheck, HiX, HiInformationCircle } from "react-icons/hi";

type ToastMessage = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};
type ToastContextType = {
  addToast: (type: ToastMessage["type"], message: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timeoutId = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timeoutId);
  }, [toast.id, onDismiss]);

  return (
    <Toast>
      <div
        className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${
          toast.type === "success"
            ? "bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200"
            : toast.type === "error"
              ? "bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200"
              : "bg-blue-100 text-blue-500 dark:bg-blue-800 dark:text-blue-200"
        }`}
      >
        {toast.type === "success" ? (
          <HiCheck className="size-5" />
        ) : toast.type === "info" ? (
          <HiInformationCircle className="size-5" />
        ) : (
          <HiX className="size-5" />
        )}
      </div>
      <div className="ml-3 text-sm font-normal">{toast.message}</div>
      <ToastToggle onDismiss={() => onDismiss(toast.id)} />
    </Toast>
  );
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastMessage["type"], message: string) => {
      const id = Date.now() + Math.random() * 1000;
      setToasts((prev) => [...prev, { id, type, message }]);
    },
    [],
  );

  useEffect(() => {
    const handleCustomToast = (event: CustomEvent) => {
      const { type, message } = event.detail;
      addToast(type, message);
    };

    window.addEventListener("show-toast", handleCustomToast as EventListener);

    return () => {
      window.removeEventListener(
        "show-toast",
        handleCustomToast as EventListener,
      );
    };
  }, [addToast]);

  const contextValue = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed right-5 top-5 z-9999 flex flex-col gap-3">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType["addToast"] => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context.addToast;
};
