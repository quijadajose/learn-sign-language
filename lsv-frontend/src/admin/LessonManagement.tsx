import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BACKEND_BASE_URL } from "../config";
import {
  Button,
  Select,
  Spinner,
  Alert,
  Modal,
  TextInput,
  Textarea,
  Toast,
} from "flowbite-react";
import {
  HiEye,
  HiExclamationCircle,
  HiPencilAlt,
  HiCheck,
  HiX,
  HiTrash,
  HiPlus,
  HiAcademicCap,
} from "react-icons/hi";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Editor from "./Editor";
import "../styles/quill-flowbite.css";

interface Language {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Lesson {
  id: string;
  name: string;
  description: string;
  languageId: string;
  languageName: string;
  difficulty: string;
  estimatedDuration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LessonDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  content: string;
  stage?: StageItem;
}

interface StageItem {
  id: string;
  name: string;
  description: string;
}

interface StagesResponse {
  data: StageItem[];
  total: number;
  page: number;
  pageSize: number;
}

type ToastMessage = { id: number; type: "success" | "error"; message: string };

interface LanguagesResponse {
  data: Language[];
  total: number;
  page: number;
  pageSize: number;
}

interface LessonsResponse {
  data: Lesson[];
  total: number;
  page: number;
  pageSize: number;
}

interface QuizOption {
  id?: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id?: string;
  text: string;
  options: QuizOption[];
}

interface ExistingQuiz {
  id: string;
  questions: QuizQuestion[];
}

interface LessonWithQuizzes {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  content: string;
  quizzes: ExistingQuiz[];
}

export default function LessonManagement() {
  const navigate = useNavigate();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLessons, setTotalLessons] = useState(0);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonDetail | null>(
    null,
  );
  const [viewLoading, setViewLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((prev: ToastMessage[]) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev: ToastMessage[]) =>
        prev.filter((t: ToastMessage) => t.id !== id),
      );
    }, 3500);
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [stagesLoading, setStagesLoading] = useState(false);
  const [stages, setStages] = useState<StageItem[]>([]);
  const [editLessonId, setEditLessonId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    content: "",
    languageId: "",
    stageId: "",
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    content: "",
    languageId: "",
    stageId: "",
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedLessonForQuiz, setSelectedLessonForQuiz] = useState<Lesson | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [existingQuizzes, setExistingQuizzes] = useState<ExistingQuiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  const fetchLanguages = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("auth");

      const response = await fetch(
        `${BACKEND_BASE_URL}/languages?page=1&limit=100&orderBy=name&sortOrder=ASC`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message || `Error al cargar idiomas (${response.status})`;
        throw new Error(errorMessage);
      }

      const data: LanguagesResponse = await response.json();
      setLanguages(data.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cargar idiomas";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessonsByLanguage = async (
    languageId: string,
    page: number = 1,
  ) => {
    if (!languageId) return;

    try {
      setLessonsLoading(true);
      setError(null);
      const token = localStorage.getItem("auth");

      const response = await fetch(
        `${BACKEND_BASE_URL}/lesson/by-language/${languageId}?page=${page}&limit=100&orderBy=name&sortOrder=ASC`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message || `Error al cargar lecciones (${response.status})`;
        throw new Error(errorMessage);
      }

      const data: LessonsResponse = await response.json();
      setLessons(data.data);
      setTotalPages(Math.ceil(data.total / data.pageSize));
      setCurrentPage(data.page);
      setTotalLessons(data.total);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cargar lecciones";
      setError(errorMessage);
    } finally {
      setLessonsLoading(false);
    }
  };

  const fetchLessonDetail = async (lessonId: string) => {
    try {
      setViewLoading(true);
      setError(null);
      const token = localStorage.getItem("auth");

      const response = await fetch(`${BACKEND_BASE_URL}/lesson/${lessonId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          `Error al cargar detalles de la lección (${response.status})`;
        throw new Error(errorMessage);
      }

      const lessonDetail: LessonDetail = await response.json();
      setSelectedLesson(lessonDetail);
      setIsViewModalOpen(true);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Error al cargar detalles de la lección";
      setError(errorMessage);
    } finally {
      setViewLoading(false);
    }
  };

  const fetchLessonForEdit = async (lessonId: string) => {
    try {
      setEditLoading(true);
      setError(null);
      const token = localStorage.getItem("auth");

      const response = await fetch(`${BACKEND_BASE_URL}/lesson/${lessonId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message || `Error al cargar lección (${response.status})`;
        throw new Error(errorMessage);
      }

      const lessonDetail: LessonDetail = await response.json();
      setEditForm((prev) => ({
        ...prev,
        name: lessonDetail.name,
        description: lessonDetail.description,
        content: lessonDetail.content,
        stageId: lessonDetail.stage?.id || prev.stageId,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cargar lección";
      setError(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  const fetchStages = async (languageId: string) => {
    if (!languageId) return;
    try {
      setStagesLoading(true);
      setError(null);
      const token = localStorage.getItem("auth");

      const response = await fetch(
        `${BACKEND_BASE_URL}/stage/${languageId}?page=1&limit=5&orderBy=name&sortOrder=ASC`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message || `Error al cargar etapas (${response.status})`;
        throw new Error(errorMessage);
      }

      const data: StagesResponse = await response.json();
      setStages(data.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cargar etapas";
      setError(errorMessage);
    } finally {
      setStagesLoading(false);
    }
  };

  const handleOpenEditModal = (lesson: Lesson) => {
    setIsEditModalOpen(true);
    setEditLessonId(lesson.id);
    const langId = lesson.languageId || selectedLanguageId;
    setEditForm({
      name: lesson.name,
      description: lesson.description,
      content: "",
      languageId: langId,
      stageId: "",
    });
    fetchLessonForEdit(lesson.id);
    fetchStages(langId);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditLessonId(null);
    setStages([]);
    setEditForm({
      name: "",
      description: "",
      content: "",
      languageId: "",
      stageId: "",
    });
  };

  const handleOpenDeleteModal = (lesson: Lesson) => {
    setDeletingLesson(lesson);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setDeletingLesson(null);
  };

  const fetchExistingQuizzes = async (lessonId: string) => {
    try {
      setLoadingQuizzes(true);
      const token = localStorage.getItem("auth");

      const response = await fetch(`${BACKEND_BASE_URL}/lesson/${lessonId}/with-quizzes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Error al cargar quizzes (${response.status})`;
        throw new Error(errorMessage);
      }

      const lessonWithQuizzes: LessonWithQuizzes = await response.json();
      setExistingQuizzes(lessonWithQuizzes.quizzes || []);
      
      if (lessonWithQuizzes.quizzes && lessonWithQuizzes.quizzes.length > 0) {
        setQuizQuestions(lessonWithQuizzes.quizzes[0].questions);
      } else {
        setQuizQuestions([{
          text: "",
          options: [
            { text: "", isCorrect: false },
            { text: "", isCorrect: false }
          ]
        }]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al cargar quizzes";
      addToast("error", errorMessage);
      setQuizQuestions([{
        text: "",
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false }
        ]
      }]);
    } finally {
      setLoadingQuizzes(false);
    }
  };


  const handleCloseQuizModal = () => {
    setIsQuizModalOpen(false);
    setSelectedLessonForQuiz(null);
    setQuizQuestions([]);
    setExistingQuizzes([]);
  };

  const addQuestion = () => {
    setQuizQuestions([...quizQuestions, {
      text: "",
      options: [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false }
      ]
    }]);
  };

  const removeQuestion = (index: number) => {
    if (quizQuestions.length > 1) {
      setQuizQuestions(quizQuestions.filter((_, i) => i !== index));
    }
  };

  const updateQuestion = (index: number, text: string) => {
    const updated = [...quizQuestions];
    updated[index].text = text;
    setQuizQuestions(updated);
  };

  const addOption = (questionIndex: number) => {
    const updated = [...quizQuestions];
    updated[questionIndex].options.push({ text: "", isCorrect: false });
    setQuizQuestions(updated);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...quizQuestions];
    if (updated[questionIndex].options.length > 2) {
      updated[questionIndex].options.splice(optionIndex, 1);
      setQuizQuestions(updated);
    }
  };

  const updateOption = (questionIndex: number, optionIndex: number, text: string) => {
    const updated = [...quizQuestions];
    updated[questionIndex].options[optionIndex].text = text;
    setQuizQuestions(updated);
  };

  const toggleCorrectOption = (questionIndex: number, optionIndex: number) => {
    const updated = [...quizQuestions];
    updated[questionIndex].options.forEach(option => option.isCorrect = false);
    updated[questionIndex].options[optionIndex].isCorrect = true;
    setQuizQuestions(updated);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const token = localStorage.getItem("auth");
    const formData = new FormData();
    formData.append("id", crypto.randomUUID());
    formData.append("format", file.type.split('/')[1] || 'png');
    formData.append("file", file);

    const response = await fetch(`${BACKEND_BASE_URL}/images/upload/quiz`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Error al subir la imagen");
    }

    const urls = await response.json();
    return urls[0];
  };

  const handleImageUpload = async (questionIndex: number, optionIndex: number, file: File) => {
    try {
      updateOption(questionIndex, optionIndex, "Subiendo imagen...");
      
      const imageUrl = await uploadImage(file);
      updateOption(questionIndex, optionIndex, imageUrl);
      addToast("success", "Imagen subida correctamente");
    } catch (error) {
      updateOption(questionIndex, optionIndex, "");
      addToast("error", "Error al subir la imagen");
    }
  };

  const deleteExistingQuiz = async (quizId: string) => {
    try {
      const token = localStorage.getItem("auth");
      const response = await fetch(`${BACKEND_BASE_URL}/quiz/${quizId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Error al eliminar quiz (${response.status})`;
        throw new Error(errorMessage);
      }

      addToast("success", "Quiz eliminado correctamente");
      if (selectedLessonForQuiz) {
        fetchExistingQuizzes(selectedLessonForQuiz.id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar quiz";
      addToast("error", errorMessage);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!selectedLessonForQuiz) return;

    const isValid = quizQuestions.every(question => 
      question.text.trim() !== "" && 
      question.options.some(option => option.isCorrect) &&
      question.options.every(option => option.text.trim() !== "")
    );

    if (!isValid) {
      addToast("error", "Completa todas las preguntas y asegúrate de que cada una tenga al menos una respuesta correcta");
      return;
    }

    try {
      setQuizLoading(true);
      const token = localStorage.getItem("auth");

      for (const quiz of existingQuizzes) {
        await deleteExistingQuiz(quiz.id);
      }

      const cleanQuestions = quizQuestions.map(question => ({
        text: question.text,
        options: question.options.map(option => ({
          text: option.text,
          isCorrect: option.isCorrect
        }))
      }));

      const response = await fetch(`${BACKEND_BASE_URL}/quiz`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lessonId: selectedLessonForQuiz.id,
          questions: cleanQuestions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Error al crear quiz (${response.status})`;
        throw new Error(errorMessage);
      }

      addToast("success", "Quiz actualizado correctamente");
      handleCloseQuizModal();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al crear quiz";
      addToast("error", errorMessage);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingLesson) return;
    try {
      setIsDeleting(true);
      setError(null);
      const token = localStorage.getItem("auth");
      const response = await fetch(
        `${BACKEND_BASE_URL}/lesson/${deletingLesson.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message || `Error al eliminar lección (${response.status})`;
        throw new Error(errorMessage);
      }

      addToast("success", "Lección eliminada correctamente");
      setIsDeleteModalOpen(false);
      setDeletingLesson(null);
      if (selectedLanguageId) {
        await fetchLessonsByLanguage(selectedLanguageId, currentPage);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al eliminar lección";
      setError(errorMessage);
      addToast("error", errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!editLessonId) return;
    if (
      !editForm.name ||
      !editForm.description ||
      !editForm.languageId ||
      !editForm.stageId
    ) {
      setError("Completa los campos requeridos");
      return;
    }
    try {
      setEditLoading(true);
      setError(null);
      const token = localStorage.getItem("auth");
      const response = await fetch(
        `${BACKEND_BASE_URL}/lesson/${editLessonId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: editForm.name,
            description: editForm.description,
            content: editForm.content,
            languageId: editForm.languageId,
            stageId: editForm.stageId,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          `Error al actualizar lección (${response.status})`;
        throw new Error(errorMessage);
      }

      if (editForm.languageId) {
        await fetchLessonsByLanguage(editForm.languageId, 1);
      }
      handleCloseEditModal();
      addToast("success", "Lección actualizada correctamente");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al actualizar lección";
      setError(errorMessage);
      addToast("error", errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  const handleViewClick = (lessonId: string) => {
    fetchLessonDetail(lessonId);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedLesson(null);
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (selectedLanguageId) {
      fetchLessonsByLanguage(selectedLanguageId, 1);
    } else {
      setLessons([]);
      setTotalPages(1);
      setCurrentPage(1);
      setTotalLessons(0);
    }
  }, [selectedLanguageId]);

  const handleLanguageChange = (languageId: string) => {
    setSelectedLanguageId(languageId);
  };

  const handlePageChange = (page: number) => {
    if (selectedLanguageId) {
      fetchLessonsByLanguage(selectedLanguageId, page);
    }
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
    const langId = selectedLanguageId || "";
    setCreateForm({
      name: "",
      description: "",
      content: "",
      languageId: langId,
      stageId: "",
    });
    if (langId) {
      fetchStages(langId);
    }
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateForm({
      name: "",
      description: "",
      content: "",
      languageId: "",
      stageId: "",
    });
  };

  const handleSubmitCreate = async () => {
    if (
      !createForm.name ||
      !createForm.description ||
      !createForm.languageId ||
      !createForm.stageId
    ) {
      setError("Completa los campos requeridos");
      return;
    }
    try {
      setCreateLoading(true);
      setError(null);
      const token = localStorage.getItem("auth");
      const response = await fetch(`${BACKEND_BASE_URL}/lesson`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: createForm.name,
          description: createForm.description,
          content: createForm.content,
          languageId: createForm.languageId,
          stageId: createForm.stageId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message || `Error al crear lección (${response.status})`;
        throw new Error(errorMessage);
      }

      if (createForm.languageId) {
        await fetchLessonsByLanguage(createForm.languageId, 1);
        setSelectedLanguageId(createForm.languageId);
      }
      handleCloseCreateModal();
      addToast("success", "Lección creada correctamente");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al crear lección";
      setError(errorMessage);
      addToast("error", errorMessage);
    } finally {
      setCreateLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const quillModules = {
    toolbar: false,
  };
  const quillEditModules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        ["blockquote", "code-block"],
        ["link", "image", "video"],
        [{ align: [] }],
        ["clean"],
      ],
    },
  };

  const quillFormats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "image",
  ];

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
      <div className="mx-auto w-full max-w-6xl p-2">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
              Gestión de Lecciones
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Administra las lecciones por idioma
            </p>
          </div>
        </div>

        {error && (
          <Alert color="failure" icon={HiExclamationCircle} className="mb-4">
            <span className="font-medium">Error!</span> {error}
          </Alert>
        )}

        <div className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Selección de Idioma
            </h2>
          </div>

          <div className="p-2">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="language-select"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Seleccionar Idioma
                </label>
                <Select
                  id="language-select"
                  value={selectedLanguageId}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Selecciona un idioma</option>
                  {languages.map((language) => (
                    <option key={language.id} value={language.id}>
                      {language.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </div>

        {selectedLanguageId && (
          <div className="mt-6 overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Lista de Lecciones
                </h2>
                <Button color="blue" onClick={handleOpenCreateModal}>
                  <HiPlus className="mr-2 size-5" />
                  Agregar lección
                </Button>
              </div>
            </div>

            {lessonsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Spinner size="lg" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">
                  Cargando lecciones...
                </span>
              </div>
            ) : lessons.length === 0 ? (
              <div className="py-8 text-center">
                <span className="text-lg text-gray-500 dark:text-gray-400">
                  No se encontraron lecciones para este idioma
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                        Descripción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                        Fecha Creación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                    {lessons.map((lesson) => (
                      <tr
                        key={lesson.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {lesson.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs text-sm text-gray-500 dark:text-gray-400">
                            <div
                              className="truncate"
                              title={lesson.description}
                            >
                              {lesson.description}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(lesson.createdAt)}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              color="light"
                              onClick={() => handleViewClick(lesson.id)}
                              disabled={viewLoading}
                            >
                              <div className="flex items-center">
                                <HiEye className="mr-1 size-4" />
                                Ver
                              </div>
                            </Button>
                            <Button
                              size="sm"
                              color="info"
                              onClick={() => handleOpenEditModal(lesson)}
                              disabled={editLoading}
                            >
                              <div className="flex items-center">
                                <HiPencilAlt className="mr-1 size-4" />
                                Editar
                              </div>
                            </Button>
                            <Button
                              size="sm"
                              color="purple"
                              onClick={() => navigate(`/quiz/${lesson.id}`)}
                            >
                              <div className="flex items-center">
                                <HiAcademicCap className="mr-1 size-4" />
                                Quiz
                              </div>
                            </Button>
                            <Button
                              size="sm"
                              color="failure"
                              onClick={() => handleOpenDeleteModal(lesson)}
                              disabled={isDeleting}
                            >
                              <div className="flex items-center">
                                <HiTrash className="mr-1 size-4" />
                                Eliminar
                              </div>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selectedLanguageId && totalPages > 1 && (
                  <div className="flex items-center justify-between p-2">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Mostrando {lessons.length} de {totalLessons} lecciones
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        color="light"
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        Anterior
                      </Button>
                      <span className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                        Página {currentPage} de {totalPages}
                      </span>
                      <Button
                        size="sm"
                        color="light"
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        show={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        size="5xl"
      >
        <Modal.Header>
          <div className="flex w-full items-center justify-between">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Agregar Lección
            </h3>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre
              </label>
              <TextInput
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Nombre de la lección"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Descripción
              </label>
              <Textarea
                rows={3}
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Descripción de la lección"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contenido
              </label>
              <div className="quill-flowbite rounded-md bg-gray-50 dark:bg-gray-700">
                <ReactQuill
                  value={createForm.content}
                  onChange={(value) =>
                    setCreateForm((p) => ({ ...p, content: value }))
                  }
                  modules={quillEditModules}
                  formats={quillFormats}
                  theme="snow"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Idioma
                </label>
                <Select
                  value={createForm.languageId}
                  onChange={(e) => {
                    const newLang = e.target.value;
                    setCreateForm((p) => ({
                      ...p,
                      languageId: newLang,
                      stageId: "",
                    }));
                    fetchStages(newLang);
                  }}
                >
                  <option value="">Selecciona un idioma</option>
                  {languages.map((language) => (
                    <option key={language.id} value={language.id}>
                      {language.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Etapa
                </label>
                <Select
                  value={createForm.stageId}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, stageId: e.target.value }))
                  }
                  disabled={!createForm.languageId || stagesLoading}
                >
                  <option value="">Selecciona una etapa</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="flex w-full justify-end gap-2">
            <Button
              color="light"
              onClick={handleCloseCreateModal}
              disabled={createLoading}
            >
              Cancelar
            </Button>
            <Button
              color="success"
              onClick={handleSubmitCreate}
              isProcessing={createLoading}
            >
              Crear Lección
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      <Modal show={isViewModalOpen} onClose={handleCloseViewModal} size="4xl">
        <Modal.Header>
          <div className="flex w-full items-center justify-between">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Detalles de la Lección
            </h3>
          </div>
        </Modal.Header>
        <Modal.Body>
          {viewLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner size="lg" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Cargando detalles...
              </span>
            </div>
          ) : selectedLesson ? (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre
                </label>
                <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
                  {selectedLesson.name}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descripción
                </label>
                <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
                  {selectedLesson.description}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contenido
                </label>
                <div className="quill-flowbite rounded-md bg-gray-50 dark:bg-gray-700">
                  <ReactQuill
                    value={selectedLesson.content}
                    readOnly={true}
                    modules={quillModules}
                    formats={quillFormats}
                    theme="snow"
                  />
                </div>
              </div>

              {selectedLesson.stage && (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Etapa
                    </label>
                    <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
                      {selectedLesson.stage.name}
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Descripción de la etapa
                    </label>
                    <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
                      {selectedLesson.stage.description}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fecha de Creación
                  </label>
                  <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
                    {formatDate(selectedLesson.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Última Actualización
                  </label>
                  <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
                    {formatDate(selectedLesson.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <span className="text-gray-500 dark:text-gray-400">
                No se pudieron cargar los detalles de la lección
              </span>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={isEditModalOpen} onClose={handleCloseEditModal} size="5xl">
        <Modal.Header>
          <div className="flex w-full items-center justify-between">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Editar Lección
            </h3>
          </div>
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre
              </label>
              <TextInput
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Nombre de la lección"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Descripción
              </label>
              <Textarea
                rows={3}
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Descripción de la lección"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contenido
              </label>
              <div className="quill-flowbite rounded-md bg-gray-50 dark:bg-gray-700">
                <Editor
                  value={editForm.content}
                  onChange={(changes) =>
                    setEditForm((p) => ({ ...p, content: changes.html }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Idioma
                </label>
                <Select
                  value={editForm.languageId}
                  onChange={(e) => {
                    const newLang = e.target.value;
                    setEditForm((p) => ({
                      ...p,
                      languageId: newLang,
                      stageId: "",
                    }));
                    fetchStages(newLang);
                  }}
                >
                  <option value="">Selecciona un idioma</option>
                  {languages.map((language) => (
                    <option key={language.id} value={language.id}>
                      {language.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Etapa
                </label>
                <Select
                  value={editForm.stageId}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, stageId: e.target.value }))
                  }
                  disabled={!editForm.languageId || stagesLoading}
                >
                  <option value="">Selecciona una etapa</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <div className="flex w-full justify-end gap-2">
            <Button
              color="light"
              onClick={handleCloseEditModal}
              disabled={editLoading}
            >
              Cancelar
            </Button>
            <Button
              color="success"
              onClick={handleSubmitEdit}
              isProcessing={editLoading}
            >
              Guardar Cambios
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      <Modal
        show={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        popup
        size="md"
      >
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <HiExclamationCircle className="mx-auto mb-4 size-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que quieres eliminar la lección{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                "{deletingLesson?.name}"
              </span>
              ?
            </h3>
            <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              lección y sus datos asociados.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                color="gray"
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                color="failure"
                onClick={handleConfirmDelete}
                isProcessing={isDeleting}
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Sí, eliminar"}
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      <Modal show={isQuizModalOpen} onClose={handleCloseQuizModal} size="6xl">
        <Modal.Header>
          <div className="flex w-full items-center justify-between">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Crear Quiz para: {selectedLessonForQuiz?.name}
            </h3>
          </div>
        </Modal.Header>
        <Modal.Body>
          {loadingQuizzes ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner size="lg" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Cargando quizzes existentes...
              </span>
            </div>
          ) : (
            <div className="space-y-6">
              {existingQuizzes.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Quizzes Existentes ({existingQuizzes.length})
                  </h4>
                  <div className="space-y-3">
                    {existingQuizzes.map((quiz, index) => (
                      <div key={quiz.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded p-3">
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            Quiz {index + 1}
                          </span>
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                            ({quiz.questions.length} pregunta{quiz.questions.length !== 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            color="light"
                            onClick={() => setQuizQuestions(quiz.questions)}
                          >
                            Cargar
                          </Button>
                          <Button
                            size="sm"
                            color="failure"
                            onClick={() => deleteExistingQuiz(quiz.id)}
                          >
                            <HiTrash className="mr-1 size-4" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {existingQuizzes.length > 0 ? 'Editar Quiz' : 'Crear Nuevo Quiz'}
                </h4>
                <div className="max-h-96 overflow-y-auto space-y-6">
            {quizQuestions.map((question, questionIndex) => (
              <div key={questionIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                    Pregunta {questionIndex + 1}
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      color="light"
                      onClick={() => addQuestion()}
                    >
                      <HiPlus className="mr-1 size-4" />
                      Agregar Pregunta
                    </Button>
                    {quizQuestions.length > 1 && (
                      <Button
                        size="sm"
                        color="failure"
                        onClick={() => removeQuestion(questionIndex)}
                      >
                        <HiX className="mr-1 size-4" />
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Texto de la pregunta
                  </label>
                  <Textarea
                    rows={2}
                    value={question.text}
                    onChange={(e) => updateQuestion(questionIndex, e.target.value)}
                    placeholder="Escribe tu pregunta aquí..."
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Opciones de respuesta
                    </label>
                    <Button
                      size="sm"
                      color="light"
                      onClick={() => addOption(questionIndex)}
                    >
                      <HiPlus className="mr-1 size-4" />
                      Agregar Opción
                    </Button>
                  </div>

                  {question.options.map((option, optionIndex) => {
                    const isImageUrl = option.text && (
                      option.text.startsWith('http') || 
                      option.text.startsWith('/images/') ||
                      option.text.includes('.jpg') || 
                      option.text.includes('.jpeg') || 
                      option.text.includes('.png') || 
                      option.text.includes('.gif') || 
                      option.text.includes('.webp')
                    ) && !option.text.includes('Subiendo imagen');
                    
                    return (
                      <div key={optionIndex} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`question-${questionIndex}`}
                          checked={option.isCorrect}
                          onChange={() => toggleCorrectOption(questionIndex, optionIndex)}
                          className="size-4 text-blue-600"
                        />
                        <div className="flex-1">
                          {isImageUrl ? (
                            <div className="space-y-2">
                              <div className="relative">
                                <img 
                                  src={`${BACKEND_BASE_URL}${option.text}`} 
                                  alt="Preview" 
                                  className="w-32 h-20 object-cover rounded border"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    const textInput = target.parentElement?.nextElementSibling as HTMLInputElement;
                                    if (textInput) textInput.style.display = 'block';
                                  }}
                                />
                                <Button
                                  size="xs"
                                  color="light"
                                  className="absolute top-1 right-1"
                                  onClick={() => {
                                    const fileInput = document.getElementById(`file-${questionIndex}-${optionIndex}`) as HTMLInputElement;
                                    fileInput?.click();
                                  }}
                                >
                                  ✏️
                                </Button>
                              </div>
                              <TextInput
                                value={option.text}
                                onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                                placeholder="URL de imagen..."
                                style={{ display: 'none' }}
                              />
                            </div>
                          ) : (
                            <TextInput
                              value={option.text}
                              onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                              placeholder="Texto de la opción..."
                            />
                          )}
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageUpload(questionIndex, optionIndex, file);
                            }
                          }}
                          className="hidden"
                          id={`file-${questionIndex}-${optionIndex}`}
                        />
                        <Button 
                          size="sm" 
                          color="light"
                          onClick={() => {
                            const fileInput = document.getElementById(`file-${questionIndex}-${optionIndex}`) as HTMLInputElement;
                            fileInput?.click();
                          }}
                        >
                          📷
                        </Button>
                        {question.options.length > 2 && (
                          <Button
                            size="sm"
                            color="failure"
                            onClick={() => removeOption(questionIndex, optionIndex)}
                          >
                            <HiX className="size-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="flex w-full justify-end gap-2">
            <Button
              color="light"
              onClick={handleCloseQuizModal}
              disabled={quizLoading}
            >
              Cancelar
            </Button>
            <Button
              color="success"
              onClick={handleSubmitQuiz}
              isProcessing={quizLoading}
            >
              {existingQuizzes.length > 0 ? 'Actualizar Quiz' : 'Crear Quiz'}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>

      <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2">
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
              <Toast.Toggle
                onClick={() =>
                  setToasts((prev: ToastMessage[]) =>
                    prev.filter((x: ToastMessage) => x.id !== t.id),
                  )
                }
              />
            </Toast>
          </div>
        ))}
      </div>
    </>
  );
}
