import { Button, Card, Spinner } from "flowbite-react";
import { useTranslation } from "react-i18next";
import { CMS_CONTENT_LANG } from "./i18n";
import { optionLetter, QuizOptionDisplay } from "./QuizOptionDisplay";

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
  const { t } = useTranslation("learn");

  return (
    <Card>
      <div className="mb-6">
        <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-white">
          {t("quiz.title")}
        </h1>
        <p className="mb-6 text-lg text-gray-700 dark:text-gray-300">
          {t("quiz.intro")}
        </p>
      </div>

      <div className="space-y-8">
        {questions.map((question, questionIndex) => (
          <fieldset
            key={question.id}
            className="rounded-lg border border-gray-200 p-6 dark:border-gray-700"
          >
            <legend className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
              {t("quiz.questionPrefix", { n: questionIndex + 1 })}{" "}
              <span lang={CMS_CONTENT_LANG}>{question.text}</span>
            </legend>

            <div className="space-y-3">
              {question.options.map((option, optionIndex) => {
                const isSelected = answers.some(
                  (a) => a.questionId === question.id && a.optionId === option.id,
                );
                const optionId = `quiz-${question.id}-${option.id}`;
                const letter = optionLetter(optionIndex);

                return (
                  <div key={option.id} className="flex items-center gap-3">
                    <input
                      id={optionId}
                      type="radio"
                      name={`question-${question.id}`}
                      checked={isSelected}
                      onChange={() => onAnswerSelect(question.id, option.id)}
                      className="size-4 text-blue-600"
                    />
                    <label htmlFor={optionId} className="flex-1 cursor-pointer">
                      <QuizOptionDisplay
                        text={option.text}
                        alt={t("quiz.signOptionAlt", { letter })}
                        caption={t("quiz.optionCaption", { letter })}
                      />
                    </label>
                  </div>
                );
              })}
            </div>
          </fieldset>
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
              <Spinner size="sm" className="mr-2" aria-hidden="true" />
              {t("quiz.submitting")}
            </>
          ) : (
            t("quiz.submit")
          )}
        </Button>
      </div>

      <div className="mt-4 text-center" aria-live="polite">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t("quiz.answered", {
            current: answers.length,
            total: questions.length,
          })}
        </p>
      </div>
    </Card>
  );
}
