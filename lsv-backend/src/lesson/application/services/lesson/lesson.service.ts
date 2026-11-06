import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { QuizVariantService } from '../../../../quiz/application/services/quiz-variant.service.js';
import { CreateLessonUseCase } from '../../use-cases/create-lesson-use-case/create-lesson-use-case.js';
import { CreateLessonDto } from '../../../domain/dto/create-lesson/create-lesson-dto.js';
import { UploadPictureUseCase } from '../../../../shared/application/use-cases/upload-picture-use-case/upload-picture-use-case.js';
import { GetLessonByLanguageUseCase } from '../../use-cases/get-lesson-by-laguage-use-case/get-lesson-by-laguage-use-case.js';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { GetLessonByIdUseCase } from '../../use-cases/get-lesson-by-id-use-case/get-lesson-by-id-use-case.js';
import { DeleteLessonUseCase } from '../../use-cases/delete-lesson-use-case/delete-lesson-use-case.js';
import { UpdateLessonuseCase } from '../../use-cases/update-lessonuse-case/update-lessonuse-case.js';
import { GetLessonWithQuizzesUseCase } from '../../use-cases/get-lesson-with-quizzes-use-case/get-lesson-with-quizzes-use-case.js';
import { GetQuizzesByLessonIdUseCase } from '../../use-cases/get-quizzes-by-lesson-id-use-case/get-quizzes-by-lesson-id-use-case.js';
import { GetLessonsByLanguageWithSubmissionsUseCase } from '../../use-cases/get-lessons-by-language-with-submissions-use-case/get-lessons-by-language-with-submissions-use-case.js';
import { GetLessonVariantsUseCase } from '../../use-cases/get-lesson-variants-use-case/get-lesson-variants-use-case.js';
import { CreateLessonVariantUseCase } from '../../use-cases/create-lesson-variant-use-case/create-lesson-variant-use-case.js';
import { GetLessonVariantUseCase } from '../../use-cases/get-lesson-variant-use-case/get-lesson-variant-use-case.js';
import { UpdateLessonVariantUseCase } from '../../use-cases/update-lesson-variant-use-case/update-lesson-variant-use-case.js';
import { DeleteLessonVariantUseCase } from '../../use-cases/delete-lesson-variant-use-case/delete-lesson-variant-use-case.js';
import { GetRegionalLessonUseCase } from '../../use-cases/get-regional-lesson-use-case/get-regional-lesson-use-case.js';
import { CreateLessonVariantDto } from '../../../domain/dto/create-lesson-variant/create-lesson-variant-dto.js';
import { LessonVariant } from '../../../../shared/domain/entities/lessonVariant.js';
import { Lesson } from '../../../../shared/domain/entities/lesson.js';

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
    @Inject(forwardRef(() => QuizVariantService))
    private readonly quizVariantService: QuizVariantService,
  ) {}
  async createLesson(createLessonDto: CreateLessonDto) {
    return await this.createLessonUseCase.execute(createLessonDto);
  }
  async saveLessonImage(lessonId: string, file: Express.Multer.File) {
    return await this.uploadPictureUseCase.execute(lessonId, 'lesson', file);
  }
  async getLessonsByLanguage(
    languageId: string,
    pagination: PaginationDto,
    stageId?: string,
  ): Promise<PaginatedResponseDto<Lesson>> {
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

  async getQuizzesByLessonId(id: string, regionId?: string) {
    // Si hay regionId, buscar quiz variants de la variante regional
    if (regionId) {
      try {
        const lessonOrVariant = await this.getRegionalLessonUseCase.execute(
          id,
          regionId,
        );

        // Si es una variante, obtener sus quiz variants
        if ('baseLesson' in lessonOrVariant && lessonOrVariant.baseLesson) {
          const quizVariants = await this.quizVariantService.getQuizVariants(
            lessonOrVariant.id,
          );

          // Convertir quiz variants al formato de quizzes normales
          return quizVariants.map((qv) => ({
            id: qv.id,
            questions: (qv.questionVariants || []).map((qvQuestion) => ({
              id: qvQuestion.id,
              text: qvQuestion.question,
              options: (qvQuestion.optionVariants || []).map((qvOption) => ({
                id: qvOption.id,
                text: qvOption.text,
                // No incluir isCorrect para el frontend
              })),
            })),
          }));
        }
      } catch {
        // Si falla, intentar con la lección base
      }
    }

    // Si no hay regionId o no se encontró variante, usar el método normal
    return await this.getQuizzesByLessonIdUseCase.execute(id);
  }

  async getLessonsByLanguageWithSubmissions(
    languageId: string,
    userId: string,
    pagination: PaginationDto,
    stageId?: string,
    regionId?: string,
  ): Promise<PaginatedResponseDto<Lesson>> {
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
