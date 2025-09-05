import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { Toast } from "flowbite-react";
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

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (type: ToastMessage["type"], message: string) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        4000,
      );
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed right-5 top-5 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <Toast key={toast.id}>
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
            <Toast.Toggle
              onDismiss={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
            />
          </Toast>
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
