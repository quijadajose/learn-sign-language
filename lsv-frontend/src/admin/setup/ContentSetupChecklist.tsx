import { Button, Spinner } from "flowbite-react";
import { HiCheckCircle, HiArrowRight, HiLockClosed } from "react-icons/hi";
import type { SetupStep, SetupStepId } from "./types";
import { getNextStepLabel } from "./getNextSetupStep";

interface ContentSetupChecklistProps {
  languageName?: string | null;
  steps: SetupStep[];
  nextStep: SetupStepId;
  loading?: boolean;
  error?: string | null;
  onCreateLanguage?: () => void;
  onGoToStep: (step: SetupStepId) => void;
}

export default function ContentSetupChecklist({
  languageName,
  steps,
  nextStep,
  loading = false,
  error = null,
  onCreateLanguage,
  onGoToStep,
}: ContentSetupChecklistProps) {
  if (error) {
    return (
      <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
        <p className="font-semibold text-red-800 dark:text-red-200">
          No se pudo cargar la guía de configuración
        </p>
        <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (nextStep === "done") {
    return (
      <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
        <div className="flex items-start gap-3">
          <HiCheckCircle className="mt-0.5 size-6 shrink-0 text-green-600 dark:text-green-400" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-200">
              Configuración básica completa
              {languageName ? ` para ${languageName}` : ""}
            </p>
            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
              Abre el panel del lenguaje para gestionar lecciones, Sign Studio,
              quizzes o moderadores.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const completed = steps.filter((step) => step.done).length;

  return (
    <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-900/20">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Guía de configuración
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {languageName
              ? `Sigue estos pasos para dejar listo “${languageName}”.`
              : "Crea el contenido mínimo para que los estudiantes puedan aprender."}
          </p>
        </div>
        <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <Spinner size="sm" />
              Revisando…
            </span>
          ) : (
            `${completed}/${steps.length} completados`
          )}
        </div>
      </div>

      <ol className="space-y-3">
        {steps.map((step, index) => {
          const isPrimaryAction = step.current && !step.locked;
          const isOptionalAction =
            Boolean(step.optional) && !step.locked && !step.done;
          const showAction = isPrimaryAction || isOptionalAction;

          return (
            <li
              key={step.id}
              className={`flex items-start gap-3 rounded-lg bg-white/70 p-3 dark:bg-gray-900/40 ${
                step.current
                  ? "ring-2 ring-blue-500 dark:ring-blue-400"
                  : ""
              }`}
            >
              <div
                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  step.done
                    ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200"
                    : step.current
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {step.done ? <HiCheckCircle className="size-4" /> : index + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {step.label}
                  {step.optional ? (
                    <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                      Opcional
                    </span>
                  ) : null}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
              {step.locked ? (
                <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                  <HiLockClosed className="size-3.5" />
                  Bloqueado
                </span>
              ) : showAction ? (
                <Button
                  size="sm"
                  color={isPrimaryAction ? "blue" : "light"}
                  onClick={() => {
                    if (step.id === "language") {
                      onCreateLanguage?.();
                      return;
                    }
                    onGoToStep(step.id);
                  }}
                >
                  {getNextStepLabel(step.id)}
                  <HiArrowRight className="ml-1 size-4" />
                </Button>
              ) : step.done ? (
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  Listo
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
