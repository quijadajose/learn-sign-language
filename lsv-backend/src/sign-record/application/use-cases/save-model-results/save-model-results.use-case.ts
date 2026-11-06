import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { LessonModelRepositoryInterface } from '../../../domain/ports/lesson-model.repository.interface.js';
import { SignRecordNotificationPort } from '../../../domain/ports/sign-record.notification.port.js';
import { FileStoragePort } from '../../../domain/ports/file-storage.port.js';
import { SaveModelResultsDto } from '../../../domain/dto/save-model-results.dto.js';
import { withI18nParams } from '../../../../i18n/index.js';
import * as path from 'path';

/**
 * TR-05: el trainer reporta `models/<job>/model.json` (relativo a /shared).
 * Se acepta también la forma absoluta `/shared/...` y la URL http(s) anterior.
 * Devuelve siempre la URL pública canónica `/shared/models/.../model.json`
 * o null si no es una ruta segura dentro de /shared/models.
 */
export function normalizeModelJsonUrl(modelJsonUrl: string): string | null {
  if (typeof modelJsonUrl !== 'string' || modelJsonUrl.includes('\\')) {
    return null;
  }
  let pathname = modelJsonUrl;
  if (/^https?:\/\//i.test(modelJsonUrl)) {
    try {
      pathname = new URL(modelJsonUrl).pathname;
    } catch {
      return null;
    }
  }
  if (!pathname.startsWith('/shared/') && pathname.startsWith('models/')) {
    pathname = `/shared/${pathname}`;
  }
  const prefix = '/shared/';
  if (!pathname.startsWith(prefix) || !pathname.endsWith('/model.json')) {
    return null;
  }
  const segments = pathname.slice(prefix.length).split('/').filter(Boolean);
  if (segments[0] !== 'models' || segments.some((s) => s === '..')) {
    return null;
  }
  return `${prefix}${segments.join('/')}`;
}

export function resolveSharedModelJsonPath(
  modelJsonUrl: string,
  storage: FileStoragePort,
): string | null {
  const normalized = normalizeModelJsonUrl(modelJsonUrl);
  if (!normalized) {
    return null;
  }
  const segments = normalized.slice('/shared/'.length).split('/');
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

  /**
   * model.json no trae hashes de sus pesos: sin esto, un .bin alterado o de un
   * export anterior se publicaría como READY sin que nada lo note.
   */
  private async verifyWeightShards(
    modelJsonPath: string,
    data: SaveModelResultsDto,
  ): Promise<void> {
    const expected = data.binSha256 ?? {};
    const names = data.binUrls;
    if (
      names.length === 0 ||
      Object.keys(expected).length !== names.length ||
      new Set(names).size !== names.length
    ) {
      throw new BadRequestException('errors.model.hashMismatch');
    }
    const dir = path.dirname(modelJsonPath);
    for (const name of names) {
      if (!name || name !== path.basename(name) || name === '..') {
        throw new BadRequestException('errors.model.untrustedModelUrl');
      }
      const want = expected[name];
      if (typeof want !== 'string' || !/^[a-f0-9]{64}$/i.test(want)) {
        throw new BadRequestException('errors.model.hashMismatch');
      }
      const digest = await this.fileStorage.sha256File(path.join(dir, name));
      if (!digest || digest !== want.toLowerCase()) {
        throw new BadRequestException('errors.model.hashMismatch');
      }
    }
  }

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

    const modelJsonUrl = normalizeModelJsonUrl(data.modelJsonUrl);
    const filePath = modelJsonUrl
      ? resolveSharedModelJsonPath(modelJsonUrl, this.fileStorage)
      : null;
    if (!modelJsonUrl || !filePath) {
      throw new BadRequestException('errors.model.untrustedModelUrl');
    }
    const digest = await this.fileStorage.sha256File(filePath);
    if (!digest || digest !== data.modelJsonSha256.toLowerCase()) {
      throw new BadRequestException('errors.model.hashMismatch');
    }
    await this.verifyWeightShards(filePath, data);

    const trainingLogs =
      data.logs && typeof data.logs === 'object' && !Array.isArray(data.logs)
        ? (data.logs as Record<string, unknown>)
        : data.logs != null
          ? { value: data.logs }
          : null;

    await this.lessonModelRepository.update(id, {
      status: 'READY',
      modelJsonUrl,
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
      modelJsonUrl,
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
