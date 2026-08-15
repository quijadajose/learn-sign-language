import { Spinner, Alert, Button } from "flowbite-react";
import { Link } from "react-router-dom";
import { LanguageGrid, RegionGrid } from "./LanguageSelectionGrids";
import { HiExclamationCircle } from "react-icons/hi";
import type { Language } from "./LanguageSelectionGrids";
import { useLanguageSelection } from "./useLanguageSelection";
import { usePermissions } from "./hooks/usePermissions";

interface Props {
  onLanguageSelected: (lang: Language) => void;
}

export default function LanguageSelection({ onLanguageSelected }: Props) {
  const { isAdmin } = usePermissions();
  const {
    languages,
    regions,
    loading,
    error,
    currentPage,
    setCurrentPage,
    totalPages,
    selectedLanguageId,
    selectedRegionId,
    enrolling,
    title,
    showRegionSelection,
    selectedLanguage,
    isLanguageFromEnrollment,
    handleNext,
    handleSelect,
    handleRegionSelect,
    handleBack,
  } = useLanguageSelection(onLanguageSelected);

  const showEmptyLanguages =
    !loading && !error && !showRegionSelection && languages.length === 0;

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <h1 className="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-white">
        {title}
      </h1>

      {loading && (
        <div
          className="flex items-center justify-center py-8"
          role="status"
          aria-live="polite"
        >
          <Spinner size="xl" aria-label="Cargando..." />
        </div>
      )}
      {error && (
        <Alert color="failure" icon={HiExclamationCircle}>
          {error}
        </Alert>
      )}

      {showEmptyLanguages && (
        <div className="mx-auto max-w-md text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {isAdmin
              ? "Todavía no hay lenguajes"
              : "Aún no hay lenguajes disponibles"}
          </p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {isAdmin
              ? "Crea el primero para que los estudiantes puedan empezar a aprender."
              : "Pronto un administrador publicará nuevos lenguajes. Vuelve más tarde."}
          </p>
          {isAdmin && (
            <Button
              as={Link}
              to="/admin/languages"
              color="blue"
              className="mt-6 bg-blue-700 hover:bg-blue-800"
            >
              Crear lenguaje
            </Button>
          )}
        </div>
      )}

      {!loading && !error && languages.length > 0 && !showRegionSelection && (
        <LanguageGrid
          languages={languages}
          selectedLanguageId={selectedLanguageId}
          enrolling={enrolling}
          currentPage={currentPage}
          totalPages={totalPages}
          onSelect={handleSelect}
          onPageChange={setCurrentPage}
          onNext={() => handleNext()}
        />
      )}

      {!loading && !error && showRegionSelection && regions.length > 0 && (
        <RegionGrid
          regions={regions}
          selectedRegionId={selectedRegionId}
          selectedLanguageName={selectedLanguage?.name}
          showLanguageLabel={!isLanguageFromEnrollment}
          enrolling={enrolling}
          onSelect={handleRegionSelect}
          onBack={handleBack}
          onContinue={() => handleNext()}
        />
      )}
    </div>
  );
}
