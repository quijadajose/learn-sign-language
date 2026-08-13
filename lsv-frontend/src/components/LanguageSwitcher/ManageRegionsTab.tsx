import { Button, Dropdown, DropdownItem, Spinner } from "flowbite-react";
import {
  HiCheckCircle,
  HiDotsVertical,
  HiPlus,
  HiTrash,
} from "react-icons/hi";
import type { UseLanguageSwitcherReturn } from "./useLanguageSwitcher";
import { usefulDescription } from "./utils";

type ManageRegionsTabProps = Pick<
  UseLanguageSwitcherReturn,
  | "languages"
  | "regions"
  | "loading"
  | "selectedRegionId"
  | "switching"
  | "enrollingRegion"
  | "showRegionEnrollment"
  | "selectedLanguageForRegion"
  | "getEnrolledRegionsForLanguage"
  | "handleRegionSelect"
  | "handleEnrollInRegion"
  | "handleEnrollRegion"
  | "handleSwitchRegion"
  | "handleUnenrollLanguage"
  | "handleUnenrollRegion"
  | "handleBackFromRegionEnrollment"
  | "handleBackFromRegionEnrollmentNoRegions"
>;

export default function ManageRegionsTab({
  languages,
  regions,
  loading,
  selectedRegionId,
  switching,
  enrollingRegion,
  showRegionEnrollment,
  selectedLanguageForRegion,
  getEnrolledRegionsForLanguage,
  handleRegionSelect,
  handleEnrollInRegion,
  handleEnrollRegion,
  handleSwitchRegion,
  handleUnenrollLanguage,
  handleUnenrollRegion,
  handleBackFromRegionEnrollment,
  handleBackFromRegionEnrollmentNoRegions,
}: ManageRegionsTabProps) {
  if (showRegionEnrollment) {
    const enrolledIds = new Set(
      selectedLanguageForRegion
        ? getEnrolledRegionsForLanguage(selectedLanguageForRegion.id).map(
            (r) => r.region.id,
          )
        : [],
    );
    const availableRegions = regions.filter((r) => !enrolledIds.has(r.id));

    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Agregar región
          </p>
          <h3 className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
            {selectedLanguageForRegion?.name}
          </h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Elige una región para este idioma.
          </p>
        </div>

        {availableRegions.length > 0 ? (
          <>
            <ul className="max-h-64 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200 dark:divide-gray-700/80 dark:border-gray-700">
              {availableRegions.map((region) => {
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
              <Button
                color="gray"
                onClick={handleBackFromRegionEnrollment}
                disabled={enrollingRegion}
              >
                Atrás
              </Button>
              <Button
                onClick={handleEnrollRegion}
                disabled={!selectedRegionId || enrollingRegion}
              >
                {enrollingRegion && <Spinner size="sm" className="mr-2" />}
                {enrollingRegion ? "Inscribiendo…" : "Inscribirse"}
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center dark:border-gray-700">
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              No hay más regiones disponibles para este idioma.
            </p>
            <Button
              color="gray"
              onClick={handleBackFromRegionEnrollmentNoRegions}
              disabled={enrollingRegion}
            >
              Atrás
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (languages.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center dark:border-gray-700">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Aún no tienes idiomas inscritos.
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Usa la pestaña Inscribirme para empezar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Toca una región para activarla. La activa se usa en lecciones y
        progreso.
      </p>

      <div className="space-y-6">
        {languages.map((language) => {
          const enrolledRegions = getEnrolledRegionsForLanguage(language.id);
          const description = usefulDescription(
            language.name,
            language.description,
          );

          return (
            <section key={language.id} className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {language.name}
                  </h3>
                  {description && (
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                      {description}
                    </p>
                  )}
                </div>

                {languages.length > 1 && (
                  <Dropdown
                    arrowIcon={false}
                    inline
                    label={
                      <span
                        className="inline-flex rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                        aria-label={`Más opciones para ${language.name}`}
                      >
                        <HiDotsVertical className="size-5" />
                      </span>
                    }
                  >
                    <DropdownItem
                      icon={HiTrash}
                      className="text-red-600 dark:text-red-400"
                      onClick={() => handleUnenrollLanguage(language.id)}
                    >
                      Salir de este idioma
                    </DropdownItem>
                  </Dropdown>
                )}
              </div>

              {enrolledRegions.length > 0 ? (
                <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 dark:divide-gray-700/80 dark:border-gray-700">
                  {enrolledRegions.map((enrolledRegion) => {
                    const region = enrolledRegion.region;
                    const isActive = region.id === selectedRegionId;
                    const regionDescription = usefulDescription(
                      region.name,
                      region.description,
                    );

                    return (
                      <li
                        key={region.id}
                        className={`flex items-stretch ${
                          isActive
                            ? "bg-indigo-50/80 dark:bg-indigo-500/10"
                            : "bg-transparent"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (!isActive) handleSwitchRegion(region.id);
                          }}
                          disabled={switching || isActive}
                          className={`flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-colors ${
                            isActive
                              ? "cursor-default"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                          }`}
                        >
                          <span
                            className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                              isActive
                                ? "border-indigo-500 bg-indigo-500 text-white"
                                : "border-gray-300 dark:border-gray-600"
                            }`}
                            aria-hidden
                          >
                            {isActive && <HiCheckCircle className="size-4" />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {region.name}
                              </span>
                              {isActive && (
                                <span className="rounded-full bg-indigo-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                                  Activa
                                </span>
                              )}
                            </span>
                            {regionDescription && (
                              <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                                {regionDescription}
                              </span>
                            )}
                          </span>
                        </button>

                        <div className="flex items-center pr-2">
                          <Dropdown
                            arrowIcon={false}
                            inline
                            label={
                              <span
                                className="inline-flex rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                                aria-label={`Opciones de ${region.name}`}
                              >
                                <HiDotsVertical className="size-4" />
                              </span>
                            }
                          >
                            <DropdownItem
                              icon={HiTrash}
                              className="text-red-600 dark:text-red-400"
                              onClick={() => handleUnenrollRegion(region.id)}
                            >
                              Salir de esta región
                            </DropdownItem>
                          </Dropdown>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    No tienes regiones en este idioma.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleEnrollInRegion(language)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-500 disabled:opacity-50 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                <HiPlus className="size-4" />
                Agregar región
              </button>
            </section>
          );
        })}
      </div>
    </div>
  );
}
