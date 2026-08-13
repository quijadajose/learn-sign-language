import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "flowbite-react";
import {
  HiAcademicCap,
  HiClock,
  HiCheckCircle,
  HiExclamationCircle,
} from "react-icons/hi";
import { formatDateLong } from "./utils/formatDate";
import { QuizOptionDisplay } from "./QuizOptionDisplay";
import type { Lesson } from "./lessonListTypes";

interface SubmissionsModalProps {
  show: boolean;
  lesson: Lesson | null;
  onClose: () => void;
}

export function SubmissionsModal({ show, lesson, onClose }: SubmissionsModalProps) {
  return (
    <Modal show={show} onClose={onClose} size="4xl">
      <ModalHeader>
        <div className="flex items-center gap-2">
          <HiAcademicCap className="size-6 text-blue-600" />
          <span>Resultados: {lesson?.name}</span>
        </div>
      </ModalHeader>
      <ModalBody>
        <div className="space-y-5">
          {lesson?.submissions.map((submission, index) => {
            const scoreColor =
              submission.score === 100
                ? "bg-green-500"
                : submission.score >= 80
                  ? "bg-yellow-500"
                  : "bg-red-500";
            const scoreBadge =
              submission.score === 100
                ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                : submission.score >= 80
                  ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300"
                  : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300";

            return (
              <div
                key={submission.submissionId}
                className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between bg-gray-50 px-5 py-3 dark:bg-gray-800/60">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <HiClock className="size-4 text-gray-400" />
                    Intento #{index + 1}
                    <span className="text-xs font-normal text-gray-400">
                      — {formatDateLong(submission.submittedAt)}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-sm font-bold ${scoreBadge}`}
                  >
                    {submission.score}/100
                  </span>
                </div>

                <div className="h-1.5 bg-gray-100 dark:bg-gray-700">
                  <div
                    className={`h-full transition-all duration-700 ${scoreColor}`}
                    style={{ width: `${submission.score}%` }}
                  />
                </div>

                <div className="divide-y divide-gray-100 px-5 dark:divide-gray-700">
                  {submission.questions.map((question, qIndex) => (
                    <div
                      key={question.questionId}
                      className="flex items-start gap-3 py-3"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                        {qIndex + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {question.questionText}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Respuesta:
                          </span>
                          <QuizOptionDisplay
                            text={question.optionText}
                            imageClassName="h-auto max-h-32 max-w-full rounded border object-contain"
                            textClassName="text-sm text-gray-600 dark:text-gray-400"
                          />
                        </div>
                      </div>
                      <div className="mt-0.5 shrink-0">
                        {question.isCorrect ? (
                          <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                            <HiCheckCircle className="size-3.5" />
                            Correcto
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                            <HiExclamationCircle className="size-3.5" />
                            Incorrecto
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ModalBody>
      <ModalFooter>
        <button
          onClick={onClose}
          className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          Cerrar
        </button>
      </ModalFooter>
    </Modal>
  );
}
