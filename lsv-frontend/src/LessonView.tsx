import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Spinner, Button, Alert } from "flowbite-react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useToast } from "./components/ToastProvider";
import { BACKEND_BASE_URL } from "./config";
import { HiExclamationCircle, HiArrowLeft } from "react-icons/hi";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

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

export default function LessonView() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
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
      try {
        const res = await fetch(
          `${BACKEND_BASE_URL}/users/lesson/${lessonId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        
        if (!res.ok) throw new Error(await res.text());
        const lessonData: Lesson = await res.json();
        setLesson(lessonData);

        await fetch(`${BACKEND_BASE_URL}/user-lesson/start`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            lessonId: lessonId,
          }),
        });

        addToast("success", "Lección iniciada correctamente");
      } catch (err: any) {
        setError(err.message);
        addToast("error", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId, token, addToast]);

  const handleMarkAsComplete = async () => {
    if (!token || !lessonId) return;

    setUpdatingCompletion(true);
    try {
      const newCompletionStatus = !isComplete;
      
      const res = await fetch(`${BACKEND_BASE_URL}/user-lesson/set-lesson-completion`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lessonId: lessonId,
          isComplete: newCompletionStatus,
        }),
      });

      if (!res.ok) throw new Error(await res.text());

      setIsComplete(newCompletionStatus);
      addToast(
        "success", 
        newCompletionStatus 
          ? "Lección marcada como completada" 
          : "Lección desmarcada como completada"
      );
    } catch (err: any) {
      addToast("error", err.message);
    } finally {
      setUpdatingCompletion(false);
    }
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

  if (!lesson) {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {lesson.name}
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
            {lesson.description}
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Contenido de la lección
          </h3>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <ReactQuill
              value={lesson.content}
              readOnly={true}
              theme="snow"
              modules={{
                toolbar: false,
              }}
              style={{
                backgroundColor: "#f9fafb",
                border: "none",
              }}
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
