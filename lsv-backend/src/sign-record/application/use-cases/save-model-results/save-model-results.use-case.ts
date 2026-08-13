import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { LessonModelRepositoryInterface } from 'src/sign-record/domain/ports/lesson-model.repository.interface';
import { SignRecordNotificationPort } from 'src/sign-record/domain/ports/sign-record.notification.port';
import { SaveModelResultsDto } from 'src/sign-record/domain/dto/save-model-results.dto';
import { withI18nParams } from 'src/i18n';

@Injectable()
export class SaveModelResultsUseCase {
  constructor(
    @Inject('LessonModelRepositoryInterface')
    private readonly lessonModelRepository: LessonModelRepositoryInterface,
    @Inject('SignRecordNotificationPort')
    private readonly notificationPort: SignRecordNotificationPort,
  ) {}

  async execute(id: string, raw: unknown) {
    const data = plainToInstance(SaveModelResultsDto, raw);
    const errors = validateSync(data, { whitelist: true });
    if (errors.length > 0) {
      const messages = errors
        .flatMap((e) => Object.values(e.constraints ?? {}))
        .join('; ');
      throw new BadRequestException(
        withI18nParams('errors.model.invalidTrainerPayload', {
          details: messages,
        }),
      );
    }

    const existing = await this.lessonModelRepository.findById(id);

    if (!existing) {
      throw new NotFoundException('errors.model.notFound');
    }

    const trainingLogs =
      data.logs && typeof data.logs === 'object' && !Array.isArray(data.logs)
        ? (data.logs as Record<string, unknown>)
        : data.logs != null
          ? { value: data.logs }
          : null;

    await this.lessonModelRepository.update(id, {
      status: 'READY',
      modelJsonUrl: data.modelJsonUrl,
      binUrls: data.binUrls,
      accuracy: data.accuracy,
      labels: data.labels,
      trainingLogs,
      ...(data.featuresCount != null
        ? { featuresCount: data.featuresCount }
        : {}),
      ...(data.modelType ? { modelType: data.modelType } : {}),
      ...(data.featuresSchemaVersion
        ? { featuresSchemaVersion: data.featuresSchemaVersion }
        : {}),
    });

    const modelType = data.modelType ?? existing.modelType;
    const lessonId = existing.lessonId ?? existing.lesson?.id ?? null;
    const lessonVariantId = existing.lessonVariant?.id ?? null;

    await this.lessonModelRepository.supersedeReadyModels({
      exceptId: id,
      modelType,
      lessonId,
      lessonVariantId,
      name: existing.name,
    });

    this.notificationPort.sendModelReady(id, {
      modelJsonUrl: data.modelJsonUrl,
      binUrls: data.binUrls,
      accuracy: data.accuracy,
      labels: data.labels,
      modelType: data.modelType,
      featuresCount: data.featuresCount,
      featuresSchemaVersion: data.featuresSchemaVersion,
      trainingLogs,
    });
    return { success: true };
  }
}
