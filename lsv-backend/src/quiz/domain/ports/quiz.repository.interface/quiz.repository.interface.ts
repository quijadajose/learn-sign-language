import { LeaderboardDto } from '../../../../leaderboard/domain/dto/leaderboard/leaderboard.js';
import { QuizDto } from '../../dto/quiz/quiz-dto.js';
import { Submission } from '../../dto/submission/submission.dto.js';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { Quiz } from '../../../../shared/domain/entities/quiz.js';
import { QuizSubmission } from '../../../../shared/domain/entities/quizSubmission.js';
import { User } from '../../../../shared/domain/entities/user.js';

export interface QuizRepositoryInterface {
  findById(id: string): Promise<Quiz | null>;
  findAll(pagination: PaginationDto): Promise<Quiz[]>;
  save(quiz: Quiz): Promise<Quiz>;
  deleteById(id: string): Promise<void>;
  update(id: string, quiz: QuizDto): Promise<Quiz>;
  updateQuizWithQuestionsAndOptions(
    id: string,
    quizDto: QuizDto,
  ): Promise<Quiz>;
  saveWithQuestionsAndOptions(quizDto: QuizDto): Promise<Quiz>;
  listQuizzesByLanguageId(
    languageId: string,
    pagination: PaginationDto,
  ): Promise<Quiz[]>;
  getSubmissionsByUserId(
    user: User,
    quiz: Quiz,
    pagination: PaginationDto,
  ): Promise<QuizSubmission[]>;
  submissionTest(
    user: User,
    quiz: Quiz,
    submission: Submission,
  ): Promise<{ id: string; submittedAt: Date; score: number }>;
  getLeaderboard(
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<LeaderboardDto>>;
  getLeaderboardByLanguageId(
    languageId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<LeaderboardDto>>;
  getQuizById(quizId: string): Promise<Quiz>;
  getQuizForAdmin(quizId: string): Promise<Quiz>;
}
