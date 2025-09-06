import { NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
import { FindManyOptions, Repository } from 'typeorm';

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

    // Mapea los quizzes para excluir el campo isCorrect de las opciones
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
}
