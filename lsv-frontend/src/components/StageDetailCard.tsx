import { Card, Button, Progress } from "flowbite-react";
import { useNavigate } from "react-router-dom";

interface StageProgress {
  id: string;
  name: string;
  description: string;
  totalLessons: string;
  completedLessons: string;
  progress: string | null;
}

interface Props {
  stage: StageProgress;
}

export default function StageDetailCard({ stage }: Props) {
  const navigate = useNavigate();

  const handleViewLessons = () => {
    const languageId = localStorage.getItem("selectedLanguageId");
    const regionId = localStorage.getItem("selectedRegionId");
    // Guardar la sección seleccionada en localStorage
    if (languageId) {
      localStorage.setItem(`selectedStageId_${languageId}`, stage.id);
    }
    navigate(`/lessons/stage/${stage.id}`, {
      state: {
        languageId,
        regionId,
      },
    });
  };
  return (
    <Card className="mb-8">
      <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {stage.name}: {stage.description}
      </h2>
      <p className="font-normal text-gray-700 dark:text-gray-400">
        Continúa tu aprendizaje en esta sección.
      </p>
      <div className="mt-4">
        <div className="mb-1 flex justify-between">
          <span className="text-base font-medium text-gray-700 dark:text-gray-400">
            Progreso General
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
      <Button color="blue" className="mt-4 w-full" onClick={handleViewLessons}>
        Ver Lecciones
      </Button>
    </Card>
  );
}
