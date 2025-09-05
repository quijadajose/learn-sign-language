import { Card, Button } from "flowbite-react";

interface StageProgress {
  id: string;
  name: string;
  description: string;
  totalLessons: string;
  completedLessons: string;
  progress: string | null;
}

interface Props {
  stages: StageProgress[];
  selectedStageId: string;
  onSelectStage: (stageId: string) => void;
}

export default function StageSelector({
  stages,
  selectedStageId,
  onSelectStage,
}: Props) {
  return (
    <div>
      <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
        Otras Secciones
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {stages
          .filter((s) => s.id !== selectedStageId)
          .map((stage) => (
            <Card key={stage.id}>
              <h5 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                {stage.name}
              </h5>
              <p className="text-sm font-normal text-gray-700 dark:text-gray-400">
                {stage.description}
              </p>
              <Button
                color="light"
                onClick={() => onSelectStage(stage.id)}
                className="mt-2"
              >
                Seleccionar Sección
              </Button>
            </Card>
          ))}
      </div>
    </div>
  );
}
