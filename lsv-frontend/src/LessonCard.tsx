import {
  HiCheckCircle,
  HiAcademicCap,
  HiBookOpen,
  HiStar,
  HiSparkles,
} from "react-icons/hi";
import type { Lesson } from "./lessonListTypes";

export function LessonCard({
  lesson,
  onViewLesson,
  onTakeExam,
  onPractice,
  onShowSubmissions,
}: {
  lesson: Lesson;
  onViewLesson: (l: Lesson) => void;
  onTakeExam: (l: Lesson) => void;
  onPractice: (l: Lesson) => void;
  onShowSubmissions: (l: Lesson) => void;
}) {
  const isPerfect = lesson.maxScore === 100;
  const hasProgress = lesson.maxScore > 0 && !isPerfect;
  const hasAttempts = lesson.submissions.length > 0;

  const cardBg = isPerfect
    ? "bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-500 shadow-[0_5px_20px_-5px_rgba(245,158,11,0.3)] dark:from-yellow-500 dark:via-amber-500 dark:to-orange-600"
    : hasProgress
      ? "bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200/60 shadow-indigo-500/5 dark:from-indigo-800 dark:via-indigo-900 dark:to-purple-900 dark:border-indigo-700/40"
      : "bg-white border border-gray-100 shadow-sm dark:bg-gray-800/80 dark:border-gray-700/60";

  if (isPerfect) {
    return (
      <div
        className={`group relative flex h-full flex-col overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${cardBg}`}
      >
        <div className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm">
          <HiStar className="size-5 text-white" />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="mb-1 text-lg font-black leading-tight text-white">
            {lesson.name}
          </h3>
          <p className="mb-4 line-clamp-2 text-sm font-medium text-white/90">
            {lesson.description}
          </p>
          <div className="mt-auto flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
                Puntuación máx.
              </p>
              <p className="text-2xl font-black text-white">
                {lesson.maxScore}
                <span className="text-sm font-normal text-white/70">/100</span>
              </p>
            </div>
            {hasAttempts && (
              <button
                type="button"
                onClick={() => onShowSubmissions(lesson)}
                className="flex items-center gap-1 rounded-full bg-white/25 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/40"
              >
                <HiCheckCircle className="size-3.5" />
                {lesson.submissions.length} intentos
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 p-4 pt-0">
          <button
            type="button"
            onClick={() => onViewLesson(lesson)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/20 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-white/30"
          >
            <HiBookOpen className="size-4" /> Ver lección
          </button>
          {lesson.hasReadyModel === true && (
            <button
              type="button"
              onClick={() => onPractice(lesson)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/20 py-2.5 text-sm font-bold text-white transition-colors duration-200 hover:bg-white/30"
            >
              <HiSparkles className="size-4 text-yellow-300" />
              Practicar señas
            </button>
          )}
          <button
            type="button"
            disabled
            className="flex w-full cursor-default items-center justify-center gap-2 rounded-xl bg-white/15 py-2.5 text-sm font-bold text-white/60"
          >
            <HiCheckCircle className="size-4" /> Examen completado
          </button>
        </div>
      </div>
    );
  }

  const progressChip =
    "bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-white/25 dark:text-white dark:hover:bg-white/40";
  const progressSecondary =
    "bg-white text-indigo-900 border border-indigo-200 hover:bg-indigo-50 dark:border-transparent dark:bg-white/20 dark:text-white dark:hover:bg-white/30";
  const progressPrimary =
    "bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-500/40 dark:text-indigo-100 dark:hover:bg-indigo-500/60";

  return (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${cardBg}`}
    >
      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-1 text-lg font-bold leading-tight text-gray-900 dark:text-white">
          {lesson.name}
        </h3>
        <p
          className={`mb-4 line-clamp-2 text-sm ${
            hasProgress
              ? "text-indigo-900/70 dark:text-white/75"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {lesson.description}
        </p>

        <div className="mt-auto flex items-center justify-between">
          <div>
            <p
              className={`text-xs font-medium ${
                hasProgress
                  ? "text-indigo-800/60 dark:text-white/70"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              Puntuación máx.
            </p>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white">
              {lesson.maxScore}
              <span
                className={`text-sm font-normal ${
                  hasProgress
                    ? "text-indigo-800/50 dark:text-white/70"
                    : "text-gray-400"
                }`}
              >
                /100
              </span>
            </p>
          </div>
          {hasAttempts && (
            <button
              type="button"
              onClick={() => onShowSubmissions(lesson)}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                hasProgress
                  ? progressChip
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300"
              }`}
            >
              <HiCheckCircle className="size-3.5" />
              {lesson.submissions.length} intento
              {lesson.submissions.length !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4 pt-0">
        <div
          className={`grid gap-2 ${
            lesson.hasReadyModel === true ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          <button
            type="button"
            onClick={() => onViewLesson(lesson)}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
              hasProgress
                ? progressSecondary
                : "bg-gray-700/60 text-gray-200 hover:bg-gray-700"
            }`}
          >
            <HiBookOpen className="size-4" />
            Ver
          </button>
          {lesson.hasReadyModel === true && (
            <button
              type="button"
              onClick={() => onPractice(lesson)}
              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
                hasProgress
                  ? progressSecondary
                  : "bg-indigo-700 text-white hover:bg-indigo-600"
              }`}
            >
              <HiSparkles
                className={`size-4 ${
                  hasProgress
                    ? "text-amber-500 dark:text-yellow-300"
                    : "text-yellow-400"
                }`}
              />
              Practicar
            </button>
          )}
        </div>
        {lesson.hasQuiz === true ? (
          <button
            type="button"
            onClick={() => onTakeExam(lesson)}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
              hasProgress
                ? progressPrimary
                : "bg-indigo-600 text-white hover:bg-indigo-500"
            }`}
          >
            <HiAcademicCap className="size-4" />
            {hasProgress ? "Reintentar examen" : "Tomar examen"}
          </button>
        ) : (
          <div className="flex w-full cursor-not-allowed flex-col items-center justify-center gap-0.5 rounded-xl border border-dashed border-gray-300 bg-gray-50 py-2.5 dark:border-gray-600 dark:bg-gray-700/40">
            <span className="text-sm font-bold text-gray-500 dark:text-gray-300">
              Próximamente
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              Sin examen aún
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
