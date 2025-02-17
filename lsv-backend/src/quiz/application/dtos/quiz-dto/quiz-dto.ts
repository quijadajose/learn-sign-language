import { QuestionDto } from '../question-dto/question-dto';

export class QuizDto {
  lessonId: string;
  questions: QuestionDto[];
}
