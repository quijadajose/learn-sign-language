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

@Injectable()
export class LessonService {
  constructor(
    private readonly createLessonUseCase: CreateLessonUseCase,
    private readonly uploadPictureUseCase: UploadPictureUseCase,
    private readonly getLessonByLaguageUseCase: GetLessonByLanguageUseCase,
    private readonly getLessonByIdUseCase: GetLessonByIdUseCase,
    private readonly updateLessonUseCase: UpdateLessonuseCase,
    private readonly deleteLessonUseCase: DeleteLessonUseCase,
  ) {}
  async createLesson(createLessonDto: CreateLessonDto) {
    return await this.createLessonUseCase.execute(createLessonDto);
  }
  async saveLessonImage(lessonId: string, file: Express.Multer.File) {
    return await this.uploadPictureUseCase.execute(
      lessonId,
      'lessons',
      'png',
      file,
    );
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
  async updateLesson(id: string, createLessonDto: CreateLessonDto) {
    return await this.updateLessonUseCase.execute(id, createLessonDto);
  }
  async deleteLesson(id: string) {
    return await this.deleteLessonUseCase.execute(id);
  }
}
