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
import { Stages } from 'src/shared/domain/entities/stage';
import { FindManyOptions, Repository } from 'typeorm';

export class LessonRepository implements LessonRepositoryInterface {
  constructor(
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
    @InjectRepository(Stages)
    private readonly stageRepository: Repository<Stages>,
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
  ) {}

  findById(id: string): Promise<Lesson | null> {
    return this.lessonRepository.findOne({ where: { id } });
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
  ): Promise<PaginatedResponseDto<Lesson>> {
    const {
      page,
      limit,
      orderBy = undefined,
      sortOrder = undefined,
    } = pagination;

    const skip = (page - 1) * limit;

    const findOptions: FindManyOptions = {
      select: ['id', 'name', 'description', 'createdAt', 'updatedAt'],
      where: { language: { id: languageId } },
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
