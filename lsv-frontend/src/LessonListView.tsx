import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Spinner,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "flowbite-react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useToast } from "./components/ToastProvider";
import {
  HiExclamationCircle,
  HiClock,
  HiCheckCircle,
  HiAcademicCap,
  HiChevronDown,
  HiBookOpen,
  HiStar,
} from "react-icons/hi";
import { lessonApi } from "./services/api";
import { BACKEND_BASE_URL } from "./config";
import { useAuth } from "./context/AuthContext";

interface Question {
  questionId: string;
  questionText: string;
  submittedOptionId: string;
  optionText: string;
  isCorrect: boolean;
}

interface Submission {
  submissionId: string;
  score: number;
  submittedAt: string;
  questions: Question[];
}

interface Lesson {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  maxScore: number;
  submissions: Submission[];
  regionId?: string;
}

interface StageProgress {
  id: string;
  name: string;
  description: string;
  totalLessons: string;
  completedLessons: string;
  progress: string | null;
}

function ScoreRing({ score }: { score: number }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score === 100
      ? "#22c55e"
      : score >= 80
        ? "#eab308"
        : score > 0
          ? "#3b82f6"
          : "#6b7280";

  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      <svg className="absolute -rotate-90" width="56" height="56">
        <circle
          cx="28"
          cy="28"
          r={radius}
          strokeWidth="4"
          stroke="currentColor"
          className="text-gray-200 dark:text-gray-700"
          fill="none"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          strokeWidth="4"
          stroke={color}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span
        className="relative z-10 text-xs font-bold"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}

function LessonCard({
  lesson,
  onViewLesson,
  onTakeExam,
  onShowSubmissions,
}: {
  lesson: Lesson;
  onViewLesson: (l: Lesson) => void;
  onTakeExam: (l: Lesson) => void;
  onShowSubmissions: (l: Lesson) => void;
}) {
  const isPerfect = lesson.maxScore === 100;
  const hasProgress = lesson.maxScore > 0 && !isPerfect;
  const hasAttempts = lesson.submissions.length > 0;

  const cardBg = isPerfect
    ? "bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-500 shadow-[0_5px_20px_-5px_rgba(245,158,11,0.3)] dark:from-yellow-500 dark:via-amber-500 dark:to-orange-600"
    : hasProgress
      ? "bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200/60 shadow-indigo-500/5 dark:from-indigo-800 dark:via-indigo-900 dark:to-purple-900 dark:border-indigo-700/40"
      : "bg-white border-gray-100 shadow-sm dark:bg-gray-800/80 dark:border-gray-700/60";

  const textMain = isPerfect || hasProgress ? "text-gray-900 dark:text-white" : "text-gray-900 dark:text-white";
  const textSub = isPerfect || hasProgress && !isPerfect ? "text-indigo-900/60 dark:text-white/75" : isPerfect ? "text-white/90" : "text-gray-500 dark:text-gray-400";
  const textScore = isPerfect || hasProgress && !isPerfect ? "text-indigo-900/40 dark:text-white/70" : isPerfect ? "text-white/70" : "text-gray-400 dark:text-gray-400";

  if (isPerfect) {
    // Override colors for perfect score cards specifically
    return (
      <div className={`group relative flex h-full flex-col overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${cardBg}`}>
        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm">
          <HiStar className="h-5 w-5 text-white" />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <h3 className="mb-1 text-lg font-black leading-tight text-white">
            {lesson.name}
          </h3>
          <p className="mb-4 text-sm font-medium text-white/90 line-clamp-2">
            {lesson.description}
          </p>
          <div className="mt-auto flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">Puntuación máx.</p>
              <p className="text-2xl font-black text-white">
                {lesson.maxScore}
                <span className="text-sm font-normal text-white/70">/100</span>
              </p>
            </div>
            {hasAttempts && (
              <button onClick={() => onShowSubmissions(lesson)} className="flex items-center gap-1 rounded-full bg-white/25 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-white/40">
                <HiCheckCircle className="h-3.5 w-3.5" />
                {lesson.submissions.length} intentos
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 p-4 pt-0">
          <button onClick={() => onViewLesson(lesson)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/20 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-white/30">
            <HiBookOpen className="h-4 w-4" /> Ver lección
          </button>
          <button disabled className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/15 py-2.5 text-sm font-bold text-white/60 cursor-default">
            <HiCheckCircle className="h-4 w-4" /> Examen completado
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${cardBg}`}
    >
      {/* Medal badge */}
      {isPerfect && (
        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm">
          <HiStar className="h-5 w-5 text-white" />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        {/* Title */}
        <h3 className={`mb-1 text-lg font-bold leading-tight ${textMain}`}>
          {lesson.name}
        </h3>
        <p className={`mb-4 text-sm ${textSub} line-clamp-2`}>
          {lesson.description}
        </p>

        {/* Score section */}
        <div className="mt-auto flex items-center justify-between">
          <div>
            <p className={`text-xs font-medium ${textScore}`}>Puntuación máx.</p>
            <p className={`text-2xl font-extrabold ${textMain}`}>
              {lesson.maxScore}
              <span className={`text-sm font-normal ${textScore}`}>/100</span>
            </p>
          </div>
          {hasAttempts && (
            <button
              onClick={() => onShowSubmissions(lesson)}
              className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                isPerfect || hasProgress
                  ? "bg-white/25 text-white hover:bg-white/40"
                  : "bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300"
              }`}
            >
              <HiCheckCircle className="h-3.5 w-3.5" />
              {lesson.submissions.length} intento{lesson.submissions.length !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className={`flex flex-col gap-2 p-4 pt-0`}
      >
        <button
          onClick={() => onViewLesson(lesson)}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
            isPerfect || hasProgress
              ? "bg-white/20 text-white hover:bg-white/30"
              : "bg-gray-700/60 text-gray-200 hover:bg-gray-700"
          }`}
        >
          <HiBookOpen className="h-4 w-4" />
          Ver lección
        </button>
        <button
          onClick={() => !isPerfect && onTakeExam(lesson)}
          disabled={isPerfect}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
            isPerfect
              ? "cursor-default bg-white/15 text-white/60"
              : hasProgress
                ? "bg-indigo-500/30 text-indigo-200 hover:bg-indigo-500/50"
                : "bg-indigo-600 text-white hover:bg-indigo-500"
          }`}
        >
          {isPerfect ? (
            <>
              <HiCheckCircle className="h-4 w-4" />
              Examen completado
            </>
          ) : (
            <>
              <HiAcademicCap className="h-4 w-4" />
              {hasProgress ? "Reintentar examen" : "Tomar examen"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default function LessonListView() {
  const { stageId } = useParams<{ stageId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const [selectedLanguageId] = useLocalStorage<string | null>(
    "selectedLanguageId",
    null,
  );
  const [selectedRegionId] = useLocalStorage<string | null>(
    "selectedRegionId",
    null,
  );
  const [, setPersistedStageId] = useLocalStorage<string | null>(
    `selectedStageId_${selectedLanguageId}`,
    null,
  );
  const addToast = useToast();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentStage, setCurrentStage] = useState<StageProgress | null>(null);
  const [allStages, setAllStages] = useState<StageProgress[]>([]);
  const [loadingStage, setLoadingStage] = useState(true);
  const [showStageDropdown, setShowStageDropdown] = useState(false);

  useEffect(() => {
    const fetchLessons = async () => {
      if (!token || !stageId) {
        setError("Faltan datos para cargar las lecciones.");
        setLoading(false);
        return;
      }

      const { languageId, regionId: regionIdFromState } = location.state || {};
      const regionId = regionIdFromState || selectedRegionId;
      if (!languageId) {
        setError("No se ha proporcionado un idioma para cargar las lecciones.");
        setLoading(false);
        addToast("error", "Error de navegación: Falta el ID del idioma.");
        return;
      }

      setLoading(true);

      const response = await lessonApi.getLessonsWithSubmissions(
        languageId,
        stageId,
        1,
        100,
        regionId || undefined,
      );

      if (response.success) {
        setLessons(response.data.data);
      } else {
        setError(response.message || "Error al cargar las lecciones");
        addToast("error", response.message || "Error al cargar las lecciones");
      }

      setLoading(false);
    };

    const fetchStageInfo = async () => {
      if (!token || !stageId) {
        setLoadingStage(false);
        return;
      }

      const { languageId } = location.state || {};
      const finalLanguageId = languageId || selectedLanguageId;

      if (!finalLanguageId) {
        setLoadingStage(false);
        return;
      }

      setLoadingStage(true);
      try {
        const response = await lessonApi.getStagesProgress(finalLanguageId);
        if (response.success) {
          const stages: StageProgress[] = response.data.data;
          setAllStages(stages);
          const stage = stages.find((s) => s.id === stageId);
          if (stage) {
            setCurrentStage(stage);
          }
        }
      } catch (err: any) {
        console.error("Error al cargar información de la etapa:", err);
      } finally {
        setLoadingStage(false);
      }
    };

    fetchLessons();
    fetchStageInfo();
  }, [stageId, token, addToast, location.state]);

  const handleViewLesson = (lesson: Lesson) => {
    const lessonId = lesson.id;
    if (lesson.regionId) {
      navigate(`/lesson/${lessonId}?regionId=${lesson.regionId}`);
    } else {
      navigate(`/lesson/${lessonId}`);
    }
  };

  const handleTakeExam = (lesson: Lesson) => {
    const lessonId = lesson.id;
    if (lesson.regionId) {
      navigate(`/quiz/${lessonId}?regionId=${lesson.regionId}`);
    } else {
      navigate(`/quiz/${lessonId}`);
    }
  };

  const handleChangeStage = (newStageId: string) => {
    const { languageId, regionId: regionIdFromState } = location.state || {};
    const finalLanguageId = languageId || selectedLanguageId;
    const finalRegionId = regionIdFromState || selectedRegionId;

    if (finalLanguageId === selectedLanguageId) {
      setPersistedStageId(newStageId);
    }

    setShowStageDropdown(false);
    navigate(`/lessons/stage/${newStageId}`, {
      state: {
        languageId: finalLanguageId,
        regionId: finalRegionId,
      },
    });
  };

  const handleShowSubmissions = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setShowModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isImageUrl = (text: string) => {
    return text.startsWith("/images/");
  };

  const renderOptionContent = (optionText: string) => {
    if (isImageUrl(optionText)) {
      return (
        <img
          src={`${BACKEND_BASE_URL}${optionText}`}
          alt="Opción de respuesta"
          className="h-auto max-h-32 max-w-full rounded border object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<span class="text-sm text-gray-600 dark:text-gray-400">${optionText}</span>`;
            }
          }}
        />
      );
    }
    return (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {optionText}
      </span>
    );
  };

  const progressPercent = parseFloat(currentStage?.progress || "0");
  const completedCount = parseInt(currentStage?.completedLessons || "0");
  const totalCount = parseInt(currentStage?.totalLessons || "0");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">

      {/* Stage Hero Banner */}
      {!loadingStage && currentStage && (
        <div className={`relative mb-8 rounded-3xl border border-gray-200 bg-white/70 p-8 shadow-2xl backdrop-blur-md dark:border-gray-700/60 dark:bg-gray-800/90 ${showStageDropdown ? "z-50" : "z-0"}`}>
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 dark:from-indigo-900/10 dark:to-purple-900/10" />
          </div>

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                 Etapa actual
              </span>
              <h1 className="mb-2 text-3xl font-black leading-tight text-gray-900 dark:text-white md:text-4xl">
                {currentStage.name}
              </h1>
              <p className="max-w-2xl text-lg font-medium text-gray-600 dark:text-gray-300">
                {currentStage.description}
              </p>
            </div>

            {/* Progress Visual */}
            <div className="flex flex-shrink-0 items-center gap-6">
              <ScoreRing score={Math.round(progressPercent)} />
              <div className="text-right">
                <p className="text-4xl font-black leading-none text-gray-900 dark:text-white">
                  {completedCount}
                  <span className="text-xl font-normal text-gray-400">/{totalCount}</span>
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">lecciones completadas</p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative mt-8">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.3)] transition-all duration-1000 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Stage switcher */}
          {allStages.length > 1 && (
            <div className="relative mt-4 flex justify-end">
              <button
                onClick={() => setShowStageDropdown((v) => !v)}
                className="flex items-center gap-2 rounded-xl border border-gray-600 bg-gray-700/70 px-4 py-2 text-sm font-semibold text-gray-200 backdrop-blur-sm transition-all hover:bg-gray-600/80"
              >
                Cambiar Sección
                <HiChevronDown
                  className={`h-4 w-4 transition-transform ${showStageDropdown ? "rotate-180" : ""}`}
                />
              </button>
              {showStageDropdown && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-800">
                  {allStages.map((stage) => (
                    <button
                      key={stage.id}
                      onClick={() => handleChangeStage(stage.id)}
                      disabled={stage.id === stageId}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                        stage.id === stageId
                          ? "cursor-default bg-blue-50 dark:bg-blue-900/20"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div className="flex-1">
                        <p
                          className={`text-sm font-semibold ${
                            stage.id === stageId
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-gray-800 dark:text-white"
                          }`}
                        >
                          {stage.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                          {stage.description}
                        </p>
                      </div>
                      {stage.id === stageId && (
                        <HiCheckCircle className="h-4 w-4 flex-shrink-0 text-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Loading & Error */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-20 text-gray-500">
          <Spinner size="xl" />
          <p className="text-sm">Cargando lecciones…</p>
        </div>
      )}
      {error && (
        <Alert color="failure" icon={HiExclamationCircle}>
          {error}
        </Alert>
      )}

      {/* Section title */}
      {!loading && !error && lessons.length > 0 && (
        <>
          <h2 className="mb-4 text-lg font-bold text-gray-700 dark:text-gray-300">
            Lecciones disponibles
            <span className="ml-2 rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-normal text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
              {lessons.length}
            </span>
          </h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {lessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onViewLesson={handleViewLesson}
                onTakeExam={handleTakeExam}
                onShowSubmissions={handleShowSubmissions}
              />
            ))}
          </div>
        </>
      )}

      {!loading && !error && lessons.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center dark:border-gray-700">
          <HiBookOpen className="h-12 w-12 text-gray-300 dark:text-gray-600" />
          <p className="font-medium text-gray-500 dark:text-gray-400">
            No hay lecciones disponibles para esta etapa.
          </p>
        </div>
      )}

      {/* Submissions Modal */}
      <Modal show={showModal} onClose={() => setShowModal(false)} size="4xl">
        <ModalHeader>
          <div className="flex items-center gap-2">
            <HiAcademicCap className="h-6 w-6 text-blue-600" />
            <span>Resultados: {selectedLesson?.name}</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-5">
            {selectedLesson?.submissions.map((submission, index) => {
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
                  {/* Attempt header */}
                  <div className="flex items-center justify-between bg-gray-50 px-5 py-3 dark:bg-gray-800/60">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                      <HiClock className="h-4 w-4 text-gray-400" />
                      Intento #{index + 1}
                      <span className="text-xs font-normal text-gray-400">
                        — {formatDate(submission.submittedAt)}
                      </span>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-sm font-bold ${scoreBadge}`}>
                      {submission.score}/100
                    </span>
                  </div>

                  {/* Score bar */}
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700">
                    <div
                      className={`h-full transition-all duration-700 ${scoreColor}`}
                      style={{ width: `${submission.score}%` }}
                    />
                  </div>

                  {/* Questions */}
                  <div className="divide-y divide-gray-100 px-5 dark:divide-gray-700">
                    {submission.questions.map((question, qIndex) => (
                      <div key={question.questionId} className="flex items-start gap-3 py-3">
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                          {qIndex + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="mb-1 text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {question.questionText}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Respuesta:
                            </span>
                            {renderOptionContent(question.optionText)}
                          </div>
                        </div>
                        <div className="flex-shrink-0 mt-0.5">
                          {question.isCorrect ? (
                            <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-300">
                              <HiCheckCircle className="h-3.5 w-3.5" />
                              Correcto
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                              <HiExclamationCircle className="h-3.5 w-3.5" />
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
            onClick={() => setShowModal(false)}
            className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700"
          >
            Cerrar
          </button>
        </ModalFooter>
      </Modal>

      {/* Backdrop for dropdown */}
      {showStageDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowStageDropdown(false)}
        />
      )}
    </div>
  );
}
