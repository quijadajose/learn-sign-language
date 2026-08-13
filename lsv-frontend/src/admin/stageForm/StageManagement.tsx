import { Button, Spinner, Alert } from "flowbite-react";
import { HiPlus, HiExclamationCircle, HiArrowRight } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import StageToastStack from "./StageToastStack";
import StageTable from "./StageTable";
import StageModals from "./StageModals";
import StageLanguagePicker from "./StageLanguagePicker";
import StageEmptyState from "./StageEmptyState";
import { useStageManagement } from "./useStageManagement";

export default function StageManagement() {
  const navigate = useNavigate();
  const {
    stages,
    loading,
    error,
    languageId,
    languageName,
    languages,
    languagesLoading,
    currentPage,
    pageSize,
    totalStages,
    orderBy,
    sortOrder,
    showAddModal,
    showEditModal,
    showDeleteModal,
    currentStage,
    formData,
    isSubmitting,
    isDeleting,
    applyingCefr,
    toastMessages,
    setToastMessages,
    handlePageChange,
    handleSortChange,
    handleLanguageChange,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteStage,
    handleInputChange,
    handleAddSubmit,
    handleApplyCefr,
    handleEditSubmit,
  } = useStageManagement();

  const hasLanguage = Boolean(languageId);
  const showEmpty =
    !loading && !error && hasLanguage && stages.length === 0;

  return (
    <>
      <StageToastStack
        toastMessages={toastMessages}
        onDismiss={(id) =>
          setToastMessages((prev) => prev.filter((t) => t.id !== id))
        }
      />

      <div className="mx-auto w-full max-w-5xl p-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Etapas
              {languageName ? (
                <span className="font-semibold text-gray-500 dark:text-gray-400">
                  {" "}
                  · {languageName}
                </span>
              ) : null}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
              Las etapas son los niveles de progreso del lenguaje. Las lecciones
              se organizan dentro de cada etapa.
            </p>
          </div>
          {hasLanguage && stages.length > 0 && (
            <Button onClick={openAddModal} color="blue">
              <HiPlus className="mr-2 size-5" />
              Añadir etapa
            </Button>
          )}
        </div>

        <div className="mb-6">
          <StageLanguagePicker
            languages={languages}
            selectedLanguageId={languageId}
            loading={languagesLoading}
            onSelect={handleLanguageChange}
          />
        </div>

        {loading && (
          <div className="py-10 text-center">
            <Spinner size="xl" aria-label="Cargando etapas..." />
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Cargando etapas...
            </p>
          </div>
        )}

        {error && !loading && (
          <Alert color="failure" icon={HiExclamationCircle} className="mb-4">
            <span className="font-medium">Error!</span> {error}
          </Alert>
        )}

        {!loading && !error && !hasLanguage && (
          <Alert color="warning" icon={HiExclamationCircle}>
            Selecciona un lenguaje para gestionar sus etapas.
          </Alert>
        )}

        {showEmpty && (
          <StageEmptyState
            languageName={languageName}
            isApplyingCefr={applyingCefr}
            onApplyCefr={handleApplyCefr}
            onCreateCustom={openAddModal}
          />
        )}

        {!loading && !error && stages.length > 0 && (
          <>
            <Alert color="info" className="mb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  Siguiente paso: crea regiones o continúa con lecciones.
                </span>
                <div className="flex gap-2">
                  <Button
                    size="xs"
                    color="light"
                    onClick={() => navigate("/admin/regions")}
                  >
                    Ir a regiones
                    <HiArrowRight className="ml-1 size-3.5" />
                  </Button>
                  <Button
                    size="xs"
                    color="blue"
                    onClick={() => navigate("/admin/lessons")}
                  >
                    Ir a lecciones
                    <HiArrowRight className="ml-1 size-3.5" />
                  </Button>
                </div>
              </div>
            </Alert>

            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {totalStages} etapa{totalStages === 1 ? "" : "s"}
              </p>
              <Button
                size="xs"
                color="light"
                disabled={applyingCefr}
                onClick={handleApplyCefr}
              >
                Completar niveles MCER faltantes (A1–C2)
              </Button>
            </div>

            <StageTable
              stages={stages}
              orderBy={orderBy}
              sortOrder={sortOrder}
              currentPage={currentPage}
              pageSize={pageSize}
              totalStages={totalStages}
              onSortChange={handleSortChange}
              onPageChange={handlePageChange}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
            />
          </>
        )}
      </div>

      <StageModals
        showAddModal={showAddModal}
        showEditModal={showEditModal}
        showDeleteModal={showDeleteModal}
        currentStage={currentStage}
        formData={formData}
        isSubmitting={isSubmitting}
        isDeleting={isDeleting}
        onCloseAdd={closeAddModal}
        onCloseEdit={closeEditModal}
        onCloseDelete={closeDeleteModal}
        onInputChange={handleInputChange}
        onAddSubmit={handleAddSubmit}
        onEditSubmit={handleEditSubmit}
        onDelete={handleDeleteStage}
      />
    </>
  );
}
