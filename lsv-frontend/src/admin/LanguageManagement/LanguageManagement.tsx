import {
  Button,
  Spinner,
  Alert,
  Toast,
  ToastToggle,
} from "flowbite-react";
import {
  HiExclamationCircle,
  HiCheck,
  HiX,
  HiPlus,
} from "react-icons/hi";
import AddLanguageModal from "./AddLanguageModal";
import DeleteLanguageModal from "./DeleteLanguageModal";
import EditLanguageModal from "./EditLanguageModal";
import LanguageTable from "./LanguageTable";
import ContentSetupChecklist from "../setup/ContentSetupChecklist";
import { useContentSetupProgress } from "../setup/useContentSetupProgress";
import { useLanguageManagement } from "./useLanguageManagement";

export default function LanguageManagement() {
  const {
    canCreateLanguage,
    hasLanguagePermission,
    hasAnyPermissionForLanguage,
    isAdmin,
    languages,
    loading,
    error,
    currentPage,
    totalPages,
    toastMessages,
    setToastMessages,
    imageTimestamp,
    isEditModalOpen,
    editingLanguage,
    editForm,
    setEditForm,
    editFormErrors,
    editSelectedFile,
    editPreviewUrl,
    isSubmitting,
    isDeleteModalOpen,
    deletingLanguage,
    isDeleting,
    isAddModalOpen,
    addForm,
    setAddForm,
    addFormErrors,
    selectedFile,
    addPreviewUrl,
    isAdding,
    countries,
    selectedCountry,
    loadingCountries,
    isDark,
    handlePageChange,
    handleEditClick,
    handleEditSubmit,
    handleCancelEdit,
    handleDeleteClick,
    handleCancelDelete,
    handleDeleteSubmit,
    handleAddClick,
    handleCountryChange,
    handleNameChange,
    handleCancelAdd,
    handleAddFieldBlur,
    handleEditFieldBlur,
    handleFileChange,
    handleEditFileChange,
    handleFileDrop,
    handleEditFileDrop,
    handleAddSubmit,
    searchCountries,
  } = useLanguageManagement();

  const setup = useContentSetupProgress({
    languages,
    enabled: !loading && !error,
  });

  if (loading) {
    return (
      <div className="py-10 text-center">
        <Spinner size="xl" aria-label="Cargando idiomas..." />
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Cargando idiomas...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="fixed right-5 top-5 z-[9999] flex flex-col gap-3">
        {toastMessages.map((toast) => (
          <Toast key={toast.id}>
            <div
              className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${
                toast.type === "success"
                  ? "bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200"
                  : "bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200"
              }`}
            >
              {toast.type === "success" ? (
                <HiCheck className="size-5" />
              ) : (
                <HiX className="size-5" />
              )}
            </div>
            <div className="ml-3 text-sm font-normal">{toast.message}</div>
            <ToastToggle
              onDismiss={() =>
                setToastMessages((prev) =>
                  prev.filter((t) => t.id !== toast.id),
                )
              }
            />
          </Toast>
        ))}
      </div>

      <div className="mx-auto w-full max-w-6xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Lenguajes
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Panel de entrada para admins y moderadores. Abre un lenguaje para
              gestionar su contenido.
            </p>
          </div>
          {canCreateLanguage() && (
            <Button onClick={handleAddClick} color="blue">
              <HiPlus className="mr-2 size-5" />
              Añadir Idioma
            </Button>
          )}
        </div>

        {error && (
          <Alert color="failure" icon={HiExclamationCircle} className="mb-4">
            <span className="font-medium">Error!</span> {error}
          </Alert>
        )}

        {!error && (
          <ContentSetupChecklist
            languageName={setup.focusLanguage?.name}
            steps={setup.steps}
            nextStep={setup.nextStep}
            loading={setup.loading}
            error={setup.countsError}
            onCreateLanguage={
              canCreateLanguage() ? handleAddClick : undefined
            }
            onGoToStep={(step) =>
              setup.goToStep(step, setup.focusLanguage?.id)
            }
          />
        )}

        <LanguageTable
          languages={languages}
          imageTimestamp={imageTimestamp}
          hasLanguagePermission={hasLanguagePermission}
          hasAnyPermissionForLanguage={hasAnyPermissionForLanguage}
          continuingId={setup.continuingId}
          onOpenWorkspace={setup.openWorkspace}
          onContinueSetup={setup.continueSetup}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onAddLanguage={canCreateLanguage() ? handleAddClick : undefined}
          canDelete={isAdmin}
        />
      </div>

      <EditLanguageModal
        show={isEditModalOpen}
        editingLanguage={editingLanguage}
        editForm={editForm}
        editFormErrors={editFormErrors}
        onEditFormChange={setEditForm}
        editSelectedFile={editSelectedFile}
        editPreviewUrl={editPreviewUrl}
        imageTimestamp={imageTimestamp}
        isSubmitting={isSubmitting}
        onClose={handleCancelEdit}
        onSubmit={handleEditSubmit}
        onFieldBlur={handleEditFieldBlur}
        onFileChange={handleEditFileChange}
        onFileDrop={handleEditFileDrop}
      />

      <DeleteLanguageModal
        show={isDeleteModalOpen}
        deletingLanguage={deletingLanguage}
        isDeleting={isDeleting}
        onClose={handleCancelDelete}
        onConfirm={handleDeleteSubmit}
      />

      <AddLanguageModal
        show={isAddModalOpen}
        addForm={addForm}
        addFormErrors={addFormErrors}
        onAddFormChange={setAddForm}
        selectedCountry={selectedCountry}
        onCountryChange={handleCountryChange}
        countries={countries}
        onSearchCountries={searchCountries}
        loadingCountries={loadingCountries}
        selectedFile={selectedFile}
        addPreviewUrl={addPreviewUrl}
        isAdding={isAdding}
        isDark={isDark}
        onClose={handleCancelAdd}
        onSubmit={handleAddSubmit}
        onNameChange={handleNameChange}
        onFieldBlur={handleAddFieldBlur}
        onFileChange={handleFileChange}
        onFileDrop={handleFileDrop}
      />
    </>
  );
}
