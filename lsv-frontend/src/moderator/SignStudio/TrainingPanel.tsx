import { useState } from "react";
import { Button, Card } from "flowbite-react";
import { HiChevronDown, HiChevronUp, HiOutlineCloudUpload } from "react-icons/hi";
import type { TrainingMode } from "./types";

export interface TrainingPanelProps {
  hasSigns: boolean;
  isTraining: boolean;
  selectedTrainingSignIds: string[];
  onClearTrainingSelection: () => void;
  selectedLessonId: string;
  selectedStageId: string;
  selectedLanguageId: string;
  onTriggerTraining: (mode: TrainingMode) => void;
  onSelectAllForTraining: () => void;
}

export function TrainingPanel({
  hasSigns,
  isTraining,
  selectedTrainingSignIds,
  onClearTrainingSelection,
  selectedLessonId,
  selectedStageId,
  selectedLanguageId,
  onTriggerTraining,
  onSelectAllForTraining,
}: TrainingPanelProps) {
  const [showMoreScopes, setShowMoreScopes] = useState(false);
  const primaryTrainMode: TrainingMode =
    selectedTrainingSignIds.length > 0 ? "selection" : "lesson";
  const primaryTrainLabel =
    selectedTrainingSignIds.length > 0
      ? `Entrenar selección (${selectedTrainingSignIds.length})`
      : "Entrenar lección";
  const primaryTrainDisabled =
    isTraining ||
    (primaryTrainMode === "selection"
      ? selectedTrainingSignIds.length === 0
      : !selectedLessonId);

  return (
    <Card className="h-full shadow-sm">
      <h4 className="mb-3 flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
        <HiOutlineCloudUpload className="size-4" /> Entrenamiento
      </h4>
      {!hasSigns ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Disponible cuando la lección tenga señas.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="mb-1 flex items-center justify-between px-1 text-xs font-medium">
            <span className="text-gray-500 dark:text-gray-400">
              En entrenamiento: {selectedTrainingSignIds.length}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-blue-500 hover:underline"
                onClick={onSelectAllForTraining}
              >
                Todas
              </button>
              {selectedTrainingSignIds.length > 0 && (
                <button
                  type="button"
                  className="text-red-500 hover:underline"
                  onClick={onClearTrainingSelection}
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          <Button
            size="sm"
            color="blue"
            onClick={() => onTriggerTraining(primaryTrainMode)}
            disabled={primaryTrainDisabled}
          >
            {primaryTrainLabel}
          </Button>

          <button
            type="button"
            className="flex items-center justify-center gap-1 pt-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            onClick={() => setShowMoreScopes((v) => !v)}
            aria-expanded={showMoreScopes}
          >
            {showMoreScopes ? (
              <HiChevronUp className="size-3.5" />
            ) : (
              <HiChevronDown className="size-3.5" />
            )}
            Más alcances
          </button>

          {showMoreScopes && (
            <div className="grid grid-cols-1 gap-2 pt-1">
              <Button
                size="xs"
                color="gray"
                onClick={() => onTriggerTraining("stage")}
                disabled={isTraining || !selectedStageId}
              >
                Toda la etapa
              </Button>
              <Button
                size="xs"
                color="gray"
                onClick={() => onTriggerTraining("language")}
                disabled={isTraining || !selectedLanguageId}
              >
                Lenguaje / región
              </Button>
              {selectedTrainingSignIds.length > 0 && (
                <Button
                  size="xs"
                  color="gray"
                  outline
                  onClick={() => onTriggerTraining("lesson")}
                  disabled={isTraining || !selectedLessonId}
                >
                  Solo lección (ignorar casillas)
                </Button>
              )}
            </div>
          )}

          {isTraining && (
            <div className="mt-2 text-center text-xs font-medium text-blue-500">
              Entrenamiento en cola…
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
