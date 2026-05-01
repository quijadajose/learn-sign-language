import { LessonVariant } from 'src/shared/domain/entities/lessonVariant';

export interface LessonVariantRepositoryInterface {
  findByIdWithBaseAndRegion(id: string): Promise<LessonVariant | null>;
}
