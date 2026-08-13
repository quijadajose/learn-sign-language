import { Button, Card, Spinner } from "flowbite-react";
import { QuizOptionDisplay } from "./QuizOptionDisplay";

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
}

interface Answer {
  questionId: string;
  optionId: string;
}

interface QuizQuestionsFormProps {
  questions: QuizQuestion[];
  answers: Answer[];
  submitting: boolean;
  onAnswerSelect: (questionId: string, optionId: string) => void;
  onSubmit: () => void;
}

export function QuizQuestionsForm({
  questions,
  answers,
  submitting,
  onAnswerSelect,
  onSubmit,
}: QuizQuestionsFormProps) {
  return (
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
        {questions.map((question, questionIndex) => (
          <div
            key={question.id}
            className="rounded-lg border border-gray-200 p-6 dark:border-gray-700"
          >
            <h3 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              Pregunta {questionIndex + 1}: {question.text}
            </h3>

            <div className="space-y-3">
              {question.options.map((option) => {
                const isSelected = answers.some(
                  (a) => a.questionId === question.id && a.optionId === option.id,
                );

                return (
                  <div key={option.id} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      aria-label={option.text}
                      checked={isSelected}
                      onChange={() => onAnswerSelect(question.id, option.id)}
                      className="size-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <QuizOptionDisplay text={option.text} />
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
          onClick={onSubmit}
          disabled={submitting || answers.length !== questions.length}
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
          Respondidas: {answers.length} de {questions.length} preguntas
        </p>
      </div>
    </Card>
  );
}
