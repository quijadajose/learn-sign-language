import { Spinner } from "flowbite-react";

export interface LanguageChip {
  id: string;
  name: string;
  countryCode?: string;
}

interface LanguageChipPickerProps {
  languages: LanguageChip[];
  selectedLanguageId: string | null;
  loading?: boolean;
  onSelect: (languageId: string) => void;
}

export default function LanguageChipPicker({
  languages,
  selectedLanguageId,
  loading = false,
  onSelect,
}: LanguageChipPickerProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Spinner size="sm" />
        Cargando lenguajes…
      </div>
    );
  }

  if (languages.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No tienes lenguajes disponibles para gestionar.
      </p>
    );
  }

  if (languages.length === 1) {
    const language = languages[0];
    return (
      <div className="inline-flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20">
        {language.countryCode && (
          <img
            src={`/flags/${language.countryCode.toLowerCase()}.svg`}
            alt=""
            className="h-6 w-9 rounded-sm object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        )}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-blue-700 dark:text-blue-300">
            Lenguaje
          </p>
          <p className="font-semibold text-gray-900 dark:text-white">
            {language.name}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
        Elige el lenguaje a configurar
      </p>
      <div className="flex flex-wrap gap-3">
        {languages.map((language) => {
          const selected = language.id === selectedLanguageId;
          return (
            <button
              key={language.id}
              type="button"
              onClick={() => onSelect(language.id)}
              className={`flex min-w-[12rem] items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                selected
                  ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500 dark:border-blue-400 dark:bg-blue-900/30 dark:ring-blue-400"
                  : "border-gray-200 bg-white hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
              }`}
            >
              {language.countryCode ? (
                <img
                  src={`/flags/${language.countryCode.toLowerCase()}.svg`}
                  alt=""
                  className="h-6 w-9 shrink-0 rounded-sm object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span className="flex h-6 w-9 shrink-0 items-center justify-center rounded-sm bg-gray-200 text-xs font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {(language.name[0] || "?").toUpperCase()}
                </span>
              )}
              <span className="font-medium text-gray-900 dark:text-white">
                {language.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
