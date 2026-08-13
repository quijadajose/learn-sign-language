import { Button, Alert, Spinner } from "flowbite-react";
import { HiPlus, HiExclamationCircle } from "react-icons/hi";
import QuizVariantFormModal from "./QuizVariantFormModal";
import QuizVariantTable from "./QuizVariantTable";
import { useQuizVariantManagement } from "./useQuizVariantManagement";

export default function QuizVariantManagement() {
  const {
    quizVariants,
    lessonVariants,
    loading,
    error,
    showCreateModal,
    selectedLessonVariantId,
    questions,
    creating,
    uploadingImage,
    loadingQuestions,
    editingQuizVariantId,
    closeModal,
    handleSaveQuizVariant,
    handleOpenEditModal,
    handleDeleteQuizVariant,
    addQuestion,
    updateQuestion,
    updateOption,
    setCorrectOption,
    removeQuestion,
    addOption,
    removeOption,
    handleImageUpload,
    handleLessonVariantChange,
    openCreateModal,
    canEditVariant,
    canSelectLessonVariant,
  } = useQuizVariantManagement();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestión de Variantes de Quizzes
        </h2>
        <Button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <HiPlus className="mr-2 size-4" />
          Crear Variante de Quiz
        </Button>
      </div>

      {error && (
        <Alert color="failure" icon={HiExclamationCircle}>
          {error}
        </Alert>
      )}

      <QuizVariantTable
        quizVariants={quizVariants}
        canEditVariant={canEditVariant}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteQuizVariant}
      />

      <QuizVariantFormModal
        show={showCreateModal}
        editingQuizVariantId={editingQuizVariantId}
        selectedLessonVariantId={selectedLessonVariantId}
        questions={questions}
        creating={creating}
        uploadingImage={uploadingImage}
        loadingQuestions={loadingQuestions}
        lessonVariants={lessonVariants}
        canSelectLessonVariant={canSelectLessonVariant}
        onClose={closeModal}
        onSubmit={handleSaveQuizVariant}
        onLessonVariantChange={handleLessonVariantChange}
        onAddQuestion={addQuestion}
        onRemoveQuestion={removeQuestion}
        onUpdateQuestion={updateQuestion}
        onAddOption={addOption}
        onRemoveOption={removeOption}
        onUpdateOption={updateOption}
        onSetCorrectOption={setCorrectOption}
        onImageUpload={handleImageUpload}
      />
    </div>
  );
}
