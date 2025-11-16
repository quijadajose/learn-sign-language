import { Spinner, Alert } from "flowbite-react";
import { useEffect, useState } from "react";
import { HiExclamationCircle } from "react-icons/hi";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useToast } from "./components/ToastProvider";
import StageDetailCard from "./components/StageDetailCard";
import StageSelector from "./components/StageSelector";
import { useNavigate } from "react-router-dom";
import { lessonApi } from "./services/api";

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
  const [token] = useLocalStorage<string | null>("auth", null);
  const addToast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (language?.id) {
      localStorage.setItem("selectedLanguageId", language.id);
    }

    const fetchStagesProgress = async () => {
      if (!token) {
        setError("No estás autenticado.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await lessonApi.getStagesProgress(language.id);
        if (!response.success)
          throw new Error(response.message || "Error al cargar progreso");
        const data: StageProgress[] = response.data.data;
        setStages(data);
        if (data.length > 0) {
          // Intentar cargar la sección guardada desde localStorage
          const savedStageId = localStorage.getItem(
            `selectedStageId_${language.id}`,
          );
          let initialStage: StageProgress | undefined;

          if (savedStageId) {
            initialStage = data.find((s) => s.id === savedStageId);
          }

          // Si no se encontró la sección guardada o no hay guardada, usar la lógica original
          if (!initialStage) {
            initialStage =
              data.find((s) => parseFloat(s.progress || "0") > 0) || data[0];
          }

          if (initialStage) {
            setSelectedStage(initialStage);
            // Guardar la sección seleccionada en localStorage
            localStorage.setItem(
              `selectedStageId_${language.id}`,
              initialStage.id,
            );
          }
        }
      } catch (err: any) {
        setError(err.message);
        addToast("error", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStagesProgress();
  }, [language, token, addToast]);

  const handleSelectStage = (stageId: string) => {
    const stage = stages.find((s) => s.id === stageId);
    if (stage) {
      // Guardar la sección seleccionada en localStorage
      localStorage.setItem(`selectedStageId_${language.id}`, stageId);
      setSelectedStage(stage);
      const regionId = localStorage.getItem("selectedRegionId");
      navigate(`/lessons/stage/${stageId}`, {
        state: {
          languageId: language.id,
          regionId: regionId,
        },
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Progreso en {language.name}
        </h1>
      </div>

      {loading && <Spinner size="xl" />}
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
