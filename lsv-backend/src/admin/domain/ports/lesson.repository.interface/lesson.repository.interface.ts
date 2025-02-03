import { CreateLessonDto } from "src/admin/application/dtos/create-lesson-dto/create-lesson-dto";
import { PaginationDto } from "src/shared/application/dtos/PaginationDto";
import { Lesson } from "src/shared/domain/entities/lesson";

export interface LessonRepositoryInterface {
    findById(id: string): Promise<Lesson | null>;
    findByName(name: string): Promise<Lesson | null>;
    findAll(pagination: PaginationDto): Promise<Lesson[]>;
    save(lesson: Lesson): Promise<Lesson>;
    deleteById(id: string): Promise<void>;
    update(id: string, language: CreateLessonDto): Promise<Lesson>;
    getLessonsByLanguage(languageId: string, pagination: PaginationDto): Promise<Lesson[]>;
  }
  