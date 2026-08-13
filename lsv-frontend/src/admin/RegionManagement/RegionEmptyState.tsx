import { Button } from "flowbite-react";
import { HiPlus } from "react-icons/hi";

interface RegionEmptyStateProps {
  languageName?: string | null;
  onCreate: () => void;
}

export default function RegionEmptyState({
  languageName,
  onCreate,
}: RegionEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-8 dark:border-gray-600 dark:bg-gray-800">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {languageName
            ? `Aún no hay regiones en ${languageName}`
            : "Aún no hay regiones"}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Las regiones permiten <strong>variantes locales</strong> de las señas
          (por estado o zona). Elige una división del país y márcala como región
          base si es la principal del lenguaje.
        </p>
      </div>

      <div className="mt-8 flex justify-center">
        <Button
          color="blue"
          onClick={onCreate}
          disabled={!languageName}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <HiPlus className="mr-2 size-4" />
          Crear primera región
        </Button>
      </div>
    </div>
  );
}
