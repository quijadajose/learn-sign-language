import { Spinner, Alert } from "flowbite-react";
import { useEffect, useState } from "react";
import { HiExclamationCircle } from "react-icons/hi";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { stageSelectionStorageKeys } from "./utils/learningStorage";
import { useToast } from "./components/ToastProvider";
import StageDetailCard from "./components/StageDetailCard";
import StageSelector from "./components/StageSelector";
import { useNavigate } from "react-router-dom";
import { lessonApi } from "./services/api";
import { useAuth } from "./context/AuthContext";

interface StageProgress {
  id: string;
  name: string;
  description: string;
  totalLessons: string;
  completedLessons: string;
  progress: string | null;
}

interface Language {
  id: string;
  name: string;
  description: string;
}

interface Props {
  language: Language;
}

export default function StageProgressView({ language }: Props) {
  const [stages, setStages] = useState<StageProgress[]>([]);
  const [selectedStage, setSelectedStage] = useState<StageProgress | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const [, setSelectedLanguageId] = useLocalStorage<string | null>(
    "selectedLanguageId",
    null,
  );
  const [selectedRegionId] = useLocalStorage<string | null>(
    "selectedRegionId",
    null,
  );
  const { stageId: stageStorageKey, explicit: explicitStorageKey } =
    stageSelectionStorageKeys(language.id);
  const [persistedStageId, setPersistedStageId] = useLocalStorage<
    string | null
  >(stageStorageKey, null);
  const [explicitStageSelection, setExplicitStageSelection] = useLocalStorage(
    explicitStorageKey,
    false,
  );
  const addToast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    if (language?.id) {
      setSelectedLanguageId(language.id);
    }

    (async () => {
      if (!isAuthenticated) {
        setError("No estás autenticado.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await lessonApi.getStagesProgress(language.id);
        if (cancelled) return;
        if (!response.success)
          throw new Error(response.message || "Error al cargar progreso");
        const data: StageProgress[] = [...(response.data.data ?? [])].sort(
          (a, b) =>
            a.name.localeCompare(b.name, undefined, {
              numeric: true,
              sensitivity: "base",
            }),
        );
        setStages(data);
        if (data.length > 0) {
          let initialStage: StageProgress | undefined;

          // Only honor a saved stage when the user picked it on purpose
          // (not the old auto-pin from DESC ordering).
          if (persistedStageId && explicitStageSelection) {
            initialStage = data.find((s) => s.id === persistedStageId);
          }

          if (!initialStage) {
            const withLessons = data.filter(
              (s) => parseInt(s.totalLessons || "0", 10) > 0,
            );
            const pool = withLessons.length > 0 ? withLessons : data;
            initialStage =
              pool.find((s) => parseFloat(s.progress || "0") < 100) || pool[0];
          }

          if (initialStage) {
            setSelectedStage(initialStage);
          }
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Error al cargar progreso";
        setError(message);
        addToast("error", message);
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    language,
    isAuthenticated,
    addToast,
    persistedStageId,
    explicitStageSelection,
    setSelectedLanguageId,
  ]);

  const handleSelectStage = (stageId: string) => {
    const stage = stages.find((s) => s.id === stageId);
    if (!stage || parseInt(stage.totalLessons || "0", 10) <= 0) {
      return;
    }
    setPersistedStageId(stageId);
    setExplicitStageSelection(true);
    setSelectedStage(stage);
    navigate(`/lessons/stage/${stageId}`, {
      state: {
        languageId: language.id,
        regionId: selectedRegionId,
      },
    });
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Progreso en {language.name}
        </h1>
      </div>

      {loading && (
        <div role="status" aria-live="polite">
          <Spinner size="xl" aria-label="Cargando progreso..." />
        </div>
      )}
      {error && (
        <Alert color="failure" icon={HiExclamationCircle}>
          {error}
        </Alert>
      )}

      {!loading && !error && selectedStage && (
        <>
          <StageDetailCard stage={selectedStage} />
          <StageSelector
            stages={stages}
            selectedStageId={selectedStage.id}
            onSelectStage={handleSelectStage}
          />
        </>
      )}

      {!loading && !error && stages.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No hay etapas disponibles para este idioma.
        </p>
      )}
    </div>
  );
}
