import { Card } from "flowbite-react";
import { HiCheck, HiX } from "react-icons/hi";
import { useTranslation } from "react-i18next";
import { getUiLocale } from "./i18n";

interface QuizSubmissionCardProps {
  score: number;
  submittedAt: string;
}

export function QuizSubmissionCard({ score, submittedAt }: QuizSubmissionCardProps) {
  const { t } = useTranslation("learn");
  const passed = score >= 80;
  const date = new Date(submittedAt).toLocaleString(
    getUiLocale() === "en" ? "en-US" : "es-ES",
  );

  return (
    <Card className="mb-6">
      <div className="text-center" role="status" aria-live="polite">
        <div
          className={`mb-4 inline-flex size-16 items-center justify-center rounded-full ${
            passed
              ? "bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-200"
              : "bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-200"
          }`}
        >
        {passed ? (
          <HiCheck className="size-8" aria-hidden />
        ) : (
          <HiX className="size-8" aria-hidden />
        )}
        </div>
        <h2
          className={`mb-2 text-2xl font-bold ${
            passed
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {passed ? t("quiz.passed") : t("quiz.retry")}
        </h2>
        <p className="mb-4 text-lg text-gray-600 dark:text-gray-400">
          {t("quiz.score", { score: score.toFixed(2) })}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t("quiz.submittedAt", { date })}
        </p>
      </div>
    </Card>
  );
}
