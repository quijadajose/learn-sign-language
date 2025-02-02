import { InjectRepository } from "@nestjs/typeorm";
import { CreateLessonDto } from "src/admin/application/dtos/create-lesson-dto/create-lesson-dto";
import { LessonRepositoryInterface } from "src/admin/domain/ports/lesson.repository.interface/lesson.repository.interface";
import { PaginationDto } from "src/shared/application/dtos/PaginationDto";
import { Lesson } from "src/shared/domain/entities/lesson";
import { Repository } from "typeorm";

export class LessonRepository implements LessonRepositoryInterface {
    constructor(
        @InjectRepository(Lesson)
        private readonly lessonRepository: Repository<Lesson>,
    ) { }
    findById(id: string): Promise<Lesson | null> {
        return this.lessonRepository.findOne({ where: { id } });
    }
    findByName(name: string): Promise<Lesson | null> {
        return this.lessonRepository.findOne({ where: { name } });
    }
    findAll(pagination: PaginationDto): Promise<Lesson[]> {
        const { page, limit, orderBy = undefined, sortOrder = undefined } = pagination;

        const skip = (page - 1) * limit;

        const findOptions: any = {
            skip,
            take: limit,
        };

        if (orderBy && sortOrder) {
            findOptions.order = {
                [orderBy]: sortOrder,
            };
        }
        return this.lessonRepository.find(findOptions);
    }
    save(lesson: Lesson): Promise<Lesson> {
        return this.lessonRepository.save(lesson);
    }
    async deleteById(id: string) {
        await this.lessonRepository.delete(id);
    }
    async update(id: string, language: CreateLessonDto): Promise<Lesson> {
        await this.lessonRepository.update(id, language);
        return this.lessonRepository.findOne({ where: { id } });
    }
}
