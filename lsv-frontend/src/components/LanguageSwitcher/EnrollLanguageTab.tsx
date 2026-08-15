import { Button, Spinner } from "flowbite-react";
import { HiCheckCircle } from "react-icons/hi";
import type { UseLanguageSwitcherReturn } from "./useLanguageSwitcher";
import { usefulDescription } from "./utils";

type EnrollLanguageTabProps = Pick<
  UseLanguageSwitcherReturn,
  | "regions"
  | "selectedRegionId"
  | "enrolling"
  | "showRegionSelection"
  | "selectedLanguageForEnroll"
  | "getFilteredAvailableLanguages"
  | "handleLanguageSelect"
  | "handleRegionSelect"
  | "handleEnroll"
  | "handleBack"
  | "handleProceedToEnrollRegionSelection"
  | "setSelectedLanguageForEnroll"
>;

export default function EnrollLanguageTab({
  regions,
  selectedRegionId,
  enrolling,
  showRegionSelection,
  selectedLanguageForEnroll,
  getFilteredAvailableLanguages,
  handleLanguageSelect,
  handleRegionSelect,
  handleEnroll,
  handleBack,
  handleProceedToEnrollRegionSelection,
  setSelectedLanguageForEnroll,
}: EnrollLanguageTabProps) {
  if (!showRegionSelection) {
    const available = getFilteredAvailableLanguages();

    if (available.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No hay idiomas disponibles para inscribirse.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Elige un idioma para inscribirte.
        </p>

        <ul className="max-h-64 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200 dark:divide-gray-700/80 dark:border-gray-700">
          {available.map((language) => {
            const isSelected = selectedLanguageForEnroll?.id === language.id;
            const description = usefulDescription(
              language.name,
              language.description,
            );

            return (
              <li key={language.id}>
                <button
                  type="button"
                  onClick={() => handleLanguageSelect(language)}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-500/10"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/80"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-500 text-white"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {isSelected && <HiCheckCircle className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-gray-900 dark:text-white">
                      {language.name}
                    </span>
                    {description && (
                      <span className="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">
                        {description}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {selectedLanguageForEnroll && (
          <div className="flex justify-end gap-2 pt-1">
            <Button
              color="gray"
              onClick={() => setSelectedLanguageForEnroll(null)}
              disabled={enrolling}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleProceedToEnrollRegionSelection}
              disabled={enrolling}
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Región inicial
        </p>
        <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
          {selectedLanguageForEnroll?.name}
        </h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Podrás cambiar de región más adelante.
        </p>
      </div>

      {regions.length > 0 ? (
        <>
          <ul className="max-h-64 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200 dark:divide-gray-700/80 dark:border-gray-700">
            {regions.map((region) => {
              const isSelected = selectedRegionId === region.id;
              const description = usefulDescription(
                region.name,
                region.description,
              );

              return (
                <li key={region.id}>
                  <button
                    type="button"
                    onClick={() => handleRegionSelect(region)}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-indigo-500/10"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/80"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500 text-white"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {isSelected && <HiCheckCircle className="size-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-gray-900 dark:text-white">
                        {region.name}
                      </span>
                      {description && (
                        <span className="mt-0.5 block text-sm text-gray-500 dark:text-gray-400">
                          {description}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex justify-between gap-2 pt-1">
            <Button color="gray" onClick={handleBack} disabled={enrolling}>
              Atrás
            </Button>
            <Button
              onClick={handleEnroll}
              disabled={!selectedRegionId || enrolling}
            >
              {enrolling && <Spinner size="sm" className="mr-2" aria-hidden="true" />}
              {enrolling ? "Inscribiendo…" : "Inscribirse"}
            </Button>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center dark:border-gray-700">
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            No hay regiones disponibles para este idioma.
          </p>
          <div className="flex justify-between gap-2">
            <Button color="gray" onClick={handleBack} disabled={enrolling}>
              Atrás
            </Button>
            <Button onClick={handleEnroll} disabled={enrolling}>
              {enrolling && <Spinner size="sm" className="mr-2" aria-hidden="true" />}
              {enrolling ? "Inscribiendo…" : "Continuar sin región"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
