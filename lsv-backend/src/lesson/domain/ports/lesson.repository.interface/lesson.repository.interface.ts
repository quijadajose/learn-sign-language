import { CreateLessonDto } from '../../dto/create-lesson/create-lesson-dto.js';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { Lesson } from '../../../../shared/domain/entities/lesson.js';
import { Quiz } from '../../../../shared/domain/entities/quiz.js';
import { LessonVariant } from '../../../../shared/domain/entities/lessonVariant.js';
import { CreateLessonVariantDto } from '../../dto/create-lesson-variant/create-lesson-variant-dto.js';

export interface LessonRepositoryInterface {
  findById(id: string): Promise<Lesson | null>;
  findByIdWithQuizzes(id: string): Promise<Lesson | null>;
  findQuizzesByLessonId(id: string): Promise<Quiz[]>;
  findByNameInLanguage(
    name: string,
    languageId: string,
  ): Promise<Lesson | null>;
  findAll(pagination: PaginationDto): Promise<Lesson[]>;
  save(lesson: Lesson): Promise<Lesson>;
  deleteById(id: string): Promise<void>;
  update(id: string, language: CreateLessonDto): Promise<Lesson>;
  getLessonsByLanguage(
    languageId: string,
    pagination: PaginationDto,
    stageId?: string,
  ): Promise<PaginatedResponseDto<Lesson>>;
  getLessonsByLanguageWithSubmissions(
    languageId: string,
    userId: string,
    pagination: PaginationDto,
    stageId?: string,
    regionId?: string,
  ): Promise<PaginatedResponseDto<Lesson>>;
  findPassedLessonIdsForUser(userId: string): Promise<Set<string>>;

  findLessonVariants(lessonId: string): Promise<LessonVariant[]>;
  createLessonVariant(
    lessonId: string,
    createVariantDto: CreateLessonVariantDto,
  ): Promise<LessonVariant>;
  findLessonVariant(
    lessonId: string,
    variantId: string,
  ): Promise<LessonVariant>;
  updateLessonVariant(
    lessonId: string,
    variantId: string,
    updateVariantDto: CreateLessonVariantDto,
  ): Promise<LessonVariant>;
  deleteLessonVariant(lessonId: string, variantId: string): Promise<void>;
  findRegionalLesson(
    lessonId: string,
    regionId?: string,
  ): Promise<Lesson | LessonVariant>;
}
