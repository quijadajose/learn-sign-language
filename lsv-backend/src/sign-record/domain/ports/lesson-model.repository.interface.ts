import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { LessonModel } from 'src/shared/domain/entities/lessonModel';

export interface LessonModelRepositoryInterface {
  findAll(pagination: PaginationDto): Promise<LessonModel[]>;
  findByLessonVariantId(lessonVariantId: string): Promise<LessonModel | null>;
  findReadyForLesson(
    lessonId: string,
    lessonName: string,
    regionId?: string,
  ): Promise<LessonModel | null>;
  findReadyModelsForLesson(
    lessonId: string,
    lessonName: string,
    regionId?: string,
  ): Promise<{ static: LessonModel | null; dynamic: LessonModel | null }>;
  findPendingOrTraining(): Promise<LessonModel[]>;
  findById(id: string): Promise<LessonModel | null>;
  create(
    data: Partial<Omit<LessonModel, 'lesson' | 'lessonVariant'>> & {
      lesson?: { id: string };
      lessonVariant?: { id: string };
    },
  ): LessonModel;
  save(model: LessonModel): Promise<LessonModel>;
  remove(model: LessonModel): Promise<LessonModel>;
  update(id: string, data: Partial<LessonModel>): Promise<void>;
  /** Marca READY previos del mismo alcance como FAILED (retrain). */
  supersedeReadyModels(params: {
    exceptId: string;
    modelType: 'static' | 'dynamic';
    lessonId?: string | null;
    lessonVariantId?: string | null;
    name?: string | null;
  }): Promise<number>;
}
