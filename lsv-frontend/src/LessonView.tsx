import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, Spinner, Button, Alert } from "flowbite-react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useToast } from "./components/ToastProvider";
import { HiExclamationCircle, HiArrowLeft } from "react-icons/hi";
import QuillEditor from "./components/QuillEditor";
import { lessonApi, lessonVariantApi } from "./services/api";

interface Stage {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
}

interface Lesson {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  content: string;
  stage: Stage;
}

interface LessonVariant {
  id: string;
  name: string;
  description: string;
  content: string;
  region?: {
    id: string;
    name: string;
  };
  baseLesson?: {
    id: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function LessonView() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonVariant, setLessonVariant] = useState<LessonVariant | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [updatingCompletion, setUpdatingCompletion] = useState(false);
  const [token] = useLocalStorage<string | null>("auth", null);
  const addToast = useToast();

  useEffect(() => {
    const fetchLesson = async () => {
      if (!token || !lessonId) {
        setError("Faltan datos para cargar la lección.");
        setLoading(false);
        return;
      }

      setLoading(true);
      const regionId = searchParams.get("regionId");

      try {
        let lessonData: Lesson | LessonVariant | null = null;
        let actualLessonId = lessonId;

        // Si hay regionId, intentar obtener la lección regional
        if (regionId) {
          const variantResponse = await lessonVariantApi.getRegionalLesson(
            lessonId,
            regionId,
          );

          if (variantResponse.success && variantResponse.data) {
            const data = variantResponse.data;
            // Verificar si es una variante: tiene propiedad 'region' o 'baseLesson'
            if ("region" in data || "baseLesson" in data) {
              // Es una variante regional
              lessonData = data as LessonVariant;
              setLessonVariant(data as LessonVariant);
              setLesson(null);
              // Usar el ID de la lección base para startLesson
              actualLessonId =
                (data as LessonVariant).baseLesson?.id || lessonId;
            } else {
              // Es una lección normal
              lessonData = data as Lesson;
              setLesson(data as Lesson);
              setLessonVariant(null);
            }
          } else {
            // Si falla, intentar obtener la lección normal
            const lessonResponse = await lessonApi.getUserLesson(lessonId);
            if (lessonResponse.success) {
              lessonData = lessonResponse.data;
              setLesson(lessonResponse.data);
              setLessonVariant(null);
            } else {
              throw new Error(
                lessonResponse.message || "Error al cargar la lección",
              );
            }
          }
        } else {
          // Sin regionId, obtener la lección normal
          const lessonResponse = await lessonApi.getUserLesson(lessonId);
          if (lessonResponse.success) {
            lessonData = lessonResponse.data;
            setLesson(lessonResponse.data);
            setLessonVariant(null);
          } else {
            throw new Error(
              lessonResponse.message || "Error al cargar la lección",
            );
          }
        }

        if (lessonData) {
          // Iniciar la lección usando el ID base si es una variante
          const startResponse = await lessonApi.startLesson(
            actualLessonId,
            regionId || undefined,
          );
          if (startResponse.success) {
            addToast("success", "Lección iniciada correctamente");
          }
        }
      } catch (err: any) {
        const errorMessage = err.message || "Error al cargar la lección";
        setError(errorMessage);
        addToast("error", errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId, token, addToast, searchParams]);

  const handleMarkAsComplete = async () => {
    if (!token || !lessonId) return;

    setUpdatingCompletion(true);

    const newCompletionStatus = !isComplete;
    const response = await lessonApi.setLessonCompletion(
      lessonId,
      newCompletionStatus,
    );

    if (response.success) {
      setIsComplete(newCompletionStatus);
      addToast(
        "success",
        newCompletionStatus
          ? "Lección marcada como completada"
          : "Lección desmarcada como completada",
      );
    } else {
      addToast(
        "error",
        response.message || "Error al actualizar el estado de la lección",
      );
    }

    setUpdatingCompletion(false);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <div className="text-center">
          <Spinner size="xl" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Cargando lección...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <Alert color="failure" icon={HiExclamationCircle}>
          {error}
        </Alert>
        <div className="mt-4">
          <Button color="gray" onClick={handleGoBack}>
            <HiArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  if (!lesson && !lessonVariant) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <Alert color="failure" icon={HiExclamationCircle}>
          No se encontró la lección solicitada.
        </Alert>
        <div className="mt-4">
          <Button color="gray" onClick={handleGoBack}>
            <HiArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <div className="mb-6">
        <Button color="gray" onClick={handleGoBack}>
          <HiArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      <Card className="mb-6">
        <div className="mb-6">
          <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
            {lesson?.name || lessonVariant?.name}
          </h1>
          <p className="mb-6 text-lg text-gray-700 dark:text-gray-300">
            {lesson?.description || lessonVariant?.description}
          </p>
        </div>

        <div className="mb-6">
          <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Contenido de la lección
          </h3>
          <div className="rounded-lg border border-gray-200 dark:border-gray-700">
            <QuillEditor
              value={lesson?.content || lessonVariant?.content || ""}
              readOnly={true}
              theme="snow"
              modules={{
                toolbar: false,
              }}
              className="border-none bg-gray-50"
            />
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            color={isComplete ? "warning" : "success"}
            size="lg"
            onClick={handleMarkAsComplete}
            disabled={updatingCompletion}
          >
            {updatingCompletion ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Procesando...
              </>
            ) : isComplete ? (
              "Desmarcar como finalizada"
            ) : (
              "Marcar como finalizada"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
