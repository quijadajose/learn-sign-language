import { LessonVariant } from '../../../shared/domain/entities/lessonVariant.js';

export interface LessonVariantRepositoryInterface {
  findByIdWithBaseAndRegion(id: string): Promise<LessonVariant | null>;
}
