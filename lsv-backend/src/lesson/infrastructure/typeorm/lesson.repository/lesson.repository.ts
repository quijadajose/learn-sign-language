import { NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { CreateLessonDto } from 'src/lesson/domain/dto/create-lesson/create-lesson-dto';
import { LessonRepositoryInterface } from 'src/lesson/domain/ports/lesson.repository.interface/lesson.repository.interface';
import {
  PaginationDto,
  PaginatedResponseDto,
} from 'src/shared/domain/dto/PaginationDto';
import { Language } from 'src/shared/domain/entities/language';
import { Lesson } from 'src/shared/domain/entities/lesson';
import { Quiz } from 'src/shared/domain/entities/quiz';
import { Stages } from 'src/shared/domain/entities/stage';
import { QuizSubmission } from 'src/shared/domain/entities/quizSubmission';
import { FindManyOptions, Repository, DataSource } from 'typeorm';
import { QuizService } from 'src/quiz/application/services/quiz/quiz.service';

export class LessonRepository implements LessonRepositoryInterface {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(Stages)
    private readonly stageRepository: Repository<Stages>,
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
    @InjectRepository(QuizSubmission)
    private readonly quizSubmissionRepository: Repository<QuizSubmission>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => QuizService))
    private readonly quizService: QuizService,
  ) {}
  async findPassedLessonIdsForUser(userId: string): Promise<Set<string>> {
    const submissions = await this.quizSubmissionRepository
      .createQueryBuilder('submission')
      .innerJoin('submission.quiz', 'quiz')
      .select('DISTINCT quiz.lessonId', 'lessonId')
      .where('submission.user.id = :userId', { userId })
      .andWhere('submission.score >= :minScore', { minScore: 80 })
      .getRawMany();

    const passedLessonIds = new Set<string>();
    for (const sub of submissions) {
      if (sub.lessonId) passedLessonIds.add(sub.lessonId);
    }
    return passedLessonIds;
  }

  findById(id: string): Promise<Lesson | null> {
    return this.lessonRepository.findOne({
      where: { id },
      relations: ['stage'],
    });
  }

  findByIdWithQuizzes(id: string): Promise<Lesson | null> {
    return this.lessonRepository.findOne({
      where: { id },
      relations: ['quizzes', 'quizzes.questions', 'quizzes.questions.options'],
    });
  }

  async findQuizzesByLessonId(id: string): Promise<Quiz[]> {
    const lesson = await this.findByIdWithQuizzes(id);
    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const quizzesToReturn = lesson.quizzes.map((quiz) => ({
      ...quiz,
      questions: quiz.questions.map((question) => ({
        ...question,
        options: question.options.map((option) => {
          const { isCorrect, ...rest } = option;
          return rest;
        }),
      })),
    }));

    return quizzesToReturn as Quiz[];
  }
  findByNameInLanguage(
    name: string,
    languageId: string,
  ): Promise<Lesson | null> {
    return this.lessonRepository.findOne({
      where: {
        name: name,
        language: { id: languageId },
      },
    });
  }
  findAll(pagination: PaginationDto): Promise<Lesson[]> {
    const {
      page,
      limit,
      orderBy = undefined,
      sortOrder = undefined,
    } = pagination;

    const skip = (page - 1) * limit;

    const findOptions: FindManyOptions = {
      skip,
      take: limit,
    };

    if (orderBy && sortOrder) {
      findOptions.order = {
        [orderBy]: sortOrder,
      };
    }
    return this.lessonRepository.find(findOptions);
  }
  save(lesson: Lesson): Promise<Lesson> {
    return this.lessonRepository.save(lesson);
  }
  async deleteById(id: string) {
    await this.lessonRepository.delete(id);
  }
  async update(id: string, lesson: CreateLessonDto): Promise<Lesson> {
    const language = await this.languageRepository.findOne({
      where: { id: lesson.languageId },
    });
    const stage = await this.stageRepository.findOne({
      where: { id: lesson.stageId },
    });

    if (!language) {
      throw new NotFoundException('Language not found');
    }

    if (!stage) {
      throw new NotFoundException('Stage not found');
    }

    const existingLesson = await this.lessonRepository.findOne({
      where: { id },
    });
    if (!existingLesson) {
      throw new NotFoundException('Lesson not found');
    }

    existingLesson.language = language;
    existingLesson.stage = stage;
    existingLesson.name = lesson.name;
    existingLesson.description = lesson.description;
    existingLesson.content = lesson.content;

    await this.lessonRepository.save(existingLesson);
    return existingLesson;
  }

  async getLessonsByLanguage(
    languageId: string,
    pagination: PaginationDto,
    stageId?: string,
  ): Promise<PaginatedResponseDto<Lesson>> {
    const {
      page,
      limit,
      orderBy = undefined,
      sortOrder = undefined,
    } = pagination;

    const skip = (page - 1) * limit;

    const whereClause: any = { language: { id: languageId } };
    if (stageId) {
      whereClause.stage = { id: stageId };
    }

    const findOptions: FindManyOptions<Lesson> = {
      select: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
      where: whereClause,
      skip,
      take: limit,
    };

    if (orderBy && sortOrder) {
      findOptions.order = {
        [orderBy]: sortOrder,
      };
    }

    const [data, total] = await this.lessonRepository.findAndCount(findOptions);

    return {
      data,
      total,
      page,
      pageSize: limit,
    };
  }

  async getLessonsByLanguageWithSubmissions(
    languageId: string,
    userId: string,
    pagination: PaginationDto,
    stageId?: string,
  ): Promise<PaginatedResponseDto<any>> {
    const {
      page,
      limit,
      orderBy = 'createdAt',
      sortOrder = 'DESC',
    } = pagination;

    const skip = (page - 1) * limit;

    const orderByClause =
      orderBy === 'createdAt'
        ? `l.${orderBy} ${sortOrder}, qs.submittedAt DESC`
        : `l.${orderBy} ${sortOrder}`;

    const queryParams = [userId, languageId];

    if (stageId) {
      queryParams.push(stageId);
    }

    const query = `
      SELECT
        l.id AS lesson_id,
        l.name AS lesson_name,
        l.description AS lesson_description,
        l.content AS lesson_content,
        l.languageId AS lesson_languageId,
        l.stageId AS lesson_stageId,
        l.createdAt AS lesson_createdAt,
        l.updatedAt AS lesson_updatedAt,
        q.id AS quiz_id,
        qs.id AS submission_id,
        qs.userId AS submission_userId,
        qs.quizId AS submission_quizId,
        qs.score AS submission_score,
        qs.submittedAt AS submission_submittedAt,
        qs.answers AS submission_answers
      FROM
        lesson AS l
        LEFT JOIN quiz AS q ON q.lessonId = l.id
        LEFT JOIN quiz_submission AS qs ON qs.quizId = q.id AND qs.userId = ?
      WHERE
        l.languageId = ?
        ${stageId ? 'AND l.stageId = ?' : ''}
      ORDER BY ${orderByClause}
      LIMIT ${limit} OFFSET ${skip}
    `;

    const results = await this.dataSource.query(query, queryParams);

    const countQuery = `
      SELECT COUNT(DISTINCT l.id) as total
      FROM
        lesson AS l
      WHERE
        l.languageId = ?
        ${stageId ? 'AND l.stageId = ?' : ''}
    `;

    const countParams = [languageId];
    if (stageId) {
      countParams.push(stageId);
    }

    const countResult = await this.dataSource.query(countQuery, countParams);
    const total = countResult[0].total;

    const lessonMap = new Map();

    results.forEach((row) => {
      const lessonId = row.lesson_id;

      if (!lessonMap.has(lessonId)) {
        lessonMap.set(lessonId, {
          id: row.lesson_id,
          name: row.lesson_name,
          description: row.lesson_description,
          createdAt: row.lesson_createdAt,
          updatedAt: row.lesson_updatedAt,
          maxScore: 0,
          submissions: [],
        });
      }

      const lesson = lessonMap.get(lessonId);

      if (row.submission_id) {
        if (row.submission_score > lesson.maxScore) {
          lesson.maxScore = row.submission_score;
        }

        let submission = lesson.submissions.find(
          (s) => s.submissionId === row.submission_id,
        );

        if (!submission) {
          submission = {
            submissionId: row.submission_id,
            score: row.submission_score,
            submittedAt: row.submission_submittedAt,
            answers: row.submission_answers,
          };
          lesson.submissions.push(submission);
        }
      }
    });

    const data = Array.from(lessonMap.values());

    return {
      data,
      total,
      page: pagination.page,
      pageSize: pagination.limit,
    };
  }
}
