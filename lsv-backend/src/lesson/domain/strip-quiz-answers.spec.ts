import { Quiz } from 'src/shared/domain/entities/quiz';
import {
  stripLessonQuizAnswers,
  stripQuizAnswerFlags,
} from './strip-quiz-answers';
import { Lesson } from 'src/shared/domain/entities/lesson';

describe('stripQuizAnswerFlags', () => {
  it('removes isCorrect from nested options', () => {
    const quiz = {
      id: 'q1',
      questions: [
        {
          id: 'n1',
          options: [
            { id: 'o1', text: 'A', isCorrect: true },
            { id: 'o2', text: 'B', isCorrect: false },
          ],
        },
      ],
    } as unknown as Quiz;

    const stripped = stripQuizAnswerFlags(quiz);
    expect(stripped.questions[0].options[0]).toEqual({ id: 'o1', text: 'A' });
    expect(stripped.questions[0].options[1]).toEqual({ id: 'o2', text: 'B' });
    expect(JSON.stringify(stripped)).not.toContain('isCorrect');
  });
});

describe('stripLessonQuizAnswers', () => {
  it('strips every nested quiz', () => {
    const lesson = {
      id: 'l1',
      quizzes: [
        {
          id: 'q1',
          questions: [{ options: [{ id: 'o1', isCorrect: true }] }],
        },
      ],
    } as unknown as Lesson;

    const stripped = stripLessonQuizAnswers(lesson);
    expect(JSON.stringify(stripped)).not.toContain('isCorrect');
  });
});
