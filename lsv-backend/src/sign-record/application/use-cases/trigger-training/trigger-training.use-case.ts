import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { LessonVariantRepositoryInterface } from 'src/sign-record/domain/ports/lesson-variant.repository.interface';
import { LessonModelRepositoryInterface } from 'src/sign-record/domain/ports/lesson-model.repository.interface';
import { SignRepositoryInterface } from 'src/sign-record/domain/ports/sign.repository.interface';
import { SignRecordingRepositoryInterface } from 'src/sign-record/domain/ports/sign-recording.repository.interface';
import { FileStoragePort } from 'src/sign-record/domain/ports/file-storage.port';
import { TrainingQueuePort } from 'src/sign-record/domain/ports/training-queue.port';
import { SignRecording } from 'src/shared/domain/entities/signRecording';
import {
  mergeValidatedWithLandmarkFallback,
  recordingsToTrainingSamples,
  splitRecordingsForDualTraining,
} from 'src/sign-record/domain/utils/training-data';
import { featureMetadataForModelType } from 'src/sign-record/domain/utils/landmark-validation';

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

    if (!lessonVariant) throw new NotFoundException('Lesson variant not found');

    const signs = await this.signRepository.findForTraining(
      lessonVariant.baseLesson.id,
    );

    const validatedRecordings =
      await this.signRecordingRepository.findValidatedForLessonTraining(
        lessonVariant.baseLesson.id,
        lessonVariant.region?.id,
      );

    const recordings = mergeValidatedWithLandmarkFallback(
      validatedRecordings,
      signs,
      lessonVariant.region?.id,
    );

    if (recordings.length === 0) {
      throw new NotFoundException(
        'No hay grabaciones validadas para entrenar esta lección',
      );
    }

    const { staticRecordings, dynamicRecordings, globalStaticForDynamic } =
      splitRecordingsForDualTraining(recordings);

    const jobs: { modelId: string; modelType: 'static' | 'dynamic' }[] = [];
    const baseName = lessonVariant.baseLesson.name;

    try {
      if (staticRecordings.length > 0) {
        jobs.push(
          await this.dispatchVariantJob({
            lessonVariantId,
            lessonId: lessonVariant.baseLesson.id,
            recordings: staticRecordings,
            modelType: 'static',
            modelName: `${baseName} [Estático]`,
          }),
        );
      }

      if (dynamicRecordings.length > 0) {
        jobs.push(
          await this.dispatchVariantJob({
            lessonVariantId,
            lessonId: lessonVariant.baseLesson.id,
            recordings: dynamicRecordings,
            globalStaticNoise: globalStaticForDynamic,
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
      throw new NotFoundException(
        'No hay grabaciones estáticas ni dinámicas para entrenar',
      );
    }

    return { jobs, jobId: jobs[0]?.modelId, status: 'QUEUED' };
  }

  private async dispatchVariantJob(params: {
    lessonVariantId: string;
    lessonId: string;
    recordings: SignRecording[];
    globalStaticNoise?: SignRecording[];
    modelType: 'static' | 'dynamic';
    modelName: string;
  }) {
    const modelId = randomUUID();
    const trainingData = recordingsToTrainingSamples(params.recordings);
    const globalStaticNoise = params.globalStaticNoise
      ? recordingsToTrainingSamples(params.globalStaticNoise)
      : [];

    const trainingDataDir = this.fileStoragePort.sharedPath('training_data');
    await this.fileStoragePort.makeDirectory(trainingDataDir);

    const dataPath = this.fileStoragePort.sharedPath(
      'training_data',
      `${modelId}.json`,
    );
    await this.fileStoragePort.saveJson(dataPath, {
      modelType: params.modelType,
      samples: trainingData,
      globalStaticNoise,
    });

    const model = this.lessonModelRepository.create({
      id: modelId,
      lessonVariant: { id: params.lessonVariantId },
      lesson: { id: params.lessonId },
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
