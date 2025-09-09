import { Card, Button, Spinner, Alert, Progress } from "flowbite-react";
import { useEffect, useState } from "react";
import { HiExclamationCircle } from "react-icons/hi";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useToast } from "./components/ToastProvider";
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

export default function LessonList({ language }: Props) {
  const [stages, setStages] = useState<StageProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token] = useLocalStorage<string | null>("auth", null);
  const addToast = useToast();

  useEffect(() => {
    const fetchStagesProgress = async () => {
      if (!token) {
        setError("No estás autenticado.");
        setLoading(false);
        return;
      }
      setLoading(true);

      const response = await lessonApi.getStagesProgress(language.id);

      if (response.success) {
        setStages(response.data);
      } else {
        setError(
          response.message || "Error al cargar el progreso de las etapas",
        );
        addToast(
          "error",
          response.message || "Error al cargar el progreso de las etapas",
        );
      }

      setLoading(false);
    };
    fetchStagesProgress();
  }, [language.id, token, addToast]);

  const handleViewLessons = (stageId: string) => {
    addToast(
      "info",
      `Funcionalidad para ver lecciones de la etapa ${stageId} no implementada.`,
    );
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <h1 className="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-white">
        Lecciones del {language.name}
      </h1>

      {loading && <Spinner size="xl" />}
      {error && (
        <Alert color="failure" icon={HiExclamationCircle}>
          {error}
        </Alert>
      )}

      {!loading && !error && stages.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stages.map((stage) => (
            <Card key={stage.id}>
              <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                {stage.name}
              </h5>
              <p className="font-normal text-gray-700 dark:text-gray-400">
                {stage.description}
              </p>
              <div className="mt-2">
                <div className="mb-1 flex justify-between">
                  <span className="text-base font-medium text-gray-700 dark:text-gray-400">
                    Progreso
                  </span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                    {stage.completedLessons} de {stage.totalLessons} lecciones
                  </span>
                </div>
                <Progress
                  progress={parseFloat(stage.progress || "0")}
                  color="blue"
                  size="lg"
                />
              </div>
              <Button
                color="blue"
                onClick={() => handleViewLessons(stage.id)}
                className="mt-4"
              >
                Ver Lecciones
              </Button>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && stages.length === 0 && (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No hay etapas disponibles para este idioma.
        </p>
      )}
    </div>
  );
}
