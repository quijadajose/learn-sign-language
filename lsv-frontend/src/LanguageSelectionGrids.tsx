import { Card, Button, Spinner, Pagination } from "flowbite-react";

export interface Language {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Region {
  id: string;
  name: string;
  code: string;
  description: string;
  isDefault: boolean;
  language: Language;
  createdAt: string;
  updatedAt: string;
}

interface LanguageGridProps {
  languages: Language[];
  selectedLanguageId: string | null;
  enrolling: boolean;
  currentPage: number;
  totalPages: number;
  onSelect: (lang: Language) => void;
  onPageChange: (page: number) => void;
  onNext: () => void;
}

export function LanguageGrid({
  languages,
  selectedLanguageId,
  enrolling,
  currentPage,
  totalPages,
  onSelect,
  onPageChange,
  onNext,
}: LanguageGridProps) {
  return (
    <>
      <div className="mb-8 flex flex-wrap justify-center gap-4">
        {languages.map((lang) => {
          const description =
            lang.description?.trim() &&
            lang.description.trim().toLowerCase() !== lang.name.trim().toLowerCase()
              ? lang.description
              : null;

          return (
            <Card
              key={lang.id}
              onClick={() => onSelect(lang)}
              className={`w-full max-w-xs cursor-pointer sm:w-64 ${
                selectedLanguageId === lang.id ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <h5 className="text-xl font-semibold text-gray-900 dark:text-white">
                {lang.name}
              </h5>
              {description && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {description}
                </p>
              )}
            </Card>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <Button onClick={onNext} disabled={!selectedLanguageId || enrolling}>
          {enrolling && <Spinner size="sm" className="mr-2" />}
          {enrolling ? "Inscribiendo..." : "Siguiente"}
        </Button>
      </div>
    </>
  );
}

interface RegionGridProps {
  regions: Region[];
  selectedRegionId: string | null;
  selectedLanguageName?: string;
  showLanguageLabel: boolean;
  enrolling: boolean;
  onSelect: (region: Region) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function RegionGrid({
  regions,
  selectedRegionId,
  selectedLanguageName,
  showLanguageLabel,
  enrolling,
  onSelect,
  onBack,
  onContinue,
}: RegionGridProps) {
  return (
    <>
      {showLanguageLabel && (
        <div className="mb-4 text-center">
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Idioma seleccionado:{" "}
            <span className="font-semibold">{selectedLanguageName}</span>
          </p>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {regions.map((region) => (
          <Card
            key={region.id}
            onClick={() => onSelect(region)}
            className={`cursor-pointer ${selectedRegionId === region.id ? "ring-2 ring-blue-500" : ""} `}
          >
            <h5 className="text-xl font-semibold text-gray-900 dark:text-white">
              {region.name}
            </h5>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {region.description}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Código: {region.code}
            </p>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex justify-center gap-4">
        <Button onClick={onBack} color="gray" disabled={enrolling}>
          Atrás
        </Button>
        <Button onClick={onContinue} disabled={!selectedRegionId || enrolling}>
          {enrolling && <Spinner size="sm" className="mr-2" />}
          {enrolling ? "Inscribiendo..." : "Continuar"}
        </Button>
      </div>
    </>
  );
}
