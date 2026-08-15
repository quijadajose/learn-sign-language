import { Spinner } from "flowbite-react";
import { useTranslation } from "react-i18next";

type LoadingSpinnerProps = {
  label?: string;
  className?: string;
};

export function LoadingSpinner({ label, className }: LoadingSpinnerProps) {
  const { t } = useTranslation("common");
  const text = label ?? t("loading");
  return (
    <div
      className={
        className ??
        "flex min-h-[40vh] flex-col items-center justify-center gap-3"
      }
    >
      <Spinner size="xl" aria-label={text} />
      <p aria-hidden="true" className="text-gray-600 dark:text-gray-400">
        {text}
      </p>
    </div>
  );
}
