import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { QuizDto } from '../../../domain/dto/quiz/quiz-dto.js';
import { CreateQuizWithQuestionsAndOptionsUseCase } from '../../use-cases/create-quiz-with-questions-and-options-use-case/create-quiz-with-questions-and-options-use-case.js';
import { PaginationDto } from '../../../../shared/domain/dto/PaginationDto.js';
import { Quiz } from '../../../../shared/domain/entities/quiz.js';
import { listQuizzesByLanguageIdUseCase } from '../../use-cases/list-quizzes-by-language-use-case/list-quizzes-by-language-use-case.js';
import { GetQuizByIdUseCase } from '../../use-cases/get-quiz-by-id-use-case/get-quiz-by-id-use-case.js';
import { SubmissionTestUseCase } from '../../use-cases/submission-test-use-case/submission-test-use-case.js';
import { SubmissionDto } from '../../dto/submission/submission-dto.js';
import { GetUserByIdUseCase } from '../../../../users/application/use-cases/get-user-by-id-use-case/get-user-by-id-use-case.js';
import { GetSubmissionTestFromUserUseCase } from '../../use-cases/get-submission-test-from-user-use-case/get-submission-test-from-user-use-case.js';
import { DeleteQuizUseCase } from '../../use-cases/delete-quiz-use-case/delete-quiz-use-case.js';
import { UpdateQuizUseCase } from '../../use-cases/update-quiz-use-case/update-quiz-use-case.js';
import { ListQuizUseCase } from '../../use-cases/list-quiz-use-case/list-quiz-use-case.js';
import { QuizRepositoryInterface } from '../../../domain/ports/quiz.repository.interface/quiz.repository.interface.js';
import { QuizVariantRepositoryInterface } from '../../../domain/ports/quiz-variant.repository.interface.js';

@Injectable()
export class QuizService {
  constructor(
    private readonly createQuizWithQuestionsAndOptionsUseCase: CreateQuizWithQuestionsAndOptionsUseCase,
    private readonly listQuizzesUseCase: listQuizzesByLanguageIdUseCase,
    private readonly listAllQuizzesUseCase: ListQuizUseCase,
    private readonly getQuizByIdUseCase: GetQuizByIdUseCase,
    private readonly submissionTestUseCase: SubmissionTestUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly getSubmissionTestFromUserUseCase: GetSubmissionTestFromUserUseCase,
    private readonly deleteQuizUseCase: DeleteQuizUseCase,
    private readonly updateQuizUseCase: UpdateQuizUseCase,
    @Inject('QuizRepositoryInterface')
    private readonly quizRepository: QuizRepositoryInterface,
    @Inject('QuizVariantRepositoryInterface')
    private readonly quizVariantRepository: QuizVariantRepositoryInterface,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}
  createQuiz(quizDto: QuizDto) {
    return this.createQuizWithQuestionsAndOptionsUseCase.execute(quizDto);
  }
  listQuizzesByLanguageId(
    languageId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.listQuizzesUseCase.execute(languageId, pagination);
  }
  /** Idioma de un quiz base (vía su lección) o de una variante (vía su región). */
  private async languageIdForQuizOrVariant(
    quizId: string,
  ): Promise<string | null> {
    const base = await this.dataSource.query(
      `SELECT l."languageId" AS "languageId" FROM quiz q
         JOIN lesson l ON l.id = q."lessonId" WHERE q.id = $1`,
      [quizId],
    );
    if (base.length > 0) return base[0].languageId;
    const variant = await this.dataSource.query(
      `SELECT r."languageId" AS "languageId" FROM quiz_variant qv
         JOIN lesson_variant lv ON lv.id = qv."lessonVariantId"
         JOIN region r ON r.id = lv."regionId" WHERE qv.id = $1`,
      [quizId],
    );
    return variant.length > 0 ? variant[0].languageId : null;
  }

  /** Solo admins/moderadores o alumnos inscritos en el idioma pueden ver o responder el quiz. */
  async assertCanTakeQuiz(
    user: { id?: string; sub?: string; role?: string } | undefined,
    quizId: string,
  ): Promise<void> {
    if (!user) {
      throw new ForbiddenException('errors.permission.unauthenticated');
    }
    if (user.role === 'admin' || user.role === 'moderator') return;
    const languageId = await this.languageIdForQuizOrVariant(quizId);
    if (!languageId) return; // el quiz no existe: la ruta responde 404
    const userId = user.sub || user.id;
    const rows = await this.dataSource.query(
      `SELECT 1 FROM user_language WHERE "userId" = $1 AND "languageId" = $2 LIMIT 1`,
      [userId, languageId],
    );
    if (rows.length === 0) {
      throw new ForbiddenException('errors.quiz.notEnrolledInLanguage');
    }
  }

  getQuizById(quizId: string) {
    return this.getQuizByIdUseCase.execute(quizId);
  }
  async submissionTest(
    userId: string,
    quizId: string,
    submission: SubmissionDto,
  ) {
    if (!userId || !quizId) {
      throw new BadRequestException('errors.quiz.userAndQuizRequired');
    }

    const user = await this.getUserByIdUseCase.execute(userId);
    if (!user) {
      throw new NotFoundException('errors.user.notFound');
    }
    await this.assertCanTakeQuiz(user, quizId);

    // Primero intentar obtener un quiz normal
    let quiz: Quiz | null = null;
    try {
      quiz = await this.getQuizByIdUseCase.execute(quizId);
    } catch {
      // Si no se encuentra el quiz normal, continuar para buscar quiz variant
    }

    if (quiz) {
      return this.submissionTestUseCase.execute(user, quiz, submission);
    }

    // Si no se encuentra quiz normal, intentar obtener un quiz variant
    const quizVariant = await this.quizVariantRepository.findById(quizId);
    if (quizVariant) {
      // Convertir SubmissionDto a Submission (dominio)
      const submissionDomain = {
        answers: submission.answers.map((answer) => ({
          questionId: answer.questionId,
          optionId: answer.optionId,
        })),
      };
      return this.quizVariantRepository.submissionTest(
        user,
        quizVariant,
        submissionDomain,
      );
    }

    throw new NotFoundException('errors.quiz.notFound');
  }
  async getQuizSubmissionTestFromUser(
    userId: string,
    quizId: string,
    pagination: PaginationDto,
  ) {
    if (!userId || !quizId) {
      throw new BadRequestException('errors.quiz.userAndQuizRequired');
    }

    const user = await this.getUserByIdUseCase.execute(userId);
    if (!user) {
      throw new NotFoundException('errors.user.notFound');
    }

    const quiz = await this.getQuizByIdUseCase.execute(quizId);
    if (!quiz) {
      throw new NotFoundException('errors.quiz.notFound');
    }
    return this.getSubmissionTestFromUserUseCase.execute(
      user,
      quiz,
      pagination,
    );
  }

  async deleteQuiz(id: string): Promise<void> {
    return await this.deleteQuizUseCase.execute(id);
  }

  async updateQuiz(id: string, quizDto: QuizDto): Promise<Quiz> {
    return await this.updateQuizUseCase.execute(id, quizDto);
  }

  async getAllQuizzes(pagination: PaginationDto): Promise<Quiz[]> {
    return await this.listAllQuizzesUseCase.execute(pagination);
  }

  async getQuizForAdmin(quizId: string): Promise<Quiz> {
    return await this.quizRepository.getQuizForAdmin(quizId);
  }
}
