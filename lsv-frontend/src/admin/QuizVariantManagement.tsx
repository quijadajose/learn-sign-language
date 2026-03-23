import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  Button,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  TextInput,
  Label,
  Textarea,
  Spinner,
  Badge,
  Table,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
} from "flowbite-react";
import {
  HiPlus,
  HiTrash,
  HiPencil,
  HiExclamationCircle,
  HiPhotograph,
} from "react-icons/hi";
import { useToast } from "../components/ToastProvider";
import { quizVariantApi, lessonVariantApi, quizApi } from "../services/api";
import { BACKEND_BASE_URL } from "../config";
import { usePermissions } from "../hooks/usePermissions";

interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  question: string;
  optionVariants: QuizOption[];
}

interface QuizVariant {
  id: string;
  lessonVariant: {
    id: string;
    name: string;
    region: {
      id: string;
      name: string;
      code: string;
    };
  };
  questionVariants: QuizQuestion[];
}

interface LessonVariant {
  id: string;
  name: string;
  region: {
    id: string;
    name: string;
    code: string;
  };
  isBase: boolean;
  isRegionalSpecific: boolean;
}

const QuizVariantManagement = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [quizVariants, setQuizVariants] = useState<QuizVariant[]>([]);
  const [lessonVariants, setLessonVariants] = useState<LessonVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLessonVariantId, setSelectedLessonVariantId] =
    useState<string>("");
  const [questions, setQuestions] = useState<
    Array<{
      question: string;
      options: Array<{ text: string; isCorrect: boolean }>;
    }>
  >([]);
  const [creating, setCreating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [editingQuizVariantId, setEditingQuizVariantId] = useState<
    string | null
  >(null);
  const addToast = useToast();
  const { isAdmin, hasRegionPermission } = usePermissions();

  useEffect(() => {
    if (lessonId) {
      loadData();
    }
  }, [lessonId]);

  const loadData = async () => {
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

      const allQuizVariants: QuizVariant[] = [];
      for (const lessonVariant of lessonResponse.data || []) {
        const quizResponse = await quizVariantApi.getQuizVariants(
          lessonVariant.id,
        );

        if (quizResponse.success && quizResponse.data) {
          allQuizVariants.push(...quizResponse.data);
        }
      }
      setQuizVariants(allQuizVariants);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Error al cargar los datos";
      setError(errorMsg);
      addToast("error", errorMsg);
    } finally {
      setLoading(false);
    }
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
          options: q.options
            .filter((opt) => opt.text.trim())
            .map((opt) => ({
              text: opt.text,
              isCorrect: opt.isCorrect,
            })),
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
        setShowCreateModal(false);
        setEditingQuizVariantId(null);
        setQuestions([]);
        setSelectedLessonVariantId("");
        loadData();
      } else {
        addToast(
          "error",
          response.message ||
            `Error al ${editingQuizVariantId ? "actualizar" : "crear"} la variante de quiz`,
        );
      }
    } catch (err) {
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
    } catch (err) {
      addToast("error", "Error al eliminar la variante de quiz");
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      },
    ]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    field: string,
    value: any,
  ) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = {
      ...newQuestions[questionIndex].options[optionIndex],
      [field]: value,
    };
    setQuestions(newQuestions);
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

        const baseQuestions = baseQuiz.questions.map((q: any) => ({
          question: q.text,
          options: q.options.map((opt: any) => ({
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
        setQuestions([
          {
            question: "",
            options: [
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
            ],
          },
        ]);
        addToast(
          "info",
          "No hay quiz base para esta lección. Se creó una pregunta vacía.",
        );
      }
    } catch (err) {
      addToast("error", "Error al cargar las preguntas base de la lección");
      setQuestions([
        {
          question: "",
          options: [
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
          ],
        },
      ]);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleLessonVariantChange = (variantId: string) => {
    setSelectedLessonVariantId(variantId);
    if (variantId) {
      loadBaseQuestions();
    } else {
      setQuestions([]);
    }
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
          onClick={() => {
            setEditingQuizVariantId(null);
            setQuestions([]);
            setSelectedLessonVariantId("");
            setShowCreateModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <HiPlus className="mr-2 h-4 w-4" />
          Crear Variante de Quiz
        </Button>
      </div>

      {error && (
        <Alert color="failure" icon={HiExclamationCircle}>
          {error}
        </Alert>
      )}

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableHeadCell>Variante de Lección</TableHeadCell>
              <TableHeadCell>Región</TableHeadCell>
              <TableHeadCell>Preguntas</TableHeadCell>
              <TableHeadCell>Acciones</TableHeadCell>
            </TableHead>
            <TableBody className="divide-y">
              {quizVariants.map((variant) => (
                <TableRow
                  key={variant.id}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {variant.lessonVariant?.name || "N/A"}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      {variant.lessonVariant?.region?.name || "N/A"} (
                      {variant.lessonVariant?.region?.code || "N/A"})
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-white">
                    <Badge color="blue">
                      {variant.questionVariants.length} preguntas
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {(isAdmin ||
                        (variant.lessonVariant?.region?.id &&
                          hasRegionPermission(
                            variant.lessonVariant.region.id,
                          ))) && (
                        <>
                          <Button
                            size="sm"
                            color="info"
                            onClick={() => handleOpenEditModal(variant)}
                          >
                            <HiPencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            color="failure"
                            onClick={() => handleDeleteQuizVariant(variant.id)}
                          >
                            <HiTrash className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {quizVariants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    No hay variantes de quiz creadas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Modal
        show={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingQuizVariantId(null);
          setQuestions([]);
          setSelectedLessonVariantId("");
        }}
        size="4xl"
      >
        <ModalHeader>
          {editingQuizVariantId
            ? "Editar Variante de Quiz"
            : "Crear Variante de Quiz"}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <div>
              <Label htmlFor="lessonVariant">Variante de Lección</Label>
              <div className="relative">
                <select
                  id="lessonVariant"
                  value={selectedLessonVariantId}
                  onChange={(e) => handleLessonVariantChange(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  disabled={loadingQuestions}
                >
                  <option value="">Selecciona una variante de lección</option>
                  {lessonVariants
                    .filter(
                      (variant) =>
                        isAdmin || hasRegionPermission(variant.region.id),
                    )
                    .map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.name} - {variant.region.name} (
                        {variant.region.code})
                      </option>
                    ))}
                </select>
                {loadingQuestions && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 transform">
                    <Spinner size="sm" />
                  </div>
                )}
              </div>
              {loadingQuestions && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Cargando preguntas de la lección base...
                </p>
              )}
            </div>

            {questions.map((question, questionIndex) => (
              <Card key={questionIndex}>
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Pregunta {questionIndex + 1}
                  </h4>
                  {questions.length > 1 && (
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
                    value={question.question}
                    onChange={(e) =>
                      updateQuestion(questionIndex, "question", e.target.value)
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
                              const updated = [...questions];
                              updated[questionIndex].options.forEach(
                                (opt, idx) => {
                                  opt.isCorrect = idx === optionIndex;
                                },
                              );
                              setQuestions(updated);
                            }}
                            className="size-4 text-blue-600"
                          />

                          <div className="flex-1">
                            {isImageUrl(option.text) ? (
                              <div className="flex items-center gap-3">
                                <img
                                  src={`${BACKEND_BASE_URL}${encodeURI(option.text)}`}
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
        </ModalBody>
        <ModalFooter>
          <Button
            color="success"
            onClick={handleSaveQuizVariant}
            disabled={
              creating || !selectedLessonVariantId || questions.length === 0
            }
          >
            {creating && <Spinner size="sm" className="mr-2" />}
            {editingQuizVariantId ? "Actualizar Variante" : "Crear Variante"}
          </Button>
          <Button
            color="gray"
            onClick={() => {
              setShowCreateModal(false);
              setEditingQuizVariantId(null);
              setQuestions([]);
              setSelectedLessonVariantId("");
            }}
          >
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default QuizVariantManagement;
