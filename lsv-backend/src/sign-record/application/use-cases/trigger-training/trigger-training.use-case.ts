import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as path from 'path';
import { LessonVariantRepositoryInterface } from 'src/sign-record/domain/ports/lesson-variant.repository.interface';
import { LessonModelRepositoryInterface } from 'src/sign-record/domain/ports/lesson-model.repository.interface';
import { SignRepositoryInterface } from 'src/sign-record/domain/ports/sign.repository.interface';
import { FileStoragePort } from 'src/sign-record/domain/ports/file-storage.port';

@Injectable()
export class TriggerTrainingUseCase {
  constructor(
    @Inject('LessonVariantRepositoryInterface')
    private readonly lessonVariantRepository: LessonVariantRepositoryInterface,
    @Inject('LessonModelRepositoryInterface')
    private readonly lessonModelRepository: LessonModelRepositoryInterface,
    @Inject('SignRepositoryInterface')
    private readonly signRepository: SignRepositoryInterface,
    @Inject('FileStoragePort')
    private readonly fileStoragePort: FileStoragePort,
    @InjectQueue('training-queue')
    private readonly trainingQueue: Queue,
  ) {}

  async execute(lessonVariantId: string) {
    const lessonVariant =
      await this.lessonVariantRepository.findByIdWithBaseAndRegion(
        lessonVariantId,
      );

    if (!lessonVariant) throw new NotFoundException('Lesson variant not found');

    let model =
      await this.lessonModelRepository.findByLessonVariantId(lessonVariantId);

    if (!model) {
      model = this.lessonModelRepository.create({
        lessonVariant,
        status: 'PENDING',
        progress: 0,
        accuracy: 0,
      });
    } else {
      model.status = 'PENDING';
      model.progress = 0;
      model.accuracy = 0;
    }
    await this.lessonModelRepository.save(model);

    const signs = await this.signRepository.findForTraining(
      lessonVariant.baseLesson.id,
    );

    const trainingData = signs.map((sign) => {
      const variant = sign.variants.find(
        (v) => v.region?.id === lessonVariant.region?.id,
      );
      return {
        signName: sign.name,
        landmarks: variant?.landmarks || sign.landmarks || [],
      };
    });

    const baseSharedDir = this.fileStoragePort.getSharedDir();
    const trainingDataDir = path.join(baseSharedDir, 'training_data');

    await this.fileStoragePort.makeDirectory(trainingDataDir);

    const dataPath = path.join(trainingDataDir, `${model.id}.json`);
    await this.fileStoragePort.saveJson(dataPath, trainingData);

    const job = await this.trainingQueue.add(
      'train-lesson-model',
      {
        lessonVariantId,
        modelId: model.id,
        dataPath: path.join('/shared/training_data', `${model.id}.json`),
        outputPath: path.join('/shared/models', lessonVariantId),
      },
      { jobId: model.id },
    );

    model.trainingJobId = job.id;
    await this.lessonModelRepository.save(model);

    return { jobId: job.id, status: 'QUEUED' };
  }
}
