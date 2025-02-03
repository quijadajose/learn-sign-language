import { Inject } from "@nestjs/common";
import { LessonRepository } from "src/admin/infrastructure/typeorm/lesson.repository/lesson.repository";

export class DeleteLessonUseCase {
    constructor(
        @Inject('LessonRepositoryInterface')
        private readonly lessonRepository: LessonRepository
    ) {
    }
    async execute(id: string) {
        return this.lessonRepository.deleteById(id);
    }
}
