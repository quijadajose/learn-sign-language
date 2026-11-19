import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { LessonVariantRepositoryInterface } from '../../../domain/ports/lesson-variant.repository.interface.js';
import { LessonModelRepositoryInterface } from '../../../domain/ports/lesson-model.repository.interface.js';
import { SignRepositoryInterface } from '../../../domain/ports/sign.repository.interface.js';
import { SignRecordingRepositoryInterface } from '../../../domain/ports/sign-recording.repository.interface.js';
import { FileStoragePort } from '../../../domain/ports/file-storage.port.js';
import { TrainingQueuePort } from '../../../domain/ports/training-queue.port.js';
import { SignRecording } from '../../../../shared/domain/entities/signRecording.js';
import {
  isDynamicRecording,
  landmarkFallbacksForUncoveredSigns,
  recordingToTrainingSample,
} from '../../../domain/utils/training-data.js';
import { featureMetadataForModelType } from '../../../domain/utils/landmark-validation.js';
import {
  assertRecordingWithinFrameLimit,
  assertSampleCountWithinLimits,
} from '../../../domain/utils/training-limits.js';
import { pageByKeyset } from '../../../domain/utils/keyset-paging.js';

/** Grabaciones leídas de la BD por página (BE-11). */
const TRAINING_PAGE_SIZE = 200;

type LessonTrainingSource = {
  lessonId: string;
  regionId?: string;
  /** Landmarks legacy de señas sin grabación validada (como mucho una por seña). */
  fallbacks: SignRecording[];
};

@Injectable()
export class TriggerTrainingUseCase {
  private readonly logger = new Logger(TriggerTrainingUseCase.name);

  constructor(
    @Inject('LessonVariantRepositoryInterface')
    private readonly lessonVariantRepository: LessonVariantRepositoryInterface,
    @Inject('LessonModelRepositoryInterface')
    private readonly lessonModelRepository: LessonModelRepositoryInterface,
    @Inject('SignRepositoryInterface')
    private readonly signRepository: SignRepositoryInterface,
    @Inject('SignRecordingRepositoryInterface')
    private readonly signRecordingRepository: SignRecordingRepositoryInterface,
    @Inject('FileStoragePort')
    private readonly fileStoragePort: FileStoragePort,
    @Inject('TrainingQueuePort')
    private readonly trainingQueue: TrainingQueuePort,
  ) {}

  async execute(lessonVariantId: string) {
    const lessonVariant =
      await this.lessonVariantRepository.findByIdWithBaseAndRegion(
        lessonVariantId,
      );

    if (!lessonVariant)
      throw new NotFoundException('errors.lesson.variantNotFound');

    const lessonId = lessonVariant.baseLesson.id;
    const regionId = lessonVariant.region?.id;

    // BE-11: antes de encolar se recorren las grabaciones por páginas para validar
    // límites y saber qué señas están cubiertas; solo se retienen ids y contadores.
    let staticCount = 0;
    let dynamicCount = 0;
    const coveredSignIds = new Set<string>();
    for await (const recording of this.pageRecordings(lessonId, regionId)) {
      assertRecordingWithinFrameLimit(recording);
      if (recording.sign?.id) coveredSignIds.add(recording.sign.id);
      if (isDynamicRecording(recording)) dynamicCount += 1;
      else staticCount += 1;
    }

    const signs = await this.signRepository.findForTraining(lessonId);
    const fallbacks = landmarkFallbacksForUncoveredSigns(
      coveredSignIds,
      signs,
      regionId,
    );
    for (const fallback of fallbacks) {
      assertRecordingWithinFrameLimit(fallback);
      if (isDynamicRecording(fallback)) dynamicCount += 1;
      else staticCount += 1;
    }

    if (staticCount + dynamicCount === 0) {
      throw new NotFoundException('errors.model.noValidatedRecordings');
    }

    assertSampleCountWithinLimits(staticCount);
    assertSampleCountWithinLimits(dynamicCount);

    const source: LessonTrainingSource = { lessonId, regionId, fallbacks };
    const jobs: { modelId: string; modelType: 'static' | 'dynamic' }[] = [];
    const baseName = lessonVariant.baseLesson.name;

    try {
      if (staticCount > 0) {
        jobs.push(
          await this.dispatchVariantJob({
            lessonVariantId,
            source,
            modelType: 'static',
            modelName: `${baseName} [Estático]`,
          }),
        );
      }

      if (dynamicCount > 0) {
        jobs.push(
          await this.dispatchVariantJob({
            lessonVariantId,
            source,
            modelType: 'dynamic',
            modelName: `${baseName} [Dinámico]`,
          }),
        );
      }
    } catch (err) {
      await this.rollbackJobs(jobs);
      throw err;
    }

    if (jobs.length === 0) {
      throw new NotFoundException('errors.model.noStaticOrDynamicRecordings');
    }

    return { jobs, jobId: jobs[0]?.modelId, status: 'QUEUED' };
  }

  /** Recorre las grabaciones validadas por páginas (keyset por id). */
  private pageRecordings(
    lessonId: string,
    regionId?: string,
  ): AsyncGenerator<SignRecording> {
    return pageByKeyset(
      (afterId, limit) =>
        this.signRecordingRepository.findValidatedLessonTrainingPage(
          lessonId,
          regionId,
          afterId,
          limit,
        ),
      TRAINING_PAGE_SIZE,
    );
  }

  /** Grabaciones validadas (paginadas) seguidas de los fallbacks legacy, filtradas. */
  private async *trainingSamples(
    source: LessonTrainingSource,
    include: (recording: SignRecording) => boolean,
  ) {
    for await (const recording of this.pageRecordings(
      source.lessonId,
      source.regionId,
    )) {
      if (include(recording)) yield recordingToTrainingSample(recording);
    }
    for (const fallback of source.fallbacks) {
      if (include(fallback)) yield recordingToTrainingSample(fallback);
    }
  }

  private async dispatchVariantJob(params: {
    lessonVariantId: string;
    source: LessonTrainingSource;
    modelType: 'static' | 'dynamic';
    modelName: string;
  }) {
    const modelId = randomUUID();
    const isDynamicJob = params.modelType === 'dynamic';

    const trainingDataDir = this.fileStoragePort.sharedPath('training_data');
    await this.fileStoragePort.makeDirectory(trainingDataDir);

    const dataPath = this.fileStoragePort.sharedPath(
      'training_data',
      `${modelId}.json`,
    );
    // BE-11: el dataset se escribe en streaming, muestra a muestra.
    await this.fileStoragePort.saveTrainingDataset(dataPath, {
      modelType: params.modelType,
      samples: this.trainingSamples(
        params.source,
        (rec) => isDynamicRecording(rec) === isDynamicJob,
      ),
      // Solo el modelo dinámico usa como ruido las señas estáticas globales.
      globalStaticNoise: isDynamicJob
        ? this.trainingSamples(
            params.source,
            (rec) => !isDynamicRecording(rec) && Boolean(rec.sign?.isGlobal),
          )
        : undefined,
    });

    const model = this.lessonModelRepository.create({
      id: modelId,
      lessonVariant: { id: params.lessonVariantId },
      lesson: { id: params.source.lessonId },
      name: params.modelName,
      status: 'PENDING',
      progress: 0,
      accuracy: 0,
      trainingJobId: modelId,
      modelType: params.modelType,
      ...featureMetadataForModelType(params.modelType),
    });
    await this.lessonModelRepository.save(model);

    try {
      await this.trainingQueue.enqueueTrainLessonModel(
        {
          lessonVariantId: params.lessonVariantId,
          modelId,
          modelType: params.modelType,
          dataPath: this.fileStoragePort.workerPath(
            'training_data',
            `${modelId}.json`,
          ),
          outputPath: this.fileStoragePort.workerPath(
            'models',
            `model_${modelId}`,
          ),
        },
        modelId,
      );
    } catch (err) {
      await this.rollbackJobs([{ modelId, modelType: params.modelType }]);
      throw err;
    }

    return { modelId, modelType: params.modelType };
  }

  private async rollbackJobs(
    jobs: { modelId: string; modelType: 'static' | 'dynamic' }[],
  ) {
    for (const job of jobs) {
      try {
        await this.trainingQueue.removeJob(job.modelId);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Rollback: could not remove queue job ${job.modelId}: ${message}`,
        );
      }
      try {
        await this.fileStoragePort.deleteFile(
          this.fileStoragePort.sharedPath(
            'training_data',
            `${job.modelId}.json`,
          ),
        );
        await this.fileStoragePort.deleteDirectory(
          this.fileStoragePort.sharedPath('models', `model_${job.modelId}`),
        );
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Rollback: could not delete files for ${job.modelId}: ${message}`,
        );
      }
      try {
        const model = await this.lessonModelRepository.findById(job.modelId);
        if (model) await this.lessonModelRepository.remove(model);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Rollback: could not remove model ${job.modelId}: ${message}`,
        );
      }
    }
  }
}
