import { Injectable } from '@nestjs/common';
import { CreateLessonUseCase } from '../../use-cases/create-lesson-use-case/create-lesson-use-case';
import { CreateLessonDto } from '../../dtos/create-lesson-dto/create-lesson-dto';
import { UploadPictureUseCase } from 'src/shared/application/use-cases/upload-picture-use-case/upload-picture-use-case';

@Injectable()
export class LessonAdminService {
    constructor(
        private readonly createLessonUseCase: CreateLessonUseCase,
        private readonly uploadPictureUseCase: UploadPictureUseCase
    ) { }
    async createLesson(createLessonDto: CreateLessonDto) {
        return await this.createLessonUseCase.execute(createLessonDto);
    }
    async saveLessonImage(lessonId: string, file: Express.Multer.File) {
        return await this.uploadPictureUseCase.execute(lessonId, 'lessons', 'png', file);
    }
}
