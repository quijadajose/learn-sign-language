import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Spinner, Button, Alert } from "flowbite-react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useToast } from "./components/ToastProvider";
import { BACKEND_BASE_URL } from "./config";
import { HiExclamationCircle, HiArrowLeft, HiCheck, HiX } from "react-icons/hi";
import confetti from "canvas-confetti";

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
}

interface Quiz {
  id: string;
  questions: QuizQuestion[];
}

interface QuizSubmission {
  id: string;
  submittedAt: string;
  score: number;
}

interface Answer {
  questionId: string;
  optionId: string;
}

export default function QuizView() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const [token] = useLocalStorage<string | null>("auth", null);
  const addToast = useToast();

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!token || !lessonId) {
        setError("Faltan datos para cargar el quiz.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(
          `${BACKEND_BASE_URL}/lesson/${lessonId}/quizzes`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!res.ok) throw new Error(await res.text());
        const quizData: Quiz[] = await res.json();

        if (quizData.length === 0) {
          setError("No hay quizzes disponibles para esta lección.");
          return;
        }

        setQuiz(quizData[0]);
      } catch (err: any) {
        setError(err.message);
        addToast("error", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [lessonId, token, addToast]);

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === questionId);
      if (existing) {
        return prev.map((a) =>
          a.questionId === questionId ? { questionId, optionId } : a,
        );
      } else {
        return [...prev, { questionId, optionId }];
      }
    });
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || !token) return;

    if (answers.length !== quiz.questions.length) {
      addToast(
        "error",
        "Por favor responde todas las preguntas antes de enviar.",
      );
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(
        `${BACKEND_BASE_URL}/quiz/${quiz.id}/submissions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ answers }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Error al enviar el quiz");
      }

      const submissionData: QuizSubmission = await response.json();
      setSubmission(submissionData);

      if (submissionData.score >= 80) {
        addToast("success", "¡Felicitaciones! Has aprobado la lección");
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        addToast(
          "error",
          "Repasa e inténtalo de nuevo. Tu puntuación fue menor al 80%",
        );
      }
    } catch (err: any) {
      addToast("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
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

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <div className="text-center">
          <Spinner size="xl" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Cargando quiz...
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

  if (!quiz) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <Alert color="failure" icon={HiExclamationCircle}>
          No se encontró el quiz solicitado.
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

      {submission && (
        <Card className="mb-6">
          <div className="text-center">
            <div
              className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full ${
                submission.score >= 80
                  ? "bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-200"
                  : "bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-200"
              }`}
            >
              {submission.score >= 80 ? (
                <HiCheck className="h-8 w-8" />
              ) : (
                <HiX className="h-8 w-8" />
              )}
            </div>
            <h2
              className={`mb-2 text-2xl font-bold ${
                submission.score >= 80
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {submission.score >= 80
                ? "¡Aprobado!"
                : "Repasa e inténtalo de nuevo"}
            </h2>
            <p className="mb-4 text-lg text-gray-600 dark:text-gray-400">
              Has sacado{" "}
              <span className="font-semibold">{submission.score}</span> de 100
              puntos
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enviado el:{" "}
              {new Date(submission.submittedAt).toLocaleString("es-ES")}
            </p>
          </div>
        </Card>
      )}

      {!submission && (
        <Card>
          <div className="mb-6">
            <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
              Quiz de la Lección
            </h1>
            <p className="mb-6 text-lg text-gray-700 dark:text-gray-300">
              Responde todas las preguntas y luego envía tu quiz.
            </p>
          </div>

          <div className="space-y-8">
            {quiz.questions.map((question, questionIndex) => (
              <div
                key={question.id}
                className="rounded-lg border border-gray-200 p-6 dark:border-gray-700"
              >
                <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  Pregunta {questionIndex + 1}: {question.text}
                </h3>

                <div className="space-y-3">
                  {question.options.map((option) => {
                    const isSelected = answers.find(
                      (a) =>
                        a.questionId === question.id &&
                        a.optionId === option.id,
                    );

                    return (
                      <div key={option.id} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          checked={!!isSelected}
                          onChange={() =>
                            handleAnswerSelect(question.id, option.id)
                          }
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
                                Imagen
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-900 dark:text-white">
                              {option.text}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              color="success"
              size="lg"
              onClick={handleSubmitQuiz}
              disabled={submitting || answers.length !== quiz.questions.length}
            >
              {submitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Enviando...
                </>
              ) : (
                "Enviar Quiz"
              )}
            </Button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Respondidas: {answers.length} de {quiz.questions.length} preguntas
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
