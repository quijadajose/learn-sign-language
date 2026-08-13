import { Button, Alert, Toast, ToastToggle, Spinner } from "flowbite-react";
import { HiPlus, HiArrowRight } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import CreateRegionModal from "./CreateRegionModal";
import DeleteRegionModal from "./DeleteRegionModal";
import EditRegionModal from "./EditRegionModal";
import GroupedRegionList from "./GroupedRegionList";
import ViewRegionModal from "./ViewRegionModal";
import RegionEmptyState from "./RegionEmptyState";
import LanguageChipPicker from "../components/LanguageChipPicker";
import { useRegionManagement } from "./useRegionManagement";

export default function RegionManagement() {
  const navigate = useNavigate();
  const {
    loading,
    error,
    setError,
    totalRegions,
    toasts,
    isDarkMode,
    groupedRegions,
    createLanguageHasBaseRegion,
    editLanguageHasOtherBase,
    expandedCountries,
    expandedLanguages,
    toggleCountry,
    toggleLanguage,
    hasRegionPermission,
    hasLanguagePermission,
    isCreateModalOpen,
    openCreateModal,
    closeCreateModal,
    selectedLanguageOption,
    handleLanguageSelectChange,
    allLanguages,
    selectedLanguageId,
    focusLanguage,
    handleFocusLanguageChange,
    selectedCountry,
    selectedDivision,
    handleDivisionChange,
    loadDivisionOptions,
    createForm,
    setCreateForm,
    handleCreateRegion,
    createLoading,
    isEditModalOpen,
    setIsEditModalOpen,
    editSelectedCountry,
    editSelectedDivision,
    handleEditDivisionChange,
    loadEditDivisionOptions,
    editForm,
    setEditForm,
    handleEditRegion,
    editLoading,
    isViewModalOpen,
    setIsViewModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    selectedRegion,
    handleDeleteRegion,
    deleteLoading,
    openEditModal,
    openDeleteModal,
    openViewModal,
  } = useRegionManagement();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  const showEmpty = totalRegions === 0;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Regiones
            {focusLanguage ? (
              <span className="font-semibold text-gray-500 dark:text-gray-400">
                {" "}
                · {focusLanguage.name}
              </span>
            ) : null}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
            Las regiones representan variantes locales del lenguaje de señas.
            Necesitas al menos una región base para que los estudiantes puedan
            inscribirse.
          </p>
        </div>
        {!showEmpty && (
          <Button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <HiPlus className="mr-2 size-4" />
            Nueva región
          </Button>
        )}
      </div>

      <LanguageChipPicker
        languages={allLanguages}
        selectedLanguageId={selectedLanguageId}
        onSelect={handleFocusLanguageChange}
      />

      {error && (
        <Alert color="failure" onDismiss={() => setError(null)}>
          <span className="font-medium">Error!</span> {error}
        </Alert>
      )}

      {showEmpty ? (
        <RegionEmptyState
          languageName={focusLanguage?.name}
          onCreate={openCreateModal}
        />
      ) : (
        <>
          <Alert color="info">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>
                Siguiente paso: crea lecciones o continúa en Sign Studio.
              </span>
              <div className="flex gap-2">
                <Button
                  size="xs"
                  color="light"
                  onClick={() => navigate("/admin/lessons")}
                >
                  Ir a lecciones
                  <HiArrowRight className="ml-1 size-3.5" />
                </Button>
                <Button
                  size="xs"
                  color="blue"
                  onClick={() => navigate("/admin/stages")}
                >
                  Ver etapas
                  <HiArrowRight className="ml-1 size-3.5" />
                </Button>
              </div>
            </div>
          </Alert>

          <GroupedRegionList
            totalRegions={totalRegions}
            groupedRegions={groupedRegions}
            expandedCountries={expandedCountries}
            expandedLanguages={expandedLanguages}
            toggleCountry={toggleCountry}
            toggleLanguage={toggleLanguage}
            hasRegionPermission={hasRegionPermission}
            hasLanguagePermission={hasLanguagePermission}
            onView={openViewModal}
            onEdit={openEditModal}
            onDelete={openDeleteModal}
          />
        </>
      )}

      <CreateRegionModal
        show={isCreateModalOpen}
        onClose={closeCreateModal}
        allLanguages={allLanguages}
        selectedLanguageOption={selectedLanguageOption}
        onLanguageChange={handleLanguageSelectChange}
        selectedCountry={selectedCountry}
        selectedDivision={selectedDivision}
        onDivisionChange={handleDivisionChange}
        loadDivisionOptions={loadDivisionOptions}
        createForm={createForm}
        onCreateFormChange={setCreateForm}
        onSubmit={handleCreateRegion}
        loading={createLoading}
        isDarkMode={isDarkMode}
        languageHasBaseRegion={createLanguageHasBaseRegion}
      />

      <EditRegionModal
        show={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        editSelectedCountry={editSelectedCountry}
        editSelectedDivision={editSelectedDivision}
        onDivisionChange={handleEditDivisionChange}
        loadEditDivisionOptions={loadEditDivisionOptions}
        editForm={editForm}
        onEditFormChange={setEditForm}
        onSubmit={handleEditRegion}
        loading={editLoading}
        isDarkMode={isDarkMode}
        hasOtherBaseRegion={editLanguageHasOtherBase}
      />

      <ViewRegionModal
        show={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        region={selectedRegion}
      />

      <DeleteRegionModal
        show={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        region={selectedRegion}
        onConfirm={handleDeleteRegion}
        loading={deleteLoading}
      />

      <div className="fixed right-4 top-4 z-9999 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id}>
            <div
              className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${
                toast.type === "success"
                  ? "bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200"
                  : "bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200"
              }`}
            >
              {toast.type === "success" ? "✓" : "✕"}
            </div>
            <div className="ml-3 text-sm font-normal">{toast.message}</div>
            <ToastToggle />
          </Toast>
        ))}
      </div>
    </div>
  );
}
