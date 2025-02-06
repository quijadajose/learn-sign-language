import { Injectable } from '@nestjs/common';
import { CreateLessonDto } from '../../../../lesson/application/dtos/create-lesson-dto/create-lesson-dto';
import { UploadPictureUseCase } from 'src/shared/application/use-cases/upload-picture-use-case/upload-picture-use-case';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';
import { CreateLessonUseCase } from 'src/lesson/application/use-cases/create-lesson-use-case/create-lesson-use-case';
import { GetLessonByLaguageUseCase } from 'src/lesson/application/use-cases/get-lesson-by-laguage-use-case/get-lesson-by-laguage-use-case';
import { GetLessonByIdUseCase } from 'src/lesson/application/use-cases/get-lesson-by-id-use-case/get-lesson-by-id-use-case';
import { UpdateLessonuseCase } from 'src/lesson/application/use-cases/update-lessonuse-case/update-lessonuse-case';
import { DeleteLessonUseCase } from 'src/lesson/application/use-cases/delete-lesson-use-case/delete-lesson-use-case';

@Injectable()
export class LessonService {
  constructor(
    private readonly createLessonUseCase: CreateLessonUseCase,
    private readonly uploadPictureUseCase: UploadPictureUseCase,
    private readonly getLessonByLaguageUseCase: GetLessonByLaguageUseCase,
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
  async getLessonsByLanguage(languageId: string, pagination: PaginationDto) {
    return await this.getLessonByLaguageUseCase.execute(languageId, pagination);
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
