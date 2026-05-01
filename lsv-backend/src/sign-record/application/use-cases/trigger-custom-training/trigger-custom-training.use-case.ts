import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { SignRecordingRepositoryInterface } from 'src/sign-record/domain/ports/sign-recording.repository.interface';
import { LessonModelRepositoryInterface } from 'src/sign-record/domain/ports/lesson-model.repository.interface';
import { FileStoragePort } from 'src/sign-record/domain/ports/file-storage.port';
import { TriggerCustomTrainingDto } from 'src/sign-record/infrastructure/sign-record/sign-record.dto';

@Injectable()
export class TriggerCustomTrainingUseCase {
  constructor(
    @Inject('SignRecordingRepositoryInterface')
    private readonly signRecordingRepository: SignRecordingRepositoryInterface,
    @Inject('LessonModelRepositoryInterface')
    private readonly lessonModelRepository: LessonModelRepositoryInterface,
    @Inject('FileStoragePort')
    private readonly fileStoragePort: FileStoragePort,
    @InjectQueue('training-queue')
    private readonly trainingQueue: Queue,
  ) {}

  async execute(filters: TriggerCustomTrainingDto) {
    const recordings =
      await this.signRecordingRepository.findForTraining(filters);

    if (recordings.length === 0)
      throw new BadRequestException('No hay datos suficientes para entrenar');

    const trainingData: any[] = recordings.map((rec) => ({
      signName: rec.sign.name,
      landmarks: rec.landmarks.map((frame: any) => frame.flat || frame),
    }));

    const tempId = uuidv4();

    const baseSharedDir = this.fileStoragePort.getSharedDir();
    const trainingDataDir = path.join(baseSharedDir, 'training_data');
    const modelsDir = path.join(baseSharedDir, 'models');
    const dataPath = path.join(trainingDataDir, `train_${tempId}.json`);

    await this.fileStoragePort.makeDirectory(trainingDataDir);
    await this.fileStoragePort.makeDirectory(modelsDir);

    await this.fileStoragePort.saveJson(dataPath, trainingData);

    let modelName = filters.modelName || 'Entrenamiento Personalizado';
    if (!filters.modelName) {
      const isRegional = filters.regionId && isUUID(filters.regionId);
      const baseName = isRegional ? 'Diferencias Regionales' : 'Modelo Base';

      if (filters.stageId) modelName = `${baseName}: Etapa Seleccionada`;
      if (filters.stageIds?.length)
        modelName = `${baseName}: Etapas Seleccionadas`;
      if (filters.lessonId) modelName = `${baseName}: Lección Seleccionada`;
      if (filters.languageId) modelName = `${baseName}: Idioma/Región`;
      if (filters.signIds?.length)
        modelName = `${baseName}: Selección de ${filters.signIds.length} Señas`;

      if (!modelName || modelName === 'Entrenamiento Personalizado') {
        modelName = isRegional
          ? 'Entrenamiento Regional'
          : 'Entrenamiento Base';
      }
    }

    const newModel = this.lessonModelRepository.create({
      id: tempId,
      name: modelName,
      status: 'PENDING',
      trainingJobId: tempId,
    });
    await this.lessonModelRepository.save(newModel);

    await this.trainingQueue.add(
      'train-job',
      {
        modelId: tempId,
        dataPath: path.join('/shared/training_data', `train_${tempId}.json`),
        outputPath: path.join('/shared/models', `model_${tempId}`),
        filters,
      },
      { jobId: tempId },
    );

    return { success: true, jobId: tempId };
  }
}
