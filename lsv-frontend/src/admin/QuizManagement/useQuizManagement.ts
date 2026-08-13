import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useToast } from "../../components/ToastProvider";
import { quizApi } from "../../services/api";
import {
  NewQuizQuestion,
  Quiz,
  QuizOption,
  QuizQuestion,
} from "./types";

const emptyQuestion = (): NewQuizQuestion => ({
  text: "",
  options: [
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ],
});

export function useQuizManagement() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const addToast = useToast();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [newQuestions, setNewQuestions] = useState<NewQuizQuestion[]>([]);

  const fetchQuizzes = useCallback(async () => {
    if (!lessonId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await quizApi.getQuizByLesson(lessonId);

      if (response.success) {
        setQuizzes(response.data || []);
      } else {
        const errorMsg = response.message || "Error al cargar los quizzes";
        setError(errorMsg);
        addToast("error", errorMsg);
      }
    } catch {
      const errorMsg = "Error de conexión al cargar los quizzes";
      setError(errorMsg);
      addToast("error", errorMsg);
    } finally {
      setLoading(false);
    }
  }, [lessonId, addToast]);

  useEffect(() => {
    if (lessonId) {
      void fetchQuizzes();
    }
  }, [lessonId, fetchQuizzes]);

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingQuiz(null);
    setNewQuestions([]);
  };

  const handleCreateQuiz = () => {
    setNewQuestions([emptyQuestion()]);
    setShowCreateModal(true);
  };

  const handleEditQuiz = async (quiz: Quiz) => {
    try {
      const response = await quizApi.getQuizForAdmin(quiz.id);

      if (response.success && response.data) {
        const fullQuiz = response.data;
        setEditingQuiz(fullQuiz);
        setNewQuestions(
          fullQuiz.questions.map((q: QuizQuestion) => ({
            text: q.text,
            options: q.options.map((o: QuizOption) => ({
              text: o.text,
              isCorrect: o.isCorrect,
            })),
          })),
        );
        setShowCreateModal(true);
      } else {
        addToast(
          "error",
          response.message || "Error al cargar los datos del quiz",
        );
      }
    } catch {
      addToast("error", "Error de conexión al cargar el quiz");
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este quiz?")) return;

    try {
      const response = await quizApi.deleteQuiz(quizId);

      if (response.success) {
        addToast("success", "Quiz eliminado correctamente");
        fetchQuizzes();
      } else {
        addToast("error", response.message || "Error al eliminar el quiz");
      }
    } catch {
      addToast("error", "Error de conexión");
    }
  };

  const addQuestion = () => {
    setNewQuestions([...newQuestions, emptyQuestion()]);
  };

  const removeQuestion = (index: number) => {
    if (newQuestions.length > 1) {
      setNewQuestions(newQuestions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, field: "text", value: string) => {
    const updated = [...newQuestions];
    updated[index][field] = value;
    setNewQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...newQuestions];
    updated[questionIndex].options.push({ text: "", isCorrect: false });
    setNewQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...newQuestions];
    if (updated[questionIndex].options.length > 2) {
      updated[questionIndex].options.splice(optionIndex, 1);
      setNewQuestions(updated);
    }
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    field: "text" | "isCorrect",
    value: string | boolean,
  ) => {
    const updated = [...newQuestions];
    updated[questionIndex].options[optionIndex] = {
      ...updated[questionIndex].options[optionIndex],
      [field]: value,
    };
    setNewQuestions(updated);
  };

  const setCorrectOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...newQuestions];
    updated[questionIndex].options.forEach((opt, idx) => {
      opt.isCorrect = idx === optionIndex;
    });
    setNewQuestions(updated);
  };

  const handleImageUpload = async (
    questionIndex: number,
    optionIndex: number,
    file: File,
  ) => {
    if (!file) return;

    const uploadKey = `${questionIndex}-${optionIndex}`;
    setUploadingImage(uploadKey);

    try {
      const imageId = crypto.randomUUID();
      const format = file.name.split(".").pop() || "png";

      const response = await quizApi.uploadQuizImage(file, imageId, format);

      if (response.success && response.data && response.data.length > 0) {
        const imageUrl = response.data[0];
        updateOption(questionIndex, optionIndex, "text", imageUrl);
        addToast("success", "Imagen cargada correctamente");
      } else {
        addToast("error", response.message || "Error al cargar la imagen");
      }
    } catch {
      addToast("error", "Error de conexión al cargar la imagen");
    } finally {
      setUploadingImage(null);
    }
  };

  const validateQuiz = () => {
    for (const question of newQuestions) {
      if (!question.text.trim()) {
        addToast("error", "Todas las preguntas deben tener texto");
        return false;
      }

      const validOptions = question.options.filter((opt) => opt.text.trim());
      if (validOptions.length < 2) {
        addToast("error", "Cada pregunta debe tener al menos 2 opciones");
        return false;
      }

      const correctOptions = validOptions.filter((opt) => opt.isCorrect);
      if (correctOptions.length === 0) {
        addToast(
          "error",
          "Cada pregunta debe tener al menos una respuesta correcta",
        );
        return false;
      }
    }
    return true;
  };

  const handleSubmitQuiz = async () => {
    if (!lessonId || !validateQuiz()) return;

    setSubmitting(true);

    try {
      const quizData = {
        lessonId,
        questions: newQuestions.map((q) => ({
          text: q.text,
          options: q.options.flatMap((opt) =>
            opt.text.trim()
              ? [{ text: opt.text, isCorrect: opt.isCorrect }]
              : [],
          ),
        })),
      };

      let response;
      if (editingQuiz) {
        response = await quizApi.updateQuiz(editingQuiz.id, quizData);
      } else {
        response = await quizApi.createQuiz(quizData);
      }

      if (response.success) {
        addToast(
          "success",
          editingQuiz
            ? "Quiz actualizado correctamente"
            : "Quiz creado correctamente",
        );
        closeModal();
        fetchQuizzes();
      } else {
        addToast(
          "error",
          response.message ||
            `Error al ${editingQuiz ? "actualizar" : "crear"} el quiz`,
        );
      }
    } catch {
      addToast("error", "Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  return {
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
  };
}
