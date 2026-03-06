import { QuizVariant } from 'src/shared/domain/entities/quizVariant';
import { User } from 'src/shared/domain/entities/user';
import { Submission } from '../dto/submission/submission.dto';

export interface QuizVariantRepositoryInterface {
  findByLessonVariantId(lessonVariantId: string): Promise<QuizVariant[]>;
  findById(id: string): Promise<QuizVariant | null>;
  create(quizVariant: Partial<QuizVariant>): Promise<QuizVariant>;
  update(id: string, quizVariant: Partial<QuizVariant>): Promise<QuizVariant>;
  delete(id: string): Promise<void>;
  createWithQuestions(
    lessonVariantId: string,
    questions: Array<{
      question: string;
      options: Array<{ text: string; isCorrect: boolean }>;
    }>,
  ): Promise<QuizVariant>;
  updateWithQuestions(
    id: string,
    lessonVariantId: string,
    questions: Array<{
      question: string;
      options: Array<{ text: string; isCorrect: boolean }>;
    }>,
  ): Promise<QuizVariant>;
  submissionTest(
    user: User,
    quizVariant: QuizVariant,
    submission: Submission,
  ): Promise<{ id: string; submittedAt: Date; score: number }>;
}
