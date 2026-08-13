import { Card } from "flowbite-react";
import { HiCheck, HiX } from "react-icons/hi";

interface QuizSubmissionCardProps {
  score: number;
  submittedAt: string;
}

export function QuizSubmissionCard({ score, submittedAt }: QuizSubmissionCardProps) {
  const passed = score >= 80;

  return (
    <Card className="mb-6">
      <div className="text-center">
        <div
          className={`mb-4 inline-flex size-16 items-center justify-center rounded-full ${
            passed
              ? "bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-200"
              : "bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-200"
          }`}
        >
          {passed ? <HiCheck className="size-8" /> : <HiX className="size-8" />}
        </div>
        <h2
          className={`mb-2 text-2xl font-bold ${
            passed
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {passed ? "¡Aprobado!" : "Repasa e inténtalo de nuevo"}
        </h2>
        <p className="mb-4 text-lg text-gray-600 dark:text-gray-400">
          Has sacado <span className="font-semibold">{score.toFixed(2)}</span> de 100 puntos
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enviado el: {new Date(submittedAt).toLocaleString("es-ES")}
        </p>
      </div>
    </Card>
  );
}
