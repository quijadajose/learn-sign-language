import { Inject } from "@nestjs/common";
import { LessonRepository } from "src/admin/infrastructure/typeorm/lesson.repository/lesson.repository";
import { PaginationDto } from "src/shared/application/dtos/PaginationDto";
import { Lesson } from "src/shared/domain/entities/lesson";

export class GetLessonByLaguageUseCase {
    constructor(
        @Inject('LessonRepositoryInterface')
        private readonly lessonRepository: LessonRepository,
    ) { }
    execute(languageId: string, pagination: PaginationDto): Promise<Lesson[]> {
        return this.lessonRepository.getLessonsByLanguage(languageId, pagination);
    }
}
