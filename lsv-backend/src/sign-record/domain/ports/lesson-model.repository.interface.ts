import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { LessonModel } from 'src/shared/domain/entities/lessonModel';

export interface LessonModelRepositoryInterface {
  find(options?: any): Promise<LessonModel[]>;
  findAll(pagination: PaginationDto): Promise<LessonModel[]>;
  findByLessonVariantId(lessonVariantId: string): Promise<LessonModel | null>;
  findPendingOrTraining(): Promise<LessonModel[]>;
  findOne(options: any): Promise<LessonModel | null>;
  create(data: Partial<LessonModel>): LessonModel;
  save(model: LessonModel): Promise<LessonModel>;
  remove(model: LessonModel): Promise<LessonModel>;
  update(id: string, data: any): Promise<void>;
}
