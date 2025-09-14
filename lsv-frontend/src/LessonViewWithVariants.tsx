import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Spinner, Button, Alert, Badge } from "flowbite-react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useToast } from "./components/ToastProvider";
import { HiExclamationCircle, HiArrowLeft, HiGlobe } from "react-icons/hi";
import QuillEditor from "./components/QuillEditor";
import { lessonApi, lessonVariantApi } from "./services/api";
import RegionSelector from "./components/RegionSelector";

interface Stage {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
}

interface Region {
  id: string;
  name: string;
  code: string;
  description: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
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
  isRegionalSpecific: boolean;
  isBase: boolean;
  regionalNotes?: string;
  region: Region;
  baseLesson: Lesson;
  createdAt: string;
  updatedAt: string;
}

export default function LessonViewWithVariants() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lessonVariant, setLessonVariant] = useState<LessonVariant | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [updatingCompletion, setUpdatingCompletion] = useState(false);
  const [, setSelectedRegionId] = useState<string | null>(null);
  const [isUsingVariant, setIsUsingVariant] = useState(false);
  const [token] = useLocalStorage<string | null>("auth", null);
  const addToast = useToast();

  const loadLesson = async (regionId?: string) => {
    if (!token || !lessonId) {
      setError("Faltan datos para cargar la lección.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (regionId) {
        const variantResponse = await lessonVariantApi.getRegionalLesson(
          lessonId,
          regionId,
        );

        if (variantResponse.success) {
          const data = variantResponse.data;
          if ("region" in data) {
            setLessonVariant(data as LessonVariant);
            setLesson(null);
            setIsUsingVariant(true);
          } else {
            setLesson(data as Lesson);
            setLessonVariant(null);
            setIsUsingVariant(false);
          }
        } else {
          const lessonResponse = await lessonApi.getUserLesson(lessonId);

          if (lessonResponse.success) {
            setLesson(lessonResponse.data);
            setLessonVariant(null);
            setIsUsingVariant(false);
          } else {
            setError(lessonResponse.message || "Error al cargar la lección");
          }
        }
      } else {
        const lessonResponse = await lessonApi.getUserLesson(lessonId);

        if (lessonResponse.success) {
          setLesson(lessonResponse.data);
          setLessonVariant(null);
          setIsUsingVariant(false);
        } else {
          setError(lessonResponse.message || "Error al cargar la lección");
        }
      }

      const completionResponse = await lessonApi.getUserLesson(lessonId);
      if (completionResponse.success) {
        setIsComplete(completionResponse.data.isCompleted || false);
      }
    } catch (err) {
      setError("Error de conexión al cargar la lección");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLesson();
  }, [lessonId, token]);

  const handleRegionChange = (regionId: string) => {
    setSelectedRegionId(regionId);
    loadLesson(regionId);
  };

  const handleToggleCompletion = async () => {
    if (!lessonId) return;

    setUpdatingCompletion(true);
    try {
      const response = await lessonApi.setLessonCompletion(
        lessonId,
        !isComplete,
      );

      if (response.success) {
        setIsComplete(!isComplete);
        addToast(
          "success",
          isComplete
            ? "Lección marcada como no completada"
            : "¡Lección completada!",
        );
      } else {
        addToast("error", response.message || "Error al actualizar el estado");
      }
    } catch (err) {
      addToast("error", "Error de conexión al actualizar el estado");
    } finally {
      setUpdatingCompletion(false);
    }
  };

  const currentLesson = isUsingVariant ? lessonVariant : lesson;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button color="gray" onClick={() => navigate(-1)} className="mb-4">
          <HiArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <Alert color="failure" icon={HiExclamationCircle}>
          <span className="font-medium">Error!</span> {error}
        </Alert>
      </div>
    );
  }

  if (!currentLesson) {
    return (
      <div className="space-y-4">
        <Button color="gray" onClick={() => navigate(-1)} className="mb-4">
          <HiArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <Alert color="failure" icon={HiExclamationCircle}>
          <span className="font-medium">Error!</span> No se pudo cargar la
          lección.
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Button color="gray" onClick={() => navigate(-1)} className="mb-4">
            <HiArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>

          <div className="mb-2 flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {currentLesson.name}
            </h1>
            {isUsingVariant && <Badge color="blue">Variante Regional</Badge>}
            {!isUsingVariant && (
              <Badge color="gray" icon={HiGlobe}>
                Versión Nacional
              </Badge>
            )}
          </div>

          <p className="mb-4 text-gray-600 dark:text-gray-400">
            {currentLesson.description}
          </p>

          <div className="mb-4">
            <RegionSelector
              onRegionChange={handleRegionChange}
              showLabel={true}
              className="max-w-md"
            />
          </div>

          {isUsingVariant && lessonVariant?.regionalNotes && (
            <Alert color="info" className="mb-4">
              <div>
                <h4 className="font-medium">Notas Regionales:</h4>
                <p className="mt-1 text-sm">{lessonVariant.regionalNotes}</p>
              </div>
            </Alert>
          )}
        </div>

        <div className="ml-4">
          <Button
            color={isComplete ? "success" : "blue"}
            onClick={handleToggleCompletion}
            disabled={updatingCompletion}
            className="min-w-[140px]"
          >
            {updatingCompletion ? <Spinner size="sm" className="mr-2" /> : null}
            {isComplete ? "Completada" : "Marcar como Completada"}
          </Button>
        </div>
      </div>

      <Card>
        <div className="prose dark:prose-invert max-w-none">
          <QuillEditor
            value={currentLesson.content}
            readOnly
            theme="bubble"
            className="border-none"
          />
        </div>
      </Card>

      {isUsingVariant && lessonVariant && (
        <Card>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            Información Regional
          </h3>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <strong>Región:</strong> {lessonVariant.region.name} (
              {lessonVariant.region.code})
            </p>
            <p>
              <strong>Tipo:</strong>{" "}
              {lessonVariant.isRegionalSpecific
                ? "Específica de la región"
                : "Basada en versión nacional"}
            </p>
            <p>
              <strong>Descripción de la región:</strong>{" "}
              {lessonVariant.region.description}
            </p>
          </div>
        </Card>
      )}

      <div className="flex justify-between">
        <Button color="gray" onClick={() => navigate(-1)}>
          <HiArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <Button color="blue" onClick={() => navigate(`/quiz/${lessonId}`)}>
          Continuar al Quiz
        </Button>
      </div>
    </div>
  );
}
