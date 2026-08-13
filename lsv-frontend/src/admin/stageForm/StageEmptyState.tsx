import { Button, Spinner } from "flowbite-react";
import { HiPlus } from "react-icons/hi";
import { CEFR_LEVELS } from "./cefrPresets";

interface StageEmptyStateProps {
  languageName?: string | null;
  isApplyingCefr?: boolean;
  onApplyCefr: () => void;
  onCreateCustom: () => void;
}

export default function StageEmptyState({
  languageName,
  isApplyingCefr = false,
  onApplyCefr,
  onCreateCustom,
}: StageEmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-8 dark:border-gray-600 dark:bg-gray-800">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {languageName
            ? `Aún no hay etapas en ${languageName}`
            : "Aún no hay etapas"}
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Las etapas son los <strong>niveles de progreso</strong> del lenguaje
          (como A1, A2…). Dentro de cada etapa crearás las lecciones.
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-xl">
        <button
          type="button"
          disabled={isApplyingCefr}
          onClick={onApplyCefr}
          className="w-full rounded-xl border border-blue-300 bg-blue-50 p-5 text-left transition hover:border-blue-500 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-700 dark:bg-blue-900/30 dark:hover:border-blue-400 dark:hover:bg-blue-900/50"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Usar MCER (A1–C2)
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Crea automáticamente los 6 niveles del Marco Europeo de
                Referencia.
              </p>
              <p className="mt-3 text-xs font-medium text-blue-700 dark:text-blue-300">
                {CEFR_LEVELS.map((level) => level.code).join(" · ")}
              </p>
            </div>
            {isApplyingCefr && <Spinner size="md" />}
          </div>
        </button>

        <div className="mt-6 flex flex-col items-center gap-2 border-t border-gray-200 pt-6 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ¿Prefieres definir tus propios niveles?
          </p>
          <Button color="light" onClick={onCreateCustom} disabled={isApplyingCefr}>
            <HiPlus className="mr-2 size-4" />
            Crear etapa personalizada
          </Button>
        </div>
      </div>
    </div>
  );
}
