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
import { FileStoragePort } from 'src/sign-record/domain/ports/file-storage.port';
import { SaveModelResultsDto } from 'src/sign-record/domain/dto/save-model-results.dto';
import { withI18nParams } from 'src/i18n';
import * as path from 'path';

export function resolveSharedModelJsonPath(
  modelJsonUrl: string,
  storage: FileStoragePort,
): string | null {
  let pathname = modelJsonUrl;
  try {
    if (/^https?:\/\//i.test(modelJsonUrl)) {
      pathname = new URL(modelJsonUrl).pathname;
    }
  } catch {
    return null;
  }
  const prefix = '/shared/';
  if (!pathname.startsWith(prefix) || !pathname.endsWith('/model.json')) {
    return null;
  }
  const rel = pathname.slice(prefix.length);
  const segments = rel.split('/').filter(Boolean);
  if (segments[0] !== 'models' || segments.some((s) => s === '..')) {
    return null;
  }
  const abs = storage.sharedPath(...segments);
  const root = path.resolve(storage.getSharedDir());
  if (
    !path.resolve(abs).startsWith(root + path.sep) &&
    path.resolve(abs) !== root
  ) {
    return null;
  }
  return abs;
}

@Injectable()
export class SaveModelResultsUseCase {
  constructor(
    @Inject('LessonModelRepositoryInterface')
    private readonly lessonModelRepository: LessonModelRepositoryInterface,
    @Inject('SignRecordNotificationPort')
    private readonly notificationPort: SignRecordNotificationPort,
    @Inject('FileStoragePort')
    private readonly fileStorage: FileStoragePort,
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

    const filePath = resolveSharedModelJsonPath(
      data.modelJsonUrl,
      this.fileStorage,
    );
    if (!filePath) {
      throw new BadRequestException('errors.model.untrustedModelUrl');
    }
    const digest = await this.fileStorage.sha256File(filePath);
    if (!digest || digest !== data.modelJsonSha256.toLowerCase()) {
      throw new BadRequestException('errors.model.hashMismatch');
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
