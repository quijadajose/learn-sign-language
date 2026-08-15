import { Spinner } from "flowbite-react";
import type { StageItem } from "./types";

interface LessonStageFilterProps {
  stages: StageItem[];
  selectedStageId: string;
  loading?: boolean;
  onSelect: (stageId: string) => void;
}

export default function LessonStageFilter({
  stages,
  selectedStageId,
  loading = false,
  onSelect,
}: LessonStageFilterProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Spinner size="sm" aria-label="Cargando etapas..." />
        Cargando etapas…
      </div>
    );
  }

  if (stages.length === 0) {
    return null;
  }

  const chips = [{ id: "", name: "Todas" }, ...stages];

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        Filtrar por etapa
      </p>
      <div className="flex flex-wrap gap-2">
        {chips.map((stage) => {
          const selected = stage.id === selectedStageId;
          return (
            <button
              key={stage.id || "all"}
              type="button"
              onClick={() => onSelect(stage.id)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                selected
                  ? "border-blue-500 bg-blue-50 font-medium text-blue-800 ring-1 ring-blue-500 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-200 dark:ring-blue-400"
                  : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-600"
              }`}
            >
              {stage.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
