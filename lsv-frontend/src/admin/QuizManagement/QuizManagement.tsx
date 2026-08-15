import { useNavigate } from "react-router-dom";
import { Button, Alert, Spinner, Tabs, TabItem } from "flowbite-react";
import {
  HiPlus,
  HiArrowLeft,
  HiExclamationCircle,
  HiVideoCamera,
} from "react-icons/hi";
import QuizVariantManagement from "../QuizVariantManagement";
import QuizFormModal from "./QuizFormModal";
import QuizList from "./QuizList";
import { useQuizManagement } from "./useQuizManagement";

export default function QuizManagement() {
  const navigate = useNavigate();
  const {
    lessonId,
    quizzes,
    loading,
    error,
    showCreateModal,
    editingQuiz,
    submitting,
    uploadingImage,
    newQuestions,
    closeModal,
    handleCreateQuiz,
    handleEditQuiz,
    handleDeleteQuiz,
    addQuestion,
    removeQuestion,
    updateQuestion,
    addOption,
    removeOption,
    updateOption,
    setCorrectOption,
    handleImageUpload,
    handleSubmitQuiz,
  } = useQuizManagement();

  const handleGoBack = () => {
    navigate("/admin/lessons");
  };

  const handleGoToSignStudio = () => {
    const params = new URLSearchParams();
    if (lessonId) params.set("lessonId", lessonId);
    navigate(`/admin/sign-studio?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl p-6">
        <div className="text-center">
          <Spinner size="xl" aria-label="Cargando quizzes..." />
          <p aria-hidden="true" className="mt-4 text-gray-600 dark:text-gray-400">
            Cargando quizzes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button color="light" onClick={handleGoBack} className="mb-4">
            <HiArrowLeft className="mr-2 size-4" />
            Volver a Lecciones
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quizzes
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
            Fallback sin cámara: el estudiante responde con imágenes o video.
            Para grabar señas con cámara usa Sign Studio.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button color="light" onClick={handleGoToSignStudio}>
            <HiVideoCamera className="mr-2 size-4" />
            Grabar señas
          </Button>
          <Button
            color="blue"
            onClick={handleCreateQuiz}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <HiPlus className="mr-2 size-4" />
            Crear quiz
          </Button>
        </div>
      </div>

      <Alert color="info">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>
            ¿Quieres entrenar o grabar señas de esta lección? Ve a Sign Studio.
          </span>
          <Button size="xs" color="blue" onClick={handleGoToSignStudio}>
            Ir a Sign Studio
            <HiVideoCamera className="ml-1 size-3.5" />
          </Button>
        </div>
      </Alert>

      {error && (
        <Alert color="failure" icon={HiExclamationCircle}>
          {error}
        </Alert>
      )}

      <Tabs>
        <TabItem title="Quizzes principales" active>
          <QuizList
            quizzes={quizzes}
            onCreateQuiz={handleCreateQuiz}
            onEditQuiz={handleEditQuiz}
            onDeleteQuiz={handleDeleteQuiz}
          />
        </TabItem>
        <TabItem title="Variantes regionales">
          <QuizVariantManagement />
        </TabItem>
      </Tabs>

      <QuizFormModal
        show={showCreateModal}
        editingQuiz={editingQuiz}
        newQuestions={newQuestions}
        submitting={submitting}
        uploadingImage={uploadingImage}
        onClose={closeModal}
        onSubmit={handleSubmitQuiz}
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
