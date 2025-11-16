import {
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
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
import { LessonVariant } from 'src/shared/domain/entities/lessonVariant';
import { Region } from 'src/shared/domain/entities/region';
import { CreateLessonVariantDto } from 'src/lesson/domain/dto/create-lesson-variant/create-lesson-variant-dto';
import { FindManyOptions, Repository, DataSource } from 'typeorm';
import { QuizService } from 'src/quiz/application/services/quiz/quiz.service';
import { LessonVariantRepository } from '../lesson-variant.repository/lesson-variant.repository';
import { RegionRepository } from '../region.repository/region.repository';

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
    private readonly lessonVariantRepository: LessonVariantRepository,
    private readonly regionRepository: RegionRepository,
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
    regionId?: string,
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
    if (!regionId) {
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
            content: row.lesson_content,
            languageId: row.lesson_languageId,
            stageId: row.lesson_stageId,
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

    const query = `
      SELECT
        COALESCE(lv.id, l.id) AS lesson_id,
        COALESCE(lv.name, l.name) AS lesson_name,
        COALESCE(lv.description, l.description) AS lesson_description,
        COALESCE(lv.content, l.content) AS lesson_content,
        l.languageId AS lesson_languageId,
        l.stageId AS lesson_stageId,
        COALESCE(lv.createdAt, l.createdAt) AS lesson_createdAt,
        COALESCE(lv.updatedAt, l.updatedAt) AS lesson_updatedAt,
        q.id AS quiz_id,
        qs.id AS submission_id,
        qs.userId AS submission_userId,
        qs.quizId AS submission_quizId,
        qs.score AS submission_score,
        qs.submittedAt AS submission_submittedAt,
        qs.answers AS submission_answers,
        CASE WHEN lv.id IS NOT NULL THEN true ELSE false END AS is_regional_variant
      FROM
        lesson AS l
        LEFT JOIN lesson_variant AS lv ON lv.baseLessonId = l.id AND lv.regionId = ?
        LEFT JOIN quiz AS q ON q.lessonId = l.id
        LEFT JOIN quiz_submission AS qs ON qs.quizId = q.id AND qs.userId = ?
      WHERE
        l.languageId = ?
        ${stageId ? 'AND l.stageId = ?' : ''}
      ORDER BY ${orderByClause}
      LIMIT ${limit} OFFSET ${skip}
    `;

    const regionalQueryParams = [regionId, userId, languageId];
    if (stageId) {
      regionalQueryParams.push(stageId);
    }

    const results = await this.dataSource.query(query, regionalQueryParams);

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
          content: row.lesson_content,
          languageId: row.lesson_languageId,
          stageId: row.lesson_stageId,
          createdAt: row.lesson_createdAt,
          updatedAt: row.lesson_updatedAt,
          regionId: regionId,
          maxScore: 0,
          submissions: [],
          isRegionalVariant: row.is_regional_variant,
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

  async findLessonVariants(lessonId: string): Promise<LessonVariant[]> {
    return await this.lessonVariantRepository.findByLessonId(lessonId);
  }

  async createLessonVariant(
    lessonId: string,
    createVariantDto: CreateLessonVariantDto,
  ): Promise<LessonVariant> {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId },
    });
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    const region = await this.regionRepository.findById(
      createVariantDto.regionId,
    );
    if (!region) {
      throw new NotFoundException(
        `Region with ID ${createVariantDto.regionId} not found`,
      );
    }

    if (createVariantDto.isBase) {
      const existingBaseVariant =
        await this.lessonVariantRepository.findByLessonIdAndIsBase(
          lessonId,
          true,
        );
      if (existingBaseVariant) {
        throw new ConflictException(
          `Ya existe una variante base para esta lección. Solo puede haber una variante base por lección.`,
        );
      }
    }

    const variant = new LessonVariant();
    variant.name = createVariantDto.name;
    variant.description = createVariantDto.description;
    variant.content = createVariantDto.content;
    variant.isRegionalSpecific = createVariantDto.isRegionalSpecific || false;
    variant.isBase = createVariantDto.isBase || false;
    variant.regionalNotes = createVariantDto.regionalNotes;
    variant.baseLesson = lesson;
    variant.region = region;

    return await this.lessonVariantRepository.save(variant);
  }

  async findLessonVariant(
    lessonId: string,
    variantId: string,
  ): Promise<LessonVariant> {
    const variant = await this.lessonVariantRepository.findById(variantId);

    if (!variant || variant.baseLesson.id !== lessonId) {
      throw new NotFoundException(
        `Lesson variant with ID ${variantId} not found for lesson ${lessonId}`,
      );
    }

    return variant;
  }

  async updateLessonVariant(
    lessonId: string,
    variantId: string,
    updateVariantDto: CreateLessonVariantDto,
  ): Promise<LessonVariant> {
    const variant = await this.findLessonVariant(lessonId, variantId);

    if (
      updateVariantDto.regionId &&
      updateVariantDto.regionId !== variant.region.id
    ) {
      const region = await this.regionRepository.findById(
        updateVariantDto.regionId,
      );
      if (!region) {
        throw new NotFoundException(
          `Region with ID ${updateVariantDto.regionId} not found`,
        );
      }
      variant.region = region;
    }

    variant.name = updateVariantDto.name;
    variant.description = updateVariantDto.description;
    variant.content = updateVariantDto.content;
    variant.isRegionalSpecific = updateVariantDto.isRegionalSpecific || false;
    variant.regionalNotes = updateVariantDto.regionalNotes;

    return await this.lessonVariantRepository.save(variant);
  }

  async deleteLessonVariant(
    lessonId: string,
    variantId: string,
  ): Promise<void> {
    const variant = await this.findLessonVariant(lessonId, variantId);
    await this.lessonVariantRepository.delete(variant.id);
  }

  async findRegionalLesson(
    lessonId: string,
    regionId?: string,
  ): Promise<Lesson | LessonVariant> {
    // Primero verificar si el ID es de una variante
    const variantById = await this.lessonVariantRepository.findById(lessonId);
    let baseLessonId = lessonId;

    if (variantById) {
      // Si el ID es de una variante, usar el ID de la lección base
      baseLessonId = variantById.baseLesson.id;

      // Si hay regionId y coincide con la variante, retornar la variante
      if (regionId && variantById.region.id === regionId) {
        return variantById;
      }

      // Si no hay regionId, retornar la variante encontrada
      if (!regionId) {
        return variantById;
      }
    }

    if (!regionId) {
      const lesson = await this.lessonRepository.findOne({
        where: { id: baseLessonId },
        relations: [
          'language',
          'stage',
          'quizzes',
          'quizzes.questions',
          'quizzes.questions.options',
        ],
      });
      if (!lesson) {
        throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
      }
      return lesson;
    }

    // Buscar variante por lección base y región
    const variant = await this.lessonVariantRepository.findByLessonAndRegion(
      baseLessonId,
      regionId,
    );

    if (variant) {
      return variant;
    }

    // Si no hay variante, retornar la lección base
    const lesson = await this.lessonRepository.findOne({
      where: { id: baseLessonId },
      relations: [
        'language',
        'stage',
        'quizzes',
        'quizzes.questions',
        'quizzes.questions.options',
      ],
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }

    return lesson;
  }
}
