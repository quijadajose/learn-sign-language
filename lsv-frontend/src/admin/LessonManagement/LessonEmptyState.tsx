import { Button } from "flowbite-react";
import { HiPlus, HiArrowRight } from "react-icons/hi";

interface LessonEmptyStateProps {
  languageName?: string | null;
  hasStages: boolean;
  canCreate: boolean;
  onCreate: () => void;
  onGoToStages: () => void;
}

export default function LessonEmptyState({
  languageName,
  hasStages,
  canCreate,
  onCreate,
  onGoToStages,
}: LessonEmptyStateProps) {
  if (!hasStages) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-8 dark:border-gray-600 dark:bg-gray-800">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Primero necesitas etapas
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Las lecciones se organizan dentro de una etapa. Crea al menos una
            etapa para {languageName ?? "este lenguaje"} y vuelve aquí.
          </p>
          <Button color="blue" className="mt-6" onClick={onGoToStages}>
            Ir a etapas
            <HiArrowRight className="ml-2 size-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-8 dark:border-gray-600 dark:bg-gray-800">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {languageName
            ? `Aún no hay lecciones en ${languageName}`
            : "Aún no hay lecciones"}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Crea la primera lección y asígnala a una etapa para que los
          estudiantes puedan empezar.
        </p>
      </div>

      {canCreate && (
        <div className="mt-8 flex justify-center">
          <Button
            color="blue"
            onClick={onCreate}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <HiPlus className="mr-2 size-4" />
            Crear primera lección
          </Button>
        </div>
      )}
    </div>
  );
}
