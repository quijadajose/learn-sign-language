import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Card, Spinner, Button, Alert } from "flowbite-react";
import { useAuth } from "./context/AuthContext";
import { useToast } from "./components/ToastProvider";
import { HiExclamationCircle, HiArrowLeft } from "react-icons/hi";
import QuillEditor from "./components/QuillEditor";
import {
  lessonApi,
  lessonVariantApi,
  signRecordApi,
  unwrapApiData,
} from "./services/api";
import type { LessonModelsBundleDto } from "./types/signRecord";

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

function hasReadyPracticeModel(bundle: LessonModelsBundleDto | null): boolean {
  if (!bundle) return false;
  return Boolean(bundle.static?.modelJsonUrl || bundle.dynamic?.modelJsonUrl);
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
  const [canPractice, setCanPractice] = useState(false);
  const { token } = useAuth();
  const addToast = useToast();

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      if (!token || !lessonId) {
        setError("Faltan datos para cargar la lección.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setCanPractice(false);
      const regionId = searchParams.get("regionId");

      try {
        let lessonData: Lesson | LessonVariant | null = null;
        let actualLessonId = lessonId;

        if (regionId) {
          const variantResponse = await lessonVariantApi.getRegionalLesson(
            lessonId,
            regionId,
          );
          if (controller.signal.aborted) return;

          if (variantResponse.success && variantResponse.data) {
            const data = unwrapApiData<Lesson | LessonVariant>(
              variantResponse.data,
            );
            if ("region" in data || "baseLesson" in data) {
              lessonData = data as LessonVariant;
              setLessonVariant(data as LessonVariant);
              setLesson(null);
              actualLessonId =
                (data as LessonVariant).baseLesson?.id || lessonId;
            } else {
              lessonData = data as Lesson;
              setLesson(data as Lesson);
              setLessonVariant(null);
            }
          } else {
            const lessonResponse = await lessonApi.getUserLesson(lessonId);
            if (controller.signal.aborted) return;
            if (lessonResponse.success && lessonResponse.data) {
              lessonData = unwrapApiData<Lesson>(lessonResponse.data);
              setLesson(lessonData as Lesson);
              setLessonVariant(null);
            } else {
              throw new Error(
                lessonResponse.message || "Error al cargar la lección",
              );
            }
          }
        } else {
          const lessonResponse = await lessonApi.getUserLesson(lessonId);
          if (controller.signal.aborted) return;
          if (lessonResponse.success && lessonResponse.data) {
            lessonData = unwrapApiData<Lesson>(lessonResponse.data);
            setLesson(lessonData as Lesson);
            setLessonVariant(null);
          } else {
            throw new Error(
              lessonResponse.message || "Error al cargar la lección",
            );
          }
        }

        if (lessonData && !controller.signal.aborted) {
          await lessonApi.startLesson(actualLessonId, regionId || undefined);

          const modelRes = await signRecordApi.getLessonModel(
            actualLessonId,
            regionId || undefined,
          );
          if (controller.signal.aborted) return;

          if (modelRes.success && modelRes.data) {
            const bundle = unwrapApiData<LessonModelsBundleDto>(modelRes.data);
            setCanPractice(hasReadyPracticeModel(bundle));
          } else {
            setCanPractice(false);
          }
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        const errorMessage =
          err instanceof Error ? err.message : "Error al cargar la lección";
        setError(errorMessage);
        addToast("error", errorMessage);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [lessonId, token, addToast, searchParams]);

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
            <HiArrowLeft className="mr-2 size-4" />
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
            <HiArrowLeft className="mr-2 size-4" />
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
          <HiArrowLeft className="mr-2 size-4" />
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
          <QuillEditor
            value={lesson?.content || lessonVariant?.content || ""}
            readOnly={true}
            theme="snow"
            modules={{
              toolbar: false,
            }}
            className="quill-seamless"
          />
        </div>

        {canPractice && (
          <div className="mt-8 flex flex-col items-center space-y-4 pt-4">
            <h3 className="text-xl font-bold dark:text-white">
              ¿Listo para el reto?
            </h3>
            <p className="max-w-md text-center text-gray-600 dark:text-gray-400">
              Pon a prueba lo aprendido usando tu cámara para reconocer las
              señas de esta lección con nuestra IA.
            </p>
            <Button
              size="xl"
              onClick={() => {
                const regionId = searchParams.get("regionId");
                const from = regionId
                  ? `/lesson/${lessonId}?regionId=${regionId}`
                  : `/lesson/${lessonId}`;

                const practicePath = regionId
                  ? `/lesson/${lessonId}/practice?regionId=${regionId}`
                  : `/lesson/${lessonId}/practice`;

                navigate(practicePath, {
                  state: { from, regionId: regionId ?? undefined },
                });
              }}
            >
              ¡Practiquemos! 🎥
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
