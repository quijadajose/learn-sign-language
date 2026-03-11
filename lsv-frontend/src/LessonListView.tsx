import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Card,
  Spinner,
  Button,
  Alert,
  Modal,
  Progress,
  Dropdown,
  DropdownItem,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "flowbite-react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useToast } from "./components/ToastProvider";
import { HiExclamationCircle, HiClock, HiCheckCircle } from "react-icons/hi";
import { lessonApi } from "./services/api";
import { BACKEND_BASE_URL } from "./config";
import { useAuth } from "./context/AuthContext";

interface Question {
  questionId: string;
  questionText: string;
  submittedOptionId: string;
  optionText: string;
  isCorrect: boolean;
}

interface Submission {
  submissionId: string;
  score: number;
  submittedAt: string;
  questions: Question[];
}

interface Lesson {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  maxScore: number;
  submissions: Submission[];
  regionId?: string;
}

interface StageProgress {
  id: string;
  name: string;
  description: string;
  totalLessons: string;
  completedLessons: string;
  progress: string | null;
}

export default function LessonListView() {
  const { stageId } = useParams<{ stageId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const [selectedLanguageId] = useLocalStorage<string | null>(
    "selectedLanguageId",
    null,
  );
  const [selectedRegionId] = useLocalStorage<string | null>(
    "selectedRegionId",
    null,
  );
  const [, setPersistedStageId] = useLocalStorage<string | null>(
    `selectedStageId_${selectedLanguageId}`,
    null,
  );
  const addToast = useToast();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentStage, setCurrentStage] = useState<StageProgress | null>(null);
  const [allStages, setAllStages] = useState<StageProgress[]>([]);
  const [loadingStage, setLoadingStage] = useState(true);

  useEffect(() => {
    const fetchLessons = async () => {
      if (!token || !stageId) {
        setError("Faltan datos para cargar las lecciones.");
        setLoading(false);
        return;
      }

      const { languageId, regionId: regionIdFromState } = location.state || {};
      const regionId = regionIdFromState || selectedRegionId;
      if (!languageId) {
        setError("No se ha proporcionado un idioma para cargar las lecciones.");
        setLoading(false);
        addToast("error", "Error de navegación: Falta el ID del idioma.");
        return;
      }

      setLoading(true);

      const response = await lessonApi.getLessonsWithSubmissions(
        languageId,
        stageId,
        1,
        100,
        regionId || undefined,
      );

      if (response.success) {
        setLessons(response.data.data);
      } else {
        setError(response.message || "Error al cargar las lecciones");
        addToast("error", response.message || "Error al cargar las lecciones");
      }

      setLoading(false);
    };

    const fetchStageInfo = async () => {
      if (!token || !stageId) {
        setLoadingStage(false);
        return;
      }

      const { languageId } = location.state || {};
      const finalLanguageId = languageId || selectedLanguageId;

      if (!finalLanguageId) {
        setLoadingStage(false);
        return;
      }

      setLoadingStage(true);
      try {
        const response = await lessonApi.getStagesProgress(finalLanguageId);
        if (response.success) {
          const stages: StageProgress[] = response.data.data;
          setAllStages(stages);
          const stage = stages.find((s) => s.id === stageId);
          if (stage) {
            setCurrentStage(stage);
          }
        }
      } catch (err: any) {
        console.error("Error al cargar información de la etapa:", err);
      } finally {
        setLoadingStage(false);
      }
    };

    fetchLessons();
    fetchStageInfo();
  }, [stageId, token, addToast, location.state]);

  const handleViewLesson = (lesson: Lesson) => {
    const lessonId = lesson.id;
    if (lesson.regionId) {
      navigate(`/lesson/${lessonId}?regionId=${lesson.regionId}`);
    } else {
      navigate(`/lesson/${lessonId}`);
    }
  };

  const handleTakeExam = (lesson: Lesson) => {
    const lessonId = lesson.id;
    if (lesson.regionId) {
      navigate(`/quiz/${lessonId}?regionId=${lesson.regionId}`);
    } else {
      navigate(`/quiz/${lessonId}`);
    }
  };

  const handleChangeStage = (newStageId: string) => {
    const { languageId, regionId: regionIdFromState } = location.state || {};
    const finalLanguageId = languageId || selectedLanguageId;
    const finalRegionId = regionIdFromState || selectedRegionId;

    if (finalLanguageId === selectedLanguageId) {
      setPersistedStageId(newStageId);
    }

    navigate(`/lessons/stage/${newStageId}`, {
      state: {
        languageId: finalLanguageId,
        regionId: finalRegionId,
      },
    });
  };

  const handleShowSubmissions = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setShowModal(true);
  };

  const getCardColorClass = (maxScore: number) => {
    if (maxScore === 100) {
      return "bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-500";
    } else if (maxScore >= 80) {
      return "bg-gradient-to-br from-gray-300 to-gray-500 border-gray-400";
    }
    return "";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isImageUrl = (text: string) => {
    return text.startsWith("/images/");
  };

  const renderOptionContent = (optionText: string) => {
    if (isImageUrl(optionText)) {
      return (
        <img
          src={`${BACKEND_BASE_URL}${optionText}`}
          alt="Opción de respuesta"
          className="h-auto max-h-32 max-w-full rounded border object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `<span class="text-sm text-gray-600 dark:text-gray-400">${optionText}</span>`;
            }
          }}
        />
      );
    }
    return (
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {optionText}
      </span>
    );
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-end">
        {allStages.length > 1 && (
          <Dropdown label="Cambiar Sección" dismissOnClick={true} color="blue">
            {allStages.map((stage) => (
              <DropdownItem
                key={stage.id}
                onClick={() => handleChangeStage(stage.id)}
                disabled={stage.id === stageId}
              >
                {stage.name}: {stage.description}
              </DropdownItem>
            ))}
          </Dropdown>
        )}
      </div>

      <h1 className="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-white">
        Lecciones de la Etapa
      </h1>

      {!loadingStage && currentStage && (
        <Card className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {currentStage.name}: {currentStage.description}
          </h2>
          <div className="mt-4">
            <div className="mb-1 flex justify-between">
              <span className="text-base font-medium text-gray-700 dark:text-gray-400">
                Progreso General
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-400">
                {currentStage.completedLessons} de {currentStage.totalLessons}{" "}
                lecciones
              </span>
            </div>
            <Progress
              progress={parseFloat(currentStage.progress || "0")}
              color="blue"
              size="lg"
            />
          </div>
        </Card>
      )}

      {loading && (
        <div className="text-center">
          <Spinner size="xl" />
        </div>
      )}
      {error && (
        <Alert color="failure" icon={HiExclamationCircle}>
          {error}
        </Alert>
      )}

      {!loading && !error && lessons.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {lessons.map((lesson) => (
            <Card
              key={lesson.id}
              className={`flex h-full flex-col ${getCardColorClass(lesson.maxScore)}`}
            >
              <div className="grow">
                <div className="mb-2 flex items-center justify-between">
                  <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {lesson.name}
                  </h5>
                  {lesson.submissions.length > 0 && (
                    <button
                      onClick={() => handleShowSubmissions(lesson)}
                      className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-sm font-medium text-blue-800 transition-colors hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
                    >
                      <HiCheckCircle className="h-4 w-4" />
                      {lesson.submissions.length}
                    </button>
                  )}
                </div>
                <p className="font-normal text-gray-700 dark:text-gray-400">
                  {lesson.description}
                </p>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Puntuación máxima: {lesson.maxScore}
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Button color="blue" onClick={() => handleViewLesson(lesson)}>
                  Ver lección
                </Button>
                <Button
                  color="success"
                  onClick={() => handleTakeExam(lesson)}
                  disabled={lesson.maxScore === 100}
                >
                  {lesson.maxScore === 100
                    ? "Examen completado"
                    : "Tomar examen"}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && lessons.length === 0 && (
        <Card>
          <p className="text-center text-gray-500 dark:text-gray-400">
            No hay lecciones disponibles para esta etapa.
          </p>
        </Card>
      )}

      <Modal show={showModal} onClose={() => setShowModal(false)} size="4xl">
        <ModalHeader>
          <div className="flex items-center gap-2">
            <HiCheckCircle className="h-6 w-6 text-blue-600" />
            <span>Resultados del Examen: {selectedLesson?.name}</span>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {selectedLesson?.submissions.map((submission, index) => (
              <div
                key={submission.submissionId}
                className="rounded-lg border bg-gray-50 p-4 dark:bg-gray-800"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HiClock className="h-5 w-5 text-gray-500" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Intento #{index + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(submission.submittedAt)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        submission.score === 100
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : submission.score >= 80
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      }`}
                    >
                      {submission.score}/100
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {submission.questions.map((question, qIndex) => (
                    <div
                      key={question.questionId}
                      className="border-l-4 border-gray-200 pl-4 dark:border-gray-700"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {qIndex + 1}.
                        </span>
                        <div className="flex-1">
                          <p className="mb-1 font-medium text-gray-800 dark:text-gray-200">
                            {question.questionText}
                          </p>
                          <div className="flex items-start gap-2">
                            <span className="flex-shrink-0 text-sm text-gray-600 dark:text-gray-400">
                              Respuesta:
                            </span>
                            <div className="flex-1">
                              {renderOptionContent(question.optionText)}
                            </div>
                            <div className="flex-shrink-0">
                              {question.isCorrect ? (
                                <HiCheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <HiExclamationCircle className="h-4 w-4 text-red-600" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => setShowModal(false)}>Cerrar</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
