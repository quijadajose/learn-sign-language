import { Lesson } from '../../shared/domain/entities/lesson.js';
import { LessonVariant } from '../../shared/domain/entities/lessonVariant.js';
import { Quiz } from '../../shared/domain/entities/quiz.js';

function stripOptionFlags<T extends Record<string, unknown>>(option: T): T {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isCorrect, ...rest } = option;
  return rest as T;
}

export function stripQuizAnswerFlags(quiz: Quiz): Quiz {
  return {
    ...quiz,
    questions: (quiz.questions ?? []).map((question) => ({
      ...question,
      options: (question.options ?? []).map((option) =>
        stripOptionFlags(option as unknown as Record<string, unknown>),
      ),
    })),
  } as unknown as Quiz;
}

export function stripLessonQuizAnswers(lesson: Lesson): Lesson {
  if (!lesson.quizzes) {
    return lesson;
  }
  return {
    ...lesson,
    quizzes: lesson.quizzes.map((quiz) => stripQuizAnswerFlags(quiz)),
  };
}

/**
 * BE-01: las variantes regionales exponen sus quizzes por `quizVariants`,
 * una estructura distinta de `Lesson.quizzes`. Sin esta limpieza, cualquier
 * relación que se cargue en el futuro filtraría `isCorrect`.
 */
export function stripLessonVariantQuizAnswers(
  variant: LessonVariant,
): LessonVariant {
  if (!variant.quizVariants) {
    return variant;
  }
  return {
    ...variant,
    quizVariants: variant.quizVariants.map((quizVariant) => ({
      ...quizVariant,
      questionVariants: (quizVariant.questionVariants ?? []).map(
        (questionVariant) => ({
          ...questionVariant,
          optionVariants: (questionVariant.optionVariants ?? []).map((option) =>
            stripOptionFlags(option as unknown as Record<string, unknown>),
          ),
        }),
      ),
    })),
  } as unknown as LessonVariant;
}
