import { Card, Button, Badge } from "flowbite-react";
import { HiPlus, HiTrash, HiPencil, HiExclamationCircle } from "react-icons/hi";
import { Quiz } from "./types";

interface QuizListProps {
  quizzes: Quiz[];
  onCreateQuiz: () => void;
  onEditQuiz: (quiz: Quiz) => void;
  onDeleteQuiz: (quizId: string) => void;
}

export default function QuizList({
  quizzes,
  onCreateQuiz,
  onEditQuiz,
  onDeleteQuiz,
}: QuizListProps) {
  if (quizzes.length === 0) {
    return (
      <Card>
        <div className="py-8 text-center">
          <HiExclamationCircle className="mx-auto size-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No hay quizzes
          </h3>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Esta lección no tiene quizzes creados aún.
          </p>
          <Button color="success" onClick={onCreateQuiz} className="mt-4">
            <HiPlus className="mr-2 size-4" />
            Crear Primer Quiz
          </Button>
        </div>
      </Card>
    );
  }

  return (
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
              <Button size="sm" color="blue" onClick={() => onEditQuiz(quiz)}>
                <HiPencil className="size-4" />
              </Button>
              <Button
                size="sm"
                color="failure"
                onClick={() => onDeleteQuiz(quiz.id)}
              >
                <HiTrash className="size-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
