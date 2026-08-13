import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useToast } from "../../components/ToastProvider";
import { quizVariantApi, lessonVariantApi, quizApi } from "../../services/api";
import { usePermissions } from "../../hooks/usePermissions";
import {
  emptyVariantQuestion,
  LessonVariant,
  QuizVariant,
  VariantQuestionForm,
} from "./types";

export function useQuizVariantManagement() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [quizVariants, setQuizVariants] = useState<QuizVariant[]>([]);
  const [lessonVariants, setLessonVariants] = useState<LessonVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLessonVariantId, setSelectedLessonVariantId] =
    useState<string>("");
  const [questions, setQuestions] = useState<VariantQuestionForm[]>([]);
  const [creating, setCreating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [editingQuizVariantId, setEditingQuizVariantId] = useState<
    string | null
  >(null);
  const addToast = useToast();
  const { isAdmin, hasRegionPermission } = usePermissions();

  const loadData = useCallback(async () => {
    if (!lessonId) return;

    try {
      setLoading(true);
      setError(null);
      const lessonResponse = await lessonVariantApi.getLessonVariants(lessonId);

      if (lessonResponse.success) {
        setLessonVariants(lessonResponse.data);
      } else {
        throw new Error(
          lessonResponse.message || "Error al cargar variantes de lección",
        );
      }

      const lessonVariantsData = lessonResponse.data || [];
      const quizResponses = await Promise.all(
        lessonVariantsData.map((lessonVariant: LessonVariant) =>
          quizVariantApi.getQuizVariants(lessonVariant.id),
        ),
      );
      const allQuizVariants = quizResponses.flatMap((quizResponse) =>
        quizResponse.success && quizResponse.data ? quizResponse.data : [],
      );
      setQuizVariants(allQuizVariants);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al cargar los datos";
      setError(errorMsg);
      addToast("error", errorMsg);
    } finally {
      setLoading(false);
    }
  }, [lessonId, addToast]);

  useEffect(() => {
    if (lessonId) {
      void loadData();
    }
  }, [lessonId, loadData]);

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingQuizVariantId(null);
    setQuestions([]);
    setSelectedLessonVariantId("");
  };

  const validateQuiz = () => {
    for (const question of questions) {
      if (!question.question.trim()) {
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

  const handleSaveQuizVariant = async () => {
    if (!selectedLessonVariantId || questions.length === 0) {
      addToast(
        "error",
        "Por favor selecciona una variante de lección y agrega al menos una pregunta",
      );
      return;
    }

    if (!validateQuiz()) {
      return;
    }

    try {
      setCreating(true);
      const data = {
        lessonVariantId: selectedLessonVariantId,
        questions: questions.map((q) => ({
          question: q.question,
          options: q.options.flatMap((opt) =>
            opt.text.trim()
              ? [{ text: opt.text, isCorrect: opt.isCorrect }]
              : [],
          ),
        })),
      };

      const response = editingQuizVariantId
        ? await quizVariantApi.updateQuizVariant(editingQuizVariantId, data)
        : await quizVariantApi.createQuizVariant(data);

      if (response.success) {
        addToast(
          "success",
          `Variante de quiz ${editingQuizVariantId ? "actualizada" : "creada"} exitosamente`,
        );
        closeModal();
        loadData();
      } else {
        addToast(
          "error",
          response.message ||
            `Error al ${editingQuizVariantId ? "actualizar" : "crear"} la variante de quiz`,
        );
      }
    } catch {
      addToast(
        "error",
        `Error al ${editingQuizVariantId ? "actualizar" : "crear"} la variante de quiz`,
      );
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEditModal = (variant: QuizVariant) => {
    setEditingQuizVariantId(variant.id);
    setSelectedLessonVariantId(variant.lessonVariant.id);
    setQuestions(
      variant.questionVariants.map((q) => ({
        question: q.question,
        options: q.optionVariants.map((o) => ({
          text: o.text,
          isCorrect: o.isCorrect,
        })),
      })),
    );
    setShowCreateModal(true);
  };

  const handleDeleteQuizVariant = async (id: string) => {
    if (
      !confirm("¿Estás seguro de que quieres eliminar esta variante de quiz?")
    ) {
      return;
    }

    try {
      const response = await quizVariantApi.deleteQuizVariant(id);
      if (response.success) {
        addToast("success", "Variante de quiz eliminada exitosamente");
        loadData();
      } else {
        addToast(
          "error",
          response.message || "Error al eliminar la variante de quiz",
        );
      }
    } catch {
      addToast("error", "Error al eliminar la variante de quiz");
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, emptyVariantQuestion()]);
  };

  const updateQuestion = (
    index: number,
    field: "question",
    value: string,
  ) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    field: "text" | "isCorrect",
    value: string | boolean,
  ) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = {
      ...newQuestions[questionIndex].options[optionIndex],
      [field]: value,
    };
    setQuestions(newQuestions);
  };

  const setCorrectOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options.forEach((opt, idx) => {
      opt.isCorrect = idx === optionIndex;
    });
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const addOption = (questionIndex: number) => {
    const updated = [...questions];
    updated[questionIndex].options.push({ text: "", isCorrect: false });
    setQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...questions];
    if (updated[questionIndex].options.length > 2) {
      updated[questionIndex].options.splice(optionIndex, 1);
      setQuestions(updated);
    }
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

  const loadBaseQuestions = async () => {
    if (!lessonId) return;

    setLoadingQuestions(true);
    try {
      const quizResponse = await quizApi.getQuizByLesson(lessonId);

      if (
        quizResponse.success &&
        quizResponse.data &&
        quizResponse.data.length > 0
      ) {
        const baseQuiz = quizResponse.data[0];

        const baseQuestions = (
          baseQuiz.questions as Array<{
            text: string;
            options: Array<{ text: string; isCorrect: boolean }>;
          }>
        ).map((q) => ({
          question: q.text,
          options: q.options.map((opt) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
          })),
        }));

        setQuestions(baseQuestions);
        addToast(
          "success",
          `Se precargaron ${baseQuestions.length} preguntas de la lección base`,
        );
      } else {
        setQuestions([emptyVariantQuestion()]);
        addToast(
          "info",
          "No hay quiz base para esta lección. Se creó una pregunta vacía.",
        );
      }
    } catch {
      addToast("error", "Error al cargar las preguntas base de la lección");
      setQuestions([emptyVariantQuestion()]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleLessonVariantChange = (variantId: string) => {
    setSelectedLessonVariantId(variantId);
    if (variantId) {
      void loadBaseQuestions();
    } else {
      setQuestions([]);
    }
  };

  const openCreateModal = () => {
    setEditingQuizVariantId(null);
    setQuestions([]);
    setSelectedLessonVariantId("");
    setShowCreateModal(true);
  };

  const canEditVariant = (variant: QuizVariant) =>
    isAdmin ||
    (variant.lessonVariant?.region?.id &&
      hasRegionPermission(variant.lessonVariant.region.id));

  const canSelectLessonVariant = (variant: LessonVariant) =>
    isAdmin || hasRegionPermission(variant.region.id);

  return {
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
  };
}
