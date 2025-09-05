import { Spinner, Alert } from "flowbite-react";
import { useEffect, useState } from "react";
import { BACKEND_BASE_URL } from "./config";
import { HiExclamationCircle } from "react-icons/hi";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useToast } from "./components/ToastProvider";
import StageDetailCard from "./components/StageDetailCard";
import StageSelector from "./components/StageSelector";

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
        const res = await fetch(
          `${BACKEND_BASE_URL}/users/stages-progress/${language.id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (!res.ok) throw new Error(await res.text());
        const data: StageProgress[] = await res.json();
        setStages(data);
        if (data.length > 0) {
          const initialStage =
            data.find((s) => parseFloat(s.progress || "0") > 0) || data[0];
          setSelectedStage(initialStage);
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
      setSelectedStage(stage);
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
