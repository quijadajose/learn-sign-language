import { Lesson } from '../../shared/domain/entities/lesson.js';
import { LessonVariant } from '../../shared/domain/entities/lessonVariant.js';
import {
  stripLessonQuizAnswers,
  stripLessonVariantQuizAnswers,
} from './strip-quiz-answers.js';

describe('strip-quiz-answers (BE-01)', () => {
  it('removes isCorrect from lesson quiz options', () => {
    const lesson = {
      id: 'l1',
      quizzes: [
        {
          id: 'q1',
          questions: [
            {
              id: 'qq1',
              options: [
                { id: 'o1', text: 'a', isCorrect: true },
                { id: 'o2', text: 'b', isCorrect: false },
              ],
            },
          ],
        },
      ],
    } as unknown as Lesson;

    const out = stripLessonQuizAnswers(lesson);

    expect(JSON.stringify(out)).not.toContain('isCorrect');
    expect(JSON.stringify(out)).toContain('"text":"a"');
  });

  it('removes isCorrect from regional variant quiz options', () => {
    const variant = {
      id: 'v1',
      quizVariants: [
        {
          id: 'qv1',
          questionVariants: [
            {
              id: 'qqv1',
              optionVariants: [
                { id: 'ov1', text: 'a', isCorrect: true },
                { id: 'ov2', text: 'b', isCorrect: false },
              ],
            },
          ],
        },
      ],
    } as unknown as LessonVariant;

    const out = stripLessonVariantQuizAnswers(variant);

    expect(JSON.stringify(out)).not.toContain('isCorrect');
    expect(JSON.stringify(out)).toContain('"text":"b"');
    // La entrada original no se muta.
    expect(JSON.stringify(variant)).toContain('isCorrect');
  });

  it('returns the variant unchanged when it carries no quizVariants', () => {
    const variant = {
      id: 'v2',
      name: 'sin quizzes',
    } as unknown as LessonVariant;
    expect(stripLessonVariantQuizAnswers(variant)).toBe(variant);
  });
});
