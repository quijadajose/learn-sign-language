import { Inject } from "@nestjs/common";
import { LessonRepository } from "src/admin/infrastructure/typeorm/lesson.repository/lesson.repository";
import { Lesson } from "src/shared/domain/entities/lesson";

export class GetLessonByIdUseCase {
    constructor(
        @Inject('LessonRepositoryInterface')
        private readonly lessonRepository: LessonRepository,
    ) { }
    execute(id: string): Promise<Lesson> {
        return this.lessonRepository.findById(id);
    }
}
