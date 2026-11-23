import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LeaderboardDto } from '../../../../leaderboard/domain/dto/leaderboard/leaderboard.js';
import { QuizDto } from '../../../domain/dto/quiz/quiz-dto.js';
import { Submission } from '../../../domain/dto/submission/submission.dto.js';
import { QuizRepositoryInterface } from '../../../domain/ports/quiz.repository.interface/quiz.repository.interface.js';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { Lesson } from '../../../../shared/domain/entities/lesson.js';
import { Option } from '../../../../shared/domain/entities/option.js';
import { Question } from '../../../../shared/domain/entities/question.js';
import { Quiz } from '../../../../shared/domain/entities/quiz.js';
import { QuizSubmission } from '../../../../shared/domain/entities/quizSubmission.js';
import { User } from '../../../../shared/domain/entities/user.js';
import { FindManyOptions, Repository, SelectQueryBuilder } from 'typeorm';
import { pickSafeOrderBy } from '../../../../shared/infrastructure/safe-order-by.js';

/** Intentos máximos de un alumno por quiz (la nota completa se mantiene). */
const MAX_QUIZ_ATTEMPTS = 3;

export class QuizRepository implements QuizRepositoryInterface {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Option)
    private readonly optionRepository: Repository<Option>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(QuizSubmission)
    private readonly submissionRepository: Repository<QuizSubmission>,
  ) {}
  findById(id: string): Promise<Quiz | null> {
    return this.quizRepository.findOne({ where: { id } });
  }
  findAll(pagination: PaginationDto): Promise<Quiz[]> {
    const {
      page,
      limit,
      orderBy = undefined,
      sortOrder = undefined,
    } = pagination;

    const skip = (page - 1) * limit;

    const findOptions: FindManyOptions<Quiz> = {
      skip,
      take: limit,
    };

    const safeOrderBy = pickSafeOrderBy(orderBy, ['id']);
    if (safeOrderBy && sortOrder) {
      findOptions.order = {
        [safeOrderBy]: sortOrder,
      };
    }
    return this.quizRepository.find(findOptions);
  }
  save(quiz: Quiz): Promise<Quiz> {
    return this.quizRepository.save(quiz);
  }
  async deleteById(id: string): Promise<void> {
    await this.quizRepository.delete(id);
  }
  update(id: string, quiz: QuizDto): Promise<Quiz> {
    this.quizRepository.update(id, quiz);
    return this.quizRepository.findOne({ where: { id } });
  }

  async updateQuizWithQuestionsAndOptions(
    id: string,
    quizDto: QuizDto,
  ): Promise<Quiz> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: quizDto.lessonId },
      relations: { language: true },
    });

    if (!lesson) {
      throw new NotFoundException('errors.lesson.notFound');
    }

    const existingQuiz = await this.quizRepository.findOne({
      where: { id },
      relations: {
        lesson: { language: true },
        questions: {
          options: true,
        },
      },
    });

    if (!existingQuiz) {
      throw new NotFoundException('errors.quiz.notFound');
    }

    // BE-06: el quiz no puede pasarse a una lección de otro idioma en un PUT.
    if (existingQuiz.lesson?.language?.id !== lesson.language?.id) {
      throw new BadRequestException('errors.quiz.languageImmutable');
    }

    // BE-20: borrar y recrear preguntas/opciones en una sola transacción.
    // Si algo falla a mitad, el quiz conserva su contenido anterior.
    return this.quizRepository.manager.transaction(async (em) => {
      const quizRepo = em.getRepository(Quiz);
      const questionRepo = em.getRepository(Question);
      const optionRepo = em.getRepository(Option);

      for (const question of existingQuiz.questions ?? []) {
        await optionRepo.delete({ question: { id: question.id } });
        await questionRepo.delete({ id: question.id });
      }

      const questions: Question[] = [];
      for (const q of quizDto.questions) {
        const savedQuestion = await questionRepo.save(
          questionRepo.create({ text: q.text, quiz: existingQuiz }),
        );
        const options: Option[] = [];
        for (const o of q.options) {
          options.push(
            await optionRepo.save(
              optionRepo.create({
                text: o.text,
                isCorrect: o.isCorrect,
                question: savedQuestion,
              }),
            ),
          );
        }
        savedQuestion.options = options;
        questions.push(savedQuestion);
      }

      existingQuiz.questions = questions;
      return quizRepo.save(existingQuiz);
    });
  }

  async saveWithQuestionsAndOptions(quizDto: QuizDto): Promise<Quiz> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: quizDto.lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('errors.lesson.notFound');
    }

    const quiz = this.quizRepository.create({ lesson });

    const savedQuiz = await this.quizRepository.save(quiz);

    const questions = await Promise.all(
      quizDto.questions.map(async (q) => {
        const question = this.questionRepository.create({
          text: q.text,
          quiz: savedQuiz,
        });
        const savedQuestion = await this.questionRepository.save(question);

        const options = await Promise.all(
          q.options.map(async (o) => {
            const option = this.optionRepository.create({
              text: o.text,
              isCorrect: o.isCorrect,
              question: savedQuestion,
            });
            return this.optionRepository.save(option);
          }),
        );

        savedQuestion.options = options;
        return savedQuestion;
      }),
    );

    savedQuiz.questions = questions;
    return savedQuiz;
  }

  listQuizzesByLanguageId(
    languageId: string,
    pagination: PaginationDto,
  ): Promise<Quiz[]> {
    const {
      page,
      limit,
      orderBy = undefined,
      sortOrder = undefined,
    } = pagination;

    const skip = (page - 1) * limit;

    const findOptions: FindManyOptions = {
      where: {
        lesson: {
          language: {
            id: languageId,
          },
        },
      },
      relations: { lesson: { language: true } },
      skip,
      take: limit,
    };

    if (orderBy && sortOrder) {
      const safeOrderBy = pickSafeOrderBy(orderBy, ['id']);
      if (safeOrderBy) {
        findOptions.order = {
          [safeOrderBy]: sortOrder,
        };
      }
    }
    return this.quizRepository.find(findOptions);
  }

  getQuizById(quizId: string): Promise<Quiz> {
    return this.quizRepository.findOne({
      where: { id: quizId },
      relations: {
        lesson: true,

        questions: {
          options: true,
        },
      },
      select: {
        id: true,
        lesson: {
          id: true,
          name: true,
        },
        questions: {
          id: true,
          text: true,
          options: {
            id: true,
            text: true,
          },
        },
      },
    });
  }

  getQuizForAdmin(quizId: string): Promise<Quiz> {
    return this.quizRepository.findOne({
      where: { id: quizId },
      relations: {
        lesson: true,

        questions: {
          options: true,
        },
      },
      select: {
        id: true,
        lesson: {
          id: true,
          name: true,
        },
        questions: {
          id: true,
          text: true,
          options: {
            id: true,
            text: true,
            isCorrect: true,
          },
        },
      },
    });
  }
  async submissionTest(
    user: User,
    quiz: Quiz,
    submissionDto: Submission,
  ): Promise<{ id: string; submittedAt: Date; score: number }> {
    const correctOptions = await this.optionRepository.find({
      where: {
        question: {
          quiz: { id: quiz.id },
        },
        isCorrect: true,
      },
      relations: {
        question: true,
      },
    });

    const correctAnswersMap = new Map<string, string>(); // questionId -> optionId
    correctOptions.forEach((option) => {
      correctAnswersMap.set(option.question.id, option.id);
    });

    // Intentos limitados: evita deducir la respuesta correcta repitiendo envíos.
    const previousAttempts = await this.submissionRepository.count({
      where: { user: { id: user.id }, quiz: { id: quiz.id } },
    });
    if (previousAttempts >= MAX_QUIZ_ATTEMPTS) {
      throw new ForbiddenException('errors.quiz.attemptLimitReached');
    }

    // Envío completo obligatorio: no se puede puntuar una sola pregunta aislada.
    const submittedQuestionIds = new Set(
      submissionDto.answers.map((answer) => answer.questionId),
    );
    const allAnswered = [...correctAnswersMap.keys()].every((questionId) =>
      submittedQuestionIds.has(questionId),
    );
    if (!allAnswered) {
      throw new BadRequestException('errors.quiz.incompleteSubmission');
    }

    // Cada pregunta puntúa una sola vez: se ignoran respuestas repetidas
    // o de preguntas que no pertenecen al quiz (no tienen entrada en el mapa).
    const answeredQuestionIds = new Set<string>();
    let correctCount = 0;
    for (const submission of submissionDto.answers) {
      if (answeredQuestionIds.has(submission.questionId)) {
        continue;
      }
      answeredQuestionIds.add(submission.questionId);
      if (
        correctAnswersMap.get(submission.questionId) === submission.optionId
      ) {
        correctCount++;
      }
    }

    // Total = número de preguntas con respuesta correcta, no de opciones.
    const totalQuestions = correctAnswersMap.size;
    const score =
      totalQuestions > 0
        ? Math.min(100, (correctCount / totalQuestions) * 100)
        : 0;
    const submission = this.submissionRepository.create({
      user: user,
      quiz: quiz,
      answers: JSON.stringify(submissionDto.answers) as unknown as JSON,
      score: Math.round(score),
    });
    const savedSubmission = await this.submissionRepository.save(submission);
    const { id, submittedAt } = savedSubmission;
    return { id, submittedAt, score };
  }
  getSubmissionsByUserId(
    user: User,
    quiz: Quiz,
    pagination: PaginationDto,
  ): Promise<QuizSubmission[]> {
    const {
      page,
      limit,
      orderBy = undefined,
      sortOrder = undefined,
    } = pagination;

    const skip = (page - 1) * limit;

    const findOptions: FindManyOptions = {
      where: {
        quiz: { id: quiz.id },
        user: { id: user.id },
      },
      skip,
      take: limit,
    };

    if (orderBy && sortOrder) {
      const safeOrderBy = pickSafeOrderBy(orderBy, [
        'id',
        'score',
        'submittedAt',
      ]);
      if (safeOrderBy) {
        findOptions.order = {
          [safeOrderBy]: sortOrder,
        };
      }
    }

    return this.submissionRepository.find(findOptions);
  }

  getLeaderboard(
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<LeaderboardDto>> {
    return this.buildLeaderboardPage(pagination);
  }

  getLeaderboardByLanguageId(
    languageId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<LeaderboardDto>> {
    return this.buildLeaderboardPage(pagination, (qb) =>
      qb
        .leftJoin('qs.quiz', 'q')
        .leftJoin('q.lesson', 'l')
        .leftJoin('qs.quizVariant', 'qv')
        .leftJoin('qv.lessonVariant', 'lv')
        .leftJoin('lv.baseLesson', 'l2')
        .andWhere('COALESCE(l.languageId, l2.languageId) = :languageId', {
          languageId,
        }),
    );
  }

  /**
   * BE-07: antes el SUM se hacía sobre un JOIN de *todas* las filas de
   * quiz_submission contra el subquery de máximos, así que el mejor puntaje de
   * cada quiz se sumaba una vez por cada envío (quien más repetía, más sumaba).
   * Además `.skip()/.take()` con joins y `getRawMany()` no genera LIMIT/OFFSET
   * en TypeORM, por lo que se devolvía el ranking completo.
   *
   * Ahora se agrega solo sobre el subquery (una fila por usuario y quiz con su
   * puntaje máximo) y se pagina con `.offset()/.limit()`. El tamaño de página
   * ya está acotado por PaginationDto (por defecto 10, máximo 100).
   */
  private async buildLeaderboardPage(
    pagination: PaginationDto,
    scope: (
      qb: SelectQueryBuilder<QuizSubmission>,
    ) => SelectQueryBuilder<QuizSubmission> = (qb) => qb,
  ): Promise<PaginatedResponseDto<LeaderboardDto>> {
    const {
      page = 1,
      limit = 10,
      orderBy = 'totalScore',
      sortOrder = 'DESC',
    } = pagination;
    const safeOrderBy =
      pickSafeOrderBy(
        orderBy,
        ['totalScore', 'firstName', 'lastName', 'userId'],
        'totalScore',
      ) ?? 'totalScore';
    const direction = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // Una fila por (usuario, quiz o variante) con el mejor puntaje obtenido.
    const bestScorePerQuiz = (
      qb: SelectQueryBuilder<unknown>,
    ): SelectQueryBuilder<QuizSubmission> =>
      scope(
        qb
          .select('qs.userId', 'userId')
          .addSelect('MAX(qs.score)', 'maxScore')
          .from(QuizSubmission, 'qs')
          .where('qs.score IS NOT NULL'),
      )
        .groupBy('qs.userId')
        .addGroupBy('COALESCE(qs.quizId, qs.quizVariantId)');

    const totalResult = await this.submissionRepository.manager
      .createQueryBuilder()
      .select('COUNT(DISTINCT "best"."userId")', 'count')
      .from((qb) => bestScorePerQuiz(qb.subQuery()), 'best')
      .getRawOne<{ count: string }>();
    const total = totalResult ? parseInt(totalResult.count, 10) : 0;

    const rawLeaderboard = await this.submissionRepository.manager
      .createQueryBuilder()
      .select('u.id', 'userId')
      .addSelect('u.firstName', 'firstName')
      .addSelect('u.lastName', 'lastName')
      .addSelect('SUM("best"."maxScore")', 'totalScore')
      .from((qb) => bestScorePerQuiz(qb.subQuery()), 'best')
      .innerJoin(User, 'u', 'u.id = "best"."userId"')
      .groupBy('u.id')
      .addGroupBy('u.firstName')
      .addGroupBy('u.lastName')
      .orderBy(safeOrderBy, direction)
      // Desempate estable para que las páginas no se solapen.
      .addOrderBy('userId', 'ASC')
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<{
        userId: string;
        firstName: string;
        lastName: string;
        totalScore: string | number;
      }>();

    const leaderboard: LeaderboardDto[] = rawLeaderboard.map((entry) => ({
      userId: entry.userId,
      firstName: entry.firstName,
      lastName: entry.lastName,
      totalScore: Number(entry.totalScore),
    }));

    return new PaginatedResponseDto(leaderboard, total, page, limit);
  }
}
