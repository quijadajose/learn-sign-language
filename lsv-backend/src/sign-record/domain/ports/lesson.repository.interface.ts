import { Lesson } from '../../../shared/domain/entities/lesson.js';

export interface LessonRepositoryInterface {
  findById(id: string): Promise<Lesson | null>;
}
