import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Spinner, Alert } from "flowbite-react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useToast } from "./components/ToastProvider";
import { HiExclamationCircle, HiBookOpen } from "react-icons/hi";
import { lessonApi } from "./services/api";
import { useAuth } from "./context/AuthContext";
import type { Lesson, StageProgress } from "./lessonListTypes";
import { LessonCard } from "./LessonCard";
import { StageHeroBanner } from "./StageHeroBanner";
import { SubmissionsModal } from "./SubmissionsModal";

export default function LessonListView() {
  const { stageId } = useParams<{ stageId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
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
  const [, setExplicitStageSelection] = useLocalStorage(
    `selectedStageExplicit_${selectedLanguageId}`,
    false,
  );
  const addToast = useToast();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentStage, setCurrentStage] = useState<StageProgress | null>(null);
  const [allStages, setAllStages] = useState<StageProgress[]>([]);
  const [loadingStage, setLoadingStage] = useState(true);
  const [showStageDropdown, setShowStageDropdown] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const fetchLessons = async () => {
      if (!isAuthenticated || !stageId) {
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

      try {
        const response = await lessonApi.getLessonsWithSubmissions(
          languageId,
          stageId,
          1,
          100,
          regionId || undefined,
        );
        if (controller.signal.aborted) return;

        if (response.success) {
          setLessons(response.data.data);
        } else {
          setError(response.message || "Error al cargar las lecciones");
          addToast("error", response.message || "Error al cargar las lecciones");
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchStageInfo = async () => {
      if (!isAuthenticated || !stageId) {
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
        if (controller.signal.aborted) return;
        if (response.success) {
          const stages: StageProgress[] = [...(response.data.data ?? [])].sort(
            (a, b) =>
              a.name.localeCompare(b.name, undefined, {
                numeric: true,
                sensitivity: "base",
              }),
          );
          setAllStages(stages);
          const stage = stages.find((s) => s.id === stageId);
          if (stage) {
            setCurrentStage(stage);
          }
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          console.error("Error al cargar información de la etapa:", err);
        }
      } finally {
        setLoadingStage(false);
      }
    };

    void fetchLessons();
    void fetchStageInfo();

    return () => {
      controller.abort();
    };
  }, [
    stageId,
    isAuthenticated,
    addToast,
    location.state,
    selectedLanguageId,
    selectedRegionId,
  ]);

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

  const handlePractice = (lesson: Lesson) => {
    const { languageId, regionId: regionIdFromState } = location.state || {};
    const finalLanguageId = languageId || selectedLanguageId;
    const finalRegionId = regionIdFromState || selectedRegionId;

    const practicePath = finalRegionId
      ? `/lesson/${lesson.id}/practice?regionId=${finalRegionId}`
      : `/lesson/${lesson.id}/practice`;

    navigate(practicePath, {
      state: {
        from: `/lessons/stage/${stageId}`,
        regionId: finalRegionId,
        returnState: {
          languageId: finalLanguageId,
          regionId: finalRegionId,
        },
      },
    });
  };

  const handleChangeStage = (newStageId: string) => {
    const target = allStages.find((s) => s.id === newStageId);
    if (!target || parseInt(target.totalLessons || "0", 10) <= 0) {
      setShowStageDropdown(false);
      return;
    }

    const { languageId, regionId: regionIdFromState } = location.state || {};
    const finalLanguageId = languageId || selectedLanguageId;
    const finalRegionId = regionIdFromState || selectedRegionId;

    if (finalLanguageId === selectedLanguageId) {
      setPersistedStageId(newStageId);
      setExplicitStageSelection(true);
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

  const progressPercent = parseFloat(currentStage?.progress || "0");
  const completedCount = parseInt(currentStage?.completedLessons || "0");
  const totalCount = parseInt(currentStage?.totalLessons || "0");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      {!loadingStage && currentStage && (
        <StageHeroBanner
          currentStage={currentStage}
          progressPercent={progressPercent}
          completedCount={completedCount}
          totalCount={totalCount}
          allStages={allStages}
          stageId={stageId}
          showStageDropdown={showStageDropdown}
          onToggleDropdown={() => setShowStageDropdown((v) => !v)}
          onChangeStage={handleChangeStage}
        />
      )}

      {/* Loading & Error */}
      {loading && (
        <div
          className="flex flex-col items-center gap-3 py-20 text-gray-500"
          role="status"
          aria-live="polite"
        >
          <Spinner size="xl" aria-hidden="true" />
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
                onPractice={handlePractice}
                onShowSubmissions={handleShowSubmissions}
              />
            ))}
          </div>
        </>
      )}

      {!loading && !error && lessons.length === 0 && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center dark:border-gray-700">
          <HiBookOpen className="size-12 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Próximamente
          </p>
          <p className="font-medium text-gray-500 dark:text-gray-400">
            Esta sección aún no tiene lecciones disponibles.
          </p>
        </div>
      )}

      <SubmissionsModal
        show={showModal}
        lesson={selectedLesson}
        onClose={() => setShowModal(false)}
      />

      {/* Backdrop for dropdown */}
      {showStageDropdown && (
        <button
          type="button"
          aria-label="Cerrar menú de secciones"
          className="fixed inset-0 z-40"
          onClick={() => setShowStageDropdown(false)}
        />
      )}
    </div>
  );
}
