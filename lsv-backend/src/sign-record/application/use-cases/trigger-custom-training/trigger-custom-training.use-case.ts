import {
  Inject,
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { randomUUID } from 'crypto';
import { SignRecording } from '../../../../shared/domain/entities/signRecording.js';
import { SignRecordingRepositoryInterface } from '../../../domain/ports/sign-recording.repository.interface.js';
import { LessonModelRepositoryInterface } from '../../../domain/ports/lesson-model.repository.interface.js';
import { FileStoragePort } from '../../../domain/ports/file-storage.port.js';
import { TrainingQueuePort } from '../../../domain/ports/training-queue.port.js';
import { TriggerCustomTrainingDto } from '../../../domain/dto/sign-record.dto.js';
import {
  recordingsToTrainingSamples,
  splitRecordingsForDualTraining,
} from '../../../domain/utils/training-data.js';
import { featureMetadataForModelType } from '../../../domain/utils/landmark-validation.js';
import { assertWithinTrainingLimits } from '../../../domain/utils/training-limits.js';

@Injectable()
export class TriggerCustomTrainingUseCase {
  private readonly logger = new Logger(TriggerCustomTrainingUseCase.name);

  constructor(
    @Inject('SignRecordingRepositoryInterface')
    private readonly signRecordingRepository: SignRecordingRepositoryInterface,
    @Inject('LessonModelRepositoryInterface')
    private readonly lessonModelRepository: LessonModelRepositoryInterface,
    @Inject('FileStoragePort')
    private readonly fileStoragePort: FileStoragePort,
    @Inject('TrainingQueuePort')
    private readonly trainingQueue: TrainingQueuePort,
  ) {}

  async execute(filters: TriggerCustomTrainingDto) {
    const recordings =
      await this.signRecordingRepository.findForTraining(filters);

    if (recordings.length === 0) {
      throw new BadRequestException('errors.model.insufficientTrainingData');
    }

    const { staticRecordings, dynamicRecordings, globalStaticForDynamic } =
      splitRecordingsForDualTraining(recordings);
    assertWithinTrainingLimits(staticRecordings);
    assertWithinTrainingLimits(dynamicRecordings);

    const baseModelName = this.resolveModelName(filters);
    const jobs: { modelId: string; modelType: 'static' | 'dynamic' }[] = [];

    try {
      if (staticRecordings.length > 0) {
        jobs.push(
          await this.dispatchJob({
            recordings: staticRecordings,
            modelType: 'static',
            modelName: `${baseModelName} [Estático]`,
            filters,
          }),
        );
      }

      if (dynamicRecordings.length > 0) {
        jobs.push(
          await this.dispatchJob({
            recordings: dynamicRecordings,
            globalStaticNoise: globalStaticForDynamic,
            modelType: 'dynamic',
            modelName: `${baseModelName} [Dinámico]`,
            filters,
          }),
        );
      }
    } catch (err) {
      await this.rollbackJobs(jobs);
      throw err;
    }

    if (jobs.length === 0) {
      throw new BadRequestException('errors.model.noValidRecordingsForDual');
    }

    return {
      success: true,
      jobs,
      jobId: jobs[0]?.modelId,
    };
  }

  private resolveModelName(filters: TriggerCustomTrainingDto): string {
    if (filters.modelName) return filters.modelName;

    const isRegional = filters.regionId && isUUID(filters.regionId);
    const baseName = isRegional ? 'Diferencias Regionales' : 'Modelo Base';
    let modelName = 'Entrenamiento Personalizado';

    if (filters.stageId) modelName = `${baseName}: Etapa Seleccionada`;
    if (filters.stageIds?.length)
      modelName = `${baseName}: Etapas Seleccionadas`;
    if (filters.lessonId) modelName = `${baseName}: Lección Seleccionada`;
    if (filters.languageId) modelName = `${baseName}: Idioma/Región`;
    if (filters.signIds?.length) {
      modelName = `${baseName}: Selección de ${filters.signIds.length} Señas`;
    }

    if (modelName === 'Entrenamiento Personalizado') {
      return isRegional ? 'Entrenamiento Regional' : 'Entrenamiento Base';
    }

    return modelName;
  }

  private async dispatchJob(params: {
    recordings: SignRecording[];
    globalStaticNoise?: SignRecording[];
    modelType: 'static' | 'dynamic';
    modelName: string;
    filters: TriggerCustomTrainingDto;
  }) {
    const modelId = randomUUID();
    const trainingData = recordingsToTrainingSamples(params.recordings);
    const globalStaticNoise = params.globalStaticNoise
      ? recordingsToTrainingSamples(params.globalStaticNoise)
      : [];

    const trainingDataDir = this.fileStoragePort.sharedPath('training_data');
    const modelsDir = this.fileStoragePort.sharedPath('models');
    const dataPath = this.fileStoragePort.sharedPath(
      'training_data',
      `train_${modelId}.json`,
    );

    await this.fileStoragePort.makeDirectory(trainingDataDir);
    await this.fileStoragePort.makeDirectory(modelsDir);

    await this.fileStoragePort.saveJson(dataPath, {
      modelType: params.modelType,
      samples: trainingData,
      globalStaticNoise,
    });

    const newModel = this.lessonModelRepository.create({
      id: modelId,
      name: params.modelName,
      status: 'PENDING',
      trainingJobId: modelId,
      modelType: params.modelType,
      ...featureMetadataForModelType(params.modelType),
      ...(params.filters.lessonId
        ? { lesson: { id: params.filters.lessonId } }
        : {}),
    });
    await this.lessonModelRepository.save(newModel);

    try {
      await this.trainingQueue.enqueueTrainCustomModel(
        {
          modelId,
          modelType: params.modelType,
          dataPath: this.fileStoragePort.workerPath(
            'training_data',
            `train_${modelId}.json`,
          ),
          outputPath: this.fileStoragePort.workerPath(
            'models',
            `model_${modelId}`,
          ),
          filters: params.filters as unknown as Record<string, unknown>,
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
            `train_${job.modelId}.json`,
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
