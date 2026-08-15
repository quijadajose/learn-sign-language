import { Lesson } from 'src/shared/domain/entities/lesson';
import { Quiz } from 'src/shared/domain/entities/quiz';

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
