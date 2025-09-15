import { Injectable } from '@nestjs/common';
import { CreateLessonUseCase } from '../../use-cases/create-lesson-use-case/create-lesson-use-case';
import { CreateLessonDto } from '../../../domain/dto/create-lesson/create-lesson-dto';
import { UploadPictureUseCase } from 'src/shared/application/use-cases/upload-picture-use-case/upload-picture-use-case';
import { GetLessonByLanguageUseCase } from '../../use-cases/get-lesson-by-laguage-use-case/get-lesson-by-laguage-use-case';
import {
  PaginationDto,
  PaginatedResponseDto,
} from 'src/shared/domain/dto/PaginationDto';
import { GetLessonByIdUseCase } from '../../use-cases/get-lesson-by-id-use-case/get-lesson-by-id-use-case';
import { DeleteLessonUseCase } from '../../use-cases/delete-lesson-use-case/delete-lesson-use-case';
import { UpdateLessonuseCase } from '../../use-cases/update-lessonuse-case/update-lessonuse-case';
import { GetLessonWithQuizzesUseCase } from '../../use-cases/get-lesson-with-quizzes-use-case/get-lesson-with-quizzes-use-case';
import { GetQuizzesByLessonIdUseCase } from '../../use-cases/get-quizzes-by-lesson-id-use-case/get-quizzes-by-lesson-id-use-case';
import { GetLessonsByLanguageWithSubmissionsUseCase } from '../../use-cases/get-lessons-by-language-with-submissions-use-case/get-lessons-by-language-with-submissions-use-case';
import { GetLessonVariantsUseCase } from '../../use-cases/get-lesson-variants-use-case/get-lesson-variants-use-case';
import { CreateLessonVariantUseCase } from '../../use-cases/create-lesson-variant-use-case/create-lesson-variant-use-case';
import { GetLessonVariantUseCase } from '../../use-cases/get-lesson-variant-use-case/get-lesson-variant-use-case';
import { UpdateLessonVariantUseCase } from '../../use-cases/update-lesson-variant-use-case/update-lesson-variant-use-case';
import { DeleteLessonVariantUseCase } from '../../use-cases/delete-lesson-variant-use-case/delete-lesson-variant-use-case';
import { GetRegionalLessonUseCase } from '../../use-cases/get-regional-lesson-use-case/get-regional-lesson-use-case';
import { CreateLessonVariantDto } from '../../../domain/dto/create-lesson-variant/create-lesson-variant-dto';
import { LessonVariant } from 'src/shared/domain/entities/lessonVariant';
import { Lesson } from 'src/shared/domain/entities/lesson';

@Injectable()
export class LessonService {
  constructor(
    private readonly createLessonUseCase: CreateLessonUseCase,
    private readonly uploadPictureUseCase: UploadPictureUseCase,
    private readonly getLessonByLaguageUseCase: GetLessonByLanguageUseCase,
    private readonly getLessonByIdUseCase: GetLessonByIdUseCase,
    private readonly updateLessonUseCase: UpdateLessonuseCase,
    private readonly deleteLessonUseCase: DeleteLessonUseCase,
    private readonly getLessonWithQuizzesUseCase: GetLessonWithQuizzesUseCase,
    private readonly getQuizzesByLessonIdUseCase: GetQuizzesByLessonIdUseCase,
    private readonly getLessonsByLanguageWithSubmissionsUseCase: GetLessonsByLanguageWithSubmissionsUseCase,
    private readonly getLessonVariantsUseCase: GetLessonVariantsUseCase,
    private readonly createLessonVariantUseCase: CreateLessonVariantUseCase,
    private readonly getLessonVariantUseCase: GetLessonVariantUseCase,
    private readonly updateLessonVariantUseCase: UpdateLessonVariantUseCase,
    private readonly deleteLessonVariantUseCase: DeleteLessonVariantUseCase,
    private readonly getRegionalLessonUseCase: GetRegionalLessonUseCase,
  ) {}
  async createLesson(createLessonDto: CreateLessonDto) {
    return await this.createLessonUseCase.execute(createLessonDto);
  }
  async saveLessonImage(lessonId: string, file: Express.Multer.File) {
    return await this.uploadPictureUseCase.execute(lessonId, 'lessons', file);
  }
  async getLessonsByLanguage(
    languageId: string,
    pagination: PaginationDto,
    stageId?: string,
  ): Promise<PaginatedResponseDto<any>> {
    return await this.getLessonByLaguageUseCase.execute(
      languageId,
      pagination,
      stageId,
    );
  }
  async getLessonById(id: string) {
    return await this.getLessonByIdUseCase.execute(id);
  }

  async getLessonWithQuizzes(id: string) {
    return await this.getLessonWithQuizzesUseCase.execute(id);
  }

  async getQuizzesByLessonId(id: string) {
    return await this.getQuizzesByLessonIdUseCase.execute(id);
  }

  async getLessonsByLanguageWithSubmissions(
    languageId: string,
    userId: string,
    pagination: PaginationDto,
    stageId?: string,
    regionId?: string,
  ): Promise<PaginatedResponseDto<any>> {
    return await this.getLessonsByLanguageWithSubmissionsUseCase.execute(
      languageId,
      userId,
      pagination,
      stageId,
      regionId,
    );
  }

  async updateLesson(id: string, createLessonDto: CreateLessonDto) {
    return await this.updateLessonUseCase.execute(id, createLessonDto);
  }
  async deleteLesson(id: string) {
    return await this.deleteLessonUseCase.execute(id);
  }

  async getLessonVariants(lessonId: string): Promise<LessonVariant[]> {
    return await this.getLessonVariantsUseCase.execute(lessonId);
  }

  async createLessonVariant(
    lessonId: string,
    createVariantDto: CreateLessonVariantDto,
  ): Promise<LessonVariant> {
    return await this.createLessonVariantUseCase.execute(
      lessonId,
      createVariantDto,
    );
  }

  async getLessonVariant(
    lessonId: string,
    variantId: string,
  ): Promise<LessonVariant> {
    return await this.getLessonVariantUseCase.execute(lessonId, variantId);
  }

  async updateLessonVariant(
    lessonId: string,
    variantId: string,
    updateVariantDto: CreateLessonVariantDto,
  ): Promise<LessonVariant> {
    return await this.updateLessonVariantUseCase.execute(
      lessonId,
      variantId,
      updateVariantDto,
    );
  }

  async deleteLessonVariant(
    lessonId: string,
    variantId: string,
  ): Promise<void> {
    return await this.deleteLessonVariantUseCase.execute(lessonId, variantId);
  }

  async getRegionalLesson(
    lessonId: string,
    regionId?: string,
  ): Promise<Lesson | LessonVariant> {
    return await this.getRegionalLessonUseCase.execute(lessonId, regionId);
  }
}
