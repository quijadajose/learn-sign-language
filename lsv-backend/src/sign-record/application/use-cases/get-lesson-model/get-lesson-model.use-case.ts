import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LessonModel } from 'src/shared/domain/entities/lessonModel';
import { LessonModelRepositoryInterface } from 'src/sign-record/domain/ports/lesson-model.repository.interface';
import { LessonRepositoryInterface } from 'src/sign-record/domain/ports/lesson.repository.interface';
import { isSupportedSchemaVersion } from 'src/sign-record/domain/utils/landmark-validation';

function supportedOrNull(model: LessonModel | null): LessonModel | null {
  if (!model) return null;
  return isSupportedSchemaVersion(model.featuresSchemaVersion) ? model : null;
}

function formatLessonModel(model: LessonModel) {
  return {
    id: model.id,
    name: model.name,
    modelJsonUrl: model.modelJsonUrl,
    binUrls: model.binUrls,
    labels: model.labels,
    accuracy: model.accuracy,
    modelType: model.modelType,
    featuresCount: model.featuresCount,
    featuresSchemaVersion: model.featuresSchemaVersion,
    status: model.status,
  };
}

@Injectable()
export class GetLessonModelUseCase {
  constructor(
    @Inject('LessonModelRepositoryInterface')
    private readonly lessonModelRepository: LessonModelRepositoryInterface,
    @Inject('LessonRepositoryInterface')
    private readonly lessonRepository: LessonRepositoryInterface,
  ) {}

  async execute(lessonId: string, regionId?: string) {
    const lesson = await this.lessonRepository.findById(lessonId);

    if (!lesson) {
      throw new NotFoundException('Lección no encontrada');
    }

    const models = await this.lessonModelRepository.findReadyModelsForLesson(
      lessonId,
      lesson.name,
      regionId,
    );

    const usable = {
      static: supportedOrNull(models.static),
      dynamic: supportedOrNull(models.dynamic),
    };

    if (!usable.static && !usable.dynamic) {
      throw new NotFoundException(
        'No se encontró un modelo entrenado para esta lección',
      );
    }

    return {
      static: usable.static ? formatLessonModel(usable.static) : null,
      dynamic: usable.dynamic ? formatLessonModel(usable.dynamic) : null,
    };
  }
}
