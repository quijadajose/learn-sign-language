import { Alert, Button, Spinner, Toast, ToastToggle } from "flowbite-react";
import {
  HiExclamationCircle,
  HiCheck,
  HiX,
  HiPlus,
  HiArrowRight,
} from "react-icons/hi";
import { formatDateShort } from "../../utils/formatDate";
import {
  CreateLessonFormModal,
  EditLessonFormModal,
} from "./LessonFormModal";
import LessonListTable from "./LessonListTable";
import LessonEmptyState from "./LessonEmptyState";
import LessonStageFilter from "./LessonStageFilter";
import LessonViewModal from "./LessonViewModal";
import LessonDeleteModal from "./LessonDeleteModal";
import {
  VariantListModal,
  VariantFormModal,
} from "./LessonVariantModals";
import LanguageChipPicker from "../components/LanguageChipPicker";
import { useLessonManagement } from "./useLessonManagement";
import { ToastMessage } from "./types";

export default function LessonManagement() {
  const {
    navigate,
    hasLanguagePermission,
    hasRegionPermission,
    hasAnyPermissionForLanguage,
    languages,
    lessons,
    loading,
    lessonsLoading,
    error,
    currentPage,
    totalPages,
    totalLessons,
    filterStageId,
    filterStages,
    filterStagesLoading,
    selectedLanguageId,
    isViewModalOpen,
    selectedLesson,
    viewLoading,
    toasts,
    isEditModalOpen,
    editLoading,
    stagesLoading,
    stages,
    editForm,
    isCreateModalOpen,
    createLoading,
    createForm,
    isDeleteModalOpen,
    deletingLesson,
    isDeleting,
    regions,
    lessonVariants,
    variantsLoading,
    isVariantModalOpen,
    isCreateVariantModalOpen,
    variantForm,
    editingVariantId,
    quillModules,
    quillEditModules,
    quillFormats,
    quillConfig,
    handleLanguageChange,
    handleStageChange,
    handlePageChange,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleSubmitCreate,
    handleViewClick,
    handleCloseViewModal,
    handleOpenEditModal,
    handleCloseEditModal,
    handleSubmitEdit,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleConfirmDelete,
    openVariantsModal,
    openCreateVariantModal,
    handleCloseVariantModal,
    handleCloseVariantFormModal,
    handleCancelVariantFormModal,
    handleOpenVariantEditModal,
    handleDeleteVariant,
    handleCreateVariant,
    setCreateForm,
    setEditForm,
    setVariantForm,
    fetchStages,
    dismissToast,
  } = useLessonManagement();

  const focusLanguage =
    languages.find((language) => language.id === selectedLanguageId) ?? null;
  const hasLanguage = Boolean(selectedLanguageId);
  const hasStages = filterStages.length > 0;
  const showEmpty =
    hasLanguage &&
    !lessonsLoading &&
    !filterStagesLoading &&
    totalLessons === 0 &&
    !filterStageId;
  const showFilteredEmpty =
    hasLanguage &&
    !lessonsLoading &&
    !filterStagesLoading &&
    lessons.length === 0 &&
    Boolean(filterStageId);
  const canCreate =
    Boolean(selectedLanguageId) &&
    hasAnyPermissionForLanguage(selectedLanguageId);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="xl" aria-label="Cargando idiomas..." />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Lecciones
              {focusLanguage ? (
                <span className="font-semibold text-gray-500 dark:text-gray-400">
                  {" "}
                  · {focusLanguage.name}
                </span>
              ) : null}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
              Las lecciones son el contenido de aprendizaje y se organizan
              dentro de una etapa.
            </p>
          </div>
          {hasLanguage && totalLessons > 0 && canCreate && (
            <Button
              onClick={handleOpenCreateModal}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <HiPlus className="mr-2 size-4" />
              Nueva lección
            </Button>
          )}
        </div>

        <LanguageChipPicker
          languages={languages}
          selectedLanguageId={selectedLanguageId || null}
          onSelect={handleLanguageChange}
        />

        {error && (
          <Alert color="failure" icon={HiExclamationCircle}>
            <span className="font-medium">Error!</span> {error}
          </Alert>
        )}

        {!hasLanguage && (
          <Alert color="warning" icon={HiExclamationCircle}>
            Selecciona un lenguaje para gestionar sus lecciones.
          </Alert>
        )}

        {hasLanguage && (
          <LessonStageFilter
            stages={filterStages}
            selectedStageId={filterStageId}
            loading={filterStagesLoading}
            onSelect={handleStageChange}
          />
        )}

        {showEmpty && (
          <LessonEmptyState
            languageName={focusLanguage?.name}
            hasStages={hasStages}
            canCreate={canCreate}
            onCreate={handleOpenCreateModal}
            onGoToStages={() => navigate("/admin/stages")}
          />
        )}

        {showFilteredEmpty && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-8 text-center dark:border-gray-600 dark:bg-gray-800">
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              No hay lecciones en esta etapa
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Prueba otra etapa o crea una lección para la seleccionada.
            </p>
            {canCreate && (
              <Button
                color="blue"
                className="mt-5"
                onClick={handleOpenCreateModal}
              >
                <HiPlus className="mr-2 size-4" />
                Crear lección
              </Button>
            )}
          </div>
        )}

        {hasLanguage && !lessonsLoading && lessons.length > 0 && (
          <>
            <Alert color="info">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  Siguiente paso: graba señas en Sign Studio (el quiz es la
                  alternativa sin cámara).
                </span>
                <Button
                  size="xs"
                  color="blue"
                  onClick={() => navigate("/admin/sign-studio")}
                >
                  Ir a Sign Studio
                  <HiArrowRight className="ml-1 size-3.5" />
                </Button>
              </div>
            </Alert>

            <LessonListTable
              selectedLanguageId={selectedLanguageId}
              lessons={lessons}
              lessonsLoading={lessonsLoading}
              viewLoading={viewLoading}
              editLoading={editLoading}
              isDeleting={isDeleting}
              currentPage={currentPage}
              totalPages={totalPages}
              totalLessons={totalLessons}
              hasAnyPermissionForLanguage={hasAnyPermissionForLanguage}
              hasLanguagePermission={hasLanguagePermission}
              formatDate={formatDateShort}
              onViewClick={handleViewClick}
              onOpenEditModal={handleOpenEditModal}
              onOpenVariantsModal={openVariantsModal}
              onOpenDeleteModal={handleOpenDeleteModal}
              onPageChange={handlePageChange}
              navigate={navigate}
            />
          </>
        )}

        {hasLanguage && lessonsLoading && (
          <div className="flex h-32 items-center justify-center">
            <Spinner size="lg" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Cargando lecciones...
            </span>
          </div>
        )}
      </div>

      <CreateLessonFormModal
        mode="create"
        show={isCreateModalOpen}
        loading={createLoading}
        form={createForm}
        languages={languages}
        stages={stages}
        stagesLoading={stagesLoading}
        quillConfig={quillConfig}
        onClose={handleCloseCreateModal}
        onSubmit={handleSubmitCreate}
        onFormChange={setCreateForm}
        onLanguageChange={fetchStages}
      />

      <LessonViewModal
        show={isViewModalOpen}
        viewLoading={viewLoading}
        selectedLesson={selectedLesson}
        quillModules={quillModules}
        quillFormats={quillFormats}
        onClose={handleCloseViewModal}
      />

      <EditLessonFormModal
        mode="edit"
        show={isEditModalOpen}
        loading={editLoading}
        form={editForm}
        languages={languages}
        stages={stages}
        stagesLoading={stagesLoading}
        quillConfig={quillConfig}
        onClose={handleCloseEditModal}
        onSubmit={handleSubmitEdit}
        onFormChange={setEditForm}
        onLanguageChange={fetchStages}
      />

      <LessonDeleteModal
        show={isDeleteModalOpen}
        deletingLesson={deletingLesson}
        isDeleting={isDeleting}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
      />

      <VariantListModal
        show={isVariantModalOpen}
        variantsLoading={variantsLoading}
        lessonVariants={lessonVariants}
        selectedLanguageId={selectedLanguageId}
        hasLanguagePermission={hasLanguagePermission}
        hasRegionPermission={hasRegionPermission}
        onClose={handleCloseVariantModal}
        onOpenCreateVariantModal={openCreateVariantModal}
        onOpenVariantEditModal={handleOpenVariantEditModal}
        onDeleteVariant={handleDeleteVariant}
      />

      <VariantFormModal
        show={isCreateVariantModalOpen}
        createLoading={createLoading}
        editingVariantId={editingVariantId}
        variantForm={variantForm}
        regions={regions}
        lessonVariants={lessonVariants}
        selectedLanguageId={selectedLanguageId}
        quillEditModules={quillEditModules}
        quillFormats={quillFormats}
        hasLanguagePermission={hasLanguagePermission}
        hasRegionPermission={hasRegionPermission}
        onClose={handleCloseVariantFormModal}
        onCancel={handleCancelVariantFormModal}
        onSubmit={handleCreateVariant}
        onFormChange={setVariantForm}
      />

      <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex flex-col gap-2">
        {toasts.map((t: ToastMessage) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast>
              <div
                className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${
                  t.type === "success"
                    ? "bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200"
                    : "bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200"
                }`}
              >
                {t.type === "success" ? (
                  <HiCheck className="size-5" />
                ) : (
                  <HiX className="size-5" />
                )}
              </div>
              <div className="ml-3 text-sm font-normal">{t.message}</div>
              <ToastToggle onClick={() => dismissToast(t.id)} />
            </Toast>
          </div>
        ))}
      </div>
    </>
  );
}
