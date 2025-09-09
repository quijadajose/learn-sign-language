import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  Alert,
  Modal,
  TextInput,
  Label,
  Textarea,
  Spinner,
  Badge,
} from "flowbite-react";
import {
  HiPlus,
  HiTrash,
  HiPencil,
  HiArrowLeft,
  HiExclamationCircle,
  HiPhotograph,
} from "react-icons/hi";
import { useToast } from "../components/ToastProvider";
import { quizApi } from "../services/api";
import { BACKEND_BASE_URL } from "../config";

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
}

interface Quiz {
  id: string;
  questions: QuizQuestion[];
  lessonId: string;
}

interface NewQuizQuestion {
  text: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
}

export default function QuizManagement() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const addToast = useToast();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  const [newQuestions, setNewQuestions] = useState<NewQuizQuestion[]>([]);

  useEffect(() => {
    if (lessonId) {
      fetchQuizzes();
    }
  }, [lessonId]);

  const fetchQuizzes = async () => {
    if (!lessonId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await quizApi.getQuizByLesson(lessonId);

      if (response.success) {
        setQuizzes(response.data || []);
      } else {
        setError(response.message || "Error al cargar los quizzes");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = () => {
    setNewQuestions([
      {
        text: "",
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      },
    ]);
    setShowCreateModal(true);
  };

  const handleEditQuiz = async (quiz: Quiz) => {
    try {
      const response = await quizApi.getQuizForAdmin(quiz.id);

      if (response.success && response.data) {
        const fullQuiz = response.data;
        setEditingQuiz(fullQuiz);
        setNewQuestions(
          fullQuiz.questions.map((q: any) => ({
            text: q.text,
            options: q.options.map((o: any) => ({
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
    } catch (err) {
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
    } catch (err) {
      addToast("error", "Error de conexión");
    }
  };

  const addQuestion = () => {
    setNewQuestions([
      ...newQuestions,
      {
        text: "",
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      },
    ]);
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
    (updated[questionIndex].options[optionIndex] as any)[field] = value;
    setNewQuestions(updated);
  };

  const isImageUrl = (text: string) => {
    return (
      text &&
      (text.startsWith("http") ||
        text.startsWith("/images/") ||
        text.includes(".jpg") ||
        text.includes(".jpeg") ||
        text.includes(".png") ||
        text.includes(".gif") ||
        text.includes(".webp"))
    );
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
    } catch (err) {
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
          options: q.options
            .filter((opt) => opt.text.trim())
            .map((opt) => ({
              text: opt.text,
              isCorrect: opt.isCorrect,
            })),
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
        setShowCreateModal(false);
        setNewQuestions([]);
        setEditingQuiz(null);
        fetchQuizzes();
      } else {
        addToast(
          "error",
          response.message ||
            `Error al ${editingQuiz ? "actualizar" : "crear"} el quiz`,
        );
      }
    } catch (err) {
      addToast("error", "Error de conexión");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate("/admin/lessons");
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl p-6">
        <div className="text-center">
          <Spinner size="xl" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Cargando quizzes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Button color="gray" onClick={handleGoBack} className="mb-4">
            <HiArrowLeft className="mr-2 h-4 w-4" />
            Volver a Lecciones
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestión de Quizzes
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Administra los quizzes de esta lección
          </p>
        </div>
        <Button color="success" onClick={handleCreateQuiz}>
          <HiPlus className="mr-2 h-4 w-4" />
          Crear Quiz
        </Button>
      </div>

      {error && (
        <Alert color="failure" icon={HiExclamationCircle} className="mb-6">
          {error}
        </Alert>
      )}

      {quizzes.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <HiExclamationCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No hay quizzes
            </h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Esta lección no tiene quizzes creados aún.
            </p>
            <Button color="success" onClick={handleCreateQuiz} className="mt-4">
              <HiPlus className="mr-2 h-4 w-4" />
              Crear Primer Quiz
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Quiz #{quiz.id.slice(-8)}
                  </h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">
                    {quiz.questions.length} pregunta
                    {quiz.questions.length !== 1 ? "s" : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-gray-900 dark:text-white">
                    {quiz.questions.map((question, index) => (
                      <Badge key={question.id} color="blue">
                        Pregunta {index + 1}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="blue"
                    onClick={() => handleEditQuiz(quiz)}
                  >
                    <HiPencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    color="failure"
                    onClick={() => handleDeleteQuiz(quiz.id)}
                  >
                    <HiTrash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        show={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingQuiz(null);
          setNewQuestions([]);
        }}
        size="4xl"
      >
        <Modal.Header>
          {editingQuiz ? "Editar Quiz" : "Crear Nuevo Quiz"}
        </Modal.Header>
        <Modal.Body>
          <div className="space-y-6">
            {newQuestions.map((question, questionIndex) => (
              <Card key={questionIndex}>
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Pregunta {questionIndex + 1}
                  </h4>
                  {newQuestions.length > 1 && (
                    <Button
                      size="sm"
                      color="failure"
                      onClick={() => removeQuestion(questionIndex)}
                    >
                      <HiTrash className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="mb-4">
                  <Label htmlFor={`question-${questionIndex}`}>
                    Texto de la pregunta
                  </Label>
                  <Textarea
                    id={`question-${questionIndex}`}
                    value={question.text}
                    onChange={(e) =>
                      updateQuestion(questionIndex, "text", e.target.value)
                    }
                    placeholder="Escribe la pregunta aquí..."
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Opciones de respuesta</Label>
                    <Button
                      size="sm"
                      color="success"
                      onClick={() => addOption(questionIndex)}
                    >
                      <HiPlus className="h-4 w-4" />
                    </Button>
                  </div>

                  {question.options.map((option, optionIndex) => {
                    const uploadKey = `${questionIndex}-${optionIndex}`;
                    const isUploading = uploadingImage === uploadKey;

                    return (
                      <div key={optionIndex} className="space-y-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`correct-${questionIndex}`}
                            checked={option.isCorrect}
                            onChange={() => {
                              const updated = [...newQuestions];
                              updated[questionIndex].options.forEach(
                                (opt, idx) => {
                                  opt.isCorrect = idx === optionIndex;
                                },
                              );
                              setNewQuestions(updated);
                            }}
                            className="size-4 text-blue-600"
                          />

                          <div className="flex-1">
                            {isImageUrl(option.text) ? (
                              <div className="flex items-center gap-3">
                                <img
                                  src={`${BACKEND_BASE_URL}${option.text}`}
                                  alt="Opción"
                                  className="h-16 w-24 rounded border object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = "none";
                                  }}
                                />
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  Imagen cargada
                                </span>
                                <Button
                                  size="sm"
                                  color="gray"
                                  onClick={() =>
                                    updateOption(
                                      questionIndex,
                                      optionIndex,
                                      "text",
                                      "",
                                    )
                                  }
                                >
                                  Cambiar
                                </Button>
                              </div>
                            ) : (
                              <TextInput
                                value={option.text}
                                onChange={(e) =>
                                  updateOption(
                                    questionIndex,
                                    optionIndex,
                                    "text",
                                    e.target.value,
                                  )
                                }
                                placeholder="Texto de la opción..."
                                className="flex-1"
                              />
                            )}
                          </div>

                          <div className="flex gap-2">
                            {!isImageUrl(option.text) && (
                              <div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  id={`file-input-${questionIndex}-${optionIndex}`}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleImageUpload(
                                        questionIndex,
                                        optionIndex,
                                        file,
                                      );
                                    }
                                  }}
                                  disabled={isUploading}
                                />
                                <label
                                  htmlFor={`file-input-${questionIndex}-${optionIndex}`}
                                >
                                  <Button
                                    size="sm"
                                    color="blue"
                                    as="span"
                                    className={`cursor-pointer ${isUploading ? "pointer-events-none opacity-50" : ""}`}
                                  >
                                    {isUploading ? (
                                      <Spinner size="sm" />
                                    ) : (
                                      <HiPhotograph className="h-4 w-4" />
                                    )}
                                  </Button>
                                </label>
                              </div>
                            )}

                            {question.options.length > 2 && (
                              <Button
                                size="sm"
                                color="failure"
                                onClick={() =>
                                  removeOption(questionIndex, optionIndex)
                                }
                              >
                                <HiTrash className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))}

            <Button color="success" onClick={addQuestion} className="w-full">
              <HiPlus className="mr-2 h-4 w-4" />
              Agregar Pregunta
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="success"
            onClick={handleSubmitQuiz}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                {editingQuiz ? "Actualizando..." : "Creando..."}
              </>
            ) : editingQuiz ? (
              "Actualizar Quiz"
            ) : (
              "Crear Quiz"
            )}
          </Button>
          <Button
            color="gray"
            onClick={() => {
              setShowCreateModal(false);
              setEditingQuiz(null);
              setNewQuestions([]);
            }}
          >
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
