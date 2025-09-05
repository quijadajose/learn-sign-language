import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Spinner, Button, Alert } from "flowbite-react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useToast } from "./components/ToastProvider";
import { BACKEND_BASE_URL } from "./config";
import { HiExclamationCircle } from "react-icons/hi";

interface Lesson {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
}

interface LessonResponse {
  data: Lesson[];
  total: number;
  page: number;
  pageSize: number;
}

export default function LessonListView() {
  const { stageId } = useParams<{ stageId: string }>();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token] = useLocalStorage<string | null>("auth", null);
  const addToast = useToast();

  useEffect(() => {
    const fetchLessons = async () => {
      if (!token || !stageId) {
        setError("Faltan datos para cargar las lecciones.");
        setLoading(false);
        return;
      }

      const languageId = localStorage.getItem("selectedLanguageId");
      if (!languageId) {
        setError("No se ha seleccionado un idioma.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `${BACKEND_BASE_URL}/lesson/by-language/${languageId}?stageId=${stageId}&page=1&limit=100&orderBy=name&sortOrder=ASC`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        if (!res.ok) throw new Error(await res.text());
        const data: LessonResponse = await res.json();
        setLessons(data.data);
      } catch (err: any) {
        setError(err.message);
        addToast("error", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
  }, [stageId, token, addToast]);

  const handleViewLesson = (lessonId: string) => {
    addToast("info", `Navegar a ver la lección: ${lessonId}`);
  };

  const handleTakeExam = (lessonId: string) => {
    addToast("info", `Navegar a tomar el examen de la lección: ${lessonId}`);
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <h1 className="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-white">
        Lecciones de la Etapa
      </h1>

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
            <Card key={lesson.id} className="flex h-full flex-col">
              <div className="grow">
                <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {lesson.name}
                </h5>
                <p className="font-normal text-gray-700 dark:text-gray-400">
                  {lesson.description}
                </p>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  color="blue"
                  onClick={() => handleViewLesson(lesson.id)}
                >
                  Ver lección
                </Button>
                <Button
                  color="success"
                  onClick={() => handleTakeExam(lesson.id)}
                >
                  Tomar examen
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
    </div>
  );
}
