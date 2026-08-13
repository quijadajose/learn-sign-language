import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Spinner, Button, Alert } from "flowbite-react";
import { useAuth } from "./context/AuthContext";
import { useToast } from "./components/ToastProvider";
import { HiExclamationCircle, HiArrowLeft } from "react-icons/hi";
import confetti from "canvas-confetti";
import { quizApi, unwrapApiList } from "./services/api";
import { QuizSubmissionCard } from "./QuizSubmissionCard";
import { QuizQuestionsForm } from "./QuizQuestionsForm";

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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [submission, setSubmission] = useState<QuizSubmission | null>(null);
  const { token } = useAuth();
  const addToast = useToast();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!token || !lessonId) {
        setError("Faltan datos para cargar el quiz.");
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const regionId = searchParams.get("regionId");
        const response = await quizApi.getQuizByLesson(
          lessonId,
          regionId || undefined,
        );
        if (cancelled) return;

        if (response.success) {
          const quizData = unwrapApiList<Quiz>(response.data);

          if (quizData.length === 0) {
            setError("No hay quizzes disponibles para esta lección.");
            return;
          }

          setQuiz(quizData[0]);
        } else {
          setError(response.message || "Error al cargar el quiz");
          addToast("error", response.message || "Error al cargar el quiz");
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lessonId, token, addToast, searchParams]);

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const existing = prev.find((a) => a.questionId === questionId);
      if (existing) {
        return prev.map((a) =>
          a.questionId === questionId ? { questionId, optionId } : a,
        );
      }
      return [...prev, { questionId, optionId }];
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

    setSubmitting(true);

    try {
      const response = await quizApi.submitQuiz(quiz.id, answers);

      if (response.success) {
        const submissionData: QuizSubmission = response.data;
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
      } else {
        addToast("error", response.message || "Error al enviar el quiz");
      }
    } finally {
      setSubmitting(false);
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
            <HiArrowLeft className="mr-2 size-4" />
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

      {submission ? (
        <QuizSubmissionCard
          score={submission.score}
          submittedAt={submission.submittedAt}
        />
      ) : (
        <QuizQuestionsForm
          questions={quiz.questions}
          answers={answers}
          submitting={submitting}
          onAnswerSelect={handleAnswerSelect}
          onSubmit={handleSubmitQuiz}
        />
      )}
    </div>
  );
}
