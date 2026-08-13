import { Toast, ToastToggle } from "flowbite-react";
import { HiCheck, HiX } from "react-icons/hi";
import type { ToastMessage } from "./types";

interface StageToastStackProps {
  toastMessages: ToastMessage[];
  onDismiss: (id: number) => void;
}

export default function StageToastStack({
  toastMessages,
  onDismiss,
}: StageToastStackProps) {
  return (
    <div className="fixed right-5 top-5 z-9999 flex flex-col gap-3">
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
          <ToastToggle onDismiss={() => onDismiss(toast.id)} />
        </Toast>
      ))}
    </div>
  );
}
