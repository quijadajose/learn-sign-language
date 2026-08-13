import { Lesson } from 'src/shared/domain/entities/lesson';

export interface LessonRepositoryInterface {
  findById(id: string): Promise<Lesson | null>;
}
