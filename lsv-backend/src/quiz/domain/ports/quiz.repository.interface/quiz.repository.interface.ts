import { QuizDto } from 'src/quiz/application/dtos/quiz-dto/quiz-dto';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';
import { Quiz } from 'src/shared/domain/entities/quiz';

export interface QuizRepositoryInterface {
  findById(id: string): Promise<Quiz | null>;
  findAll(pagination: PaginationDto): Promise<Quiz[]>;
  save(quiz: Quiz): Promise<Quiz>;
  deleteById(id: string): Promise<void>;
  update(id: string, quiz: QuizDto): Promise<Quiz>;
  saveWithQuestionsAndOptions(quizDto: QuizDto): Promise<Quiz>;
}
