import { Injectable } from '@nestjs/common';
import { CreateLessonUseCase } from '../../use-cases/create-lesson-use-case/create-lesson-use-case';
import { CreateLessonDto } from '../../dtos/create-lesson-dto/create-lesson-dto';
import { UploadPictureUseCase } from 'src/shared/application/use-cases/upload-picture-use-case/upload-picture-use-case';
import { GetLessonByLaguageUseCase } from '../../use-cases/get-lesson-by-laguage-use-case/get-lesson-by-laguage-use-case';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';
import { GetLessonByIdUseCase } from '../../use-cases/get-lesson-by-id-use-case/get-lesson-by-id-use-case';

@Injectable()
export class LessonAdminService { 
    constructor(
        private readonly createLessonUseCase: CreateLessonUseCase,
        private readonly uploadPictureUseCase: UploadPictureUseCase,
        private readonly getLessonByLaguageUseCase: GetLessonByLaguageUseCase,
        private readonly getLessonByIdUseCase: GetLessonByIdUseCase
    ) { }
    async createLesson(createLessonDto: CreateLessonDto) {
        return await this.createLessonUseCase.execute(createLessonDto);
    }
    async saveLessonImage(lessonId: string, file: Express.Multer.File) {
        return await this.uploadPictureUseCase.execute(lessonId, 'lessons', 'png', file);
    }
    async getLessonsByLanguage(languageId: string, pagination: PaginationDto) {
        return await this.getLessonByLaguageUseCase.execute(languageId, pagination);
    }
    async getLessonById(id: string){
        return await this.getLessonByIdUseCase.execute(id);
    }
}
