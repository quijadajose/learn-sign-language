import { Injectable } from '@nestjs/common';
import { CreateLessonUseCase } from '../../use-cases/create-lesson-use-case/create-lesson-use-case';
import { CreateLessonDto } from '../../dtos/create-lesson-dto/create-lesson-dto';

@Injectable()
export class LessonAdminService {
    constructor(private readonly createLessonUseCase: CreateLessonUseCase) { }
    async createLesson(createLessonDto: CreateLessonDto) {
        return await this.createLessonUseCase.execute(createLessonDto);
    }
}
