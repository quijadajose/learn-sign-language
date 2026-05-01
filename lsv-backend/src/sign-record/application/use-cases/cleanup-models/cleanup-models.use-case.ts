import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { LessonModelRepositoryInterface } from 'src/sign-record/domain/ports/lesson-model.repository.interface';

@Injectable()
export class CleanupModelsUseCase {
  private readonly logger = new Logger(CleanupModelsUseCase.name);

  constructor(
    @Inject('LessonModelRepositoryInterface')
    private readonly lessonModelRepository: LessonModelRepositoryInterface,
    @InjectQueue('training-queue')
    private readonly trainingQueue: Queue,
  ) {}

  async execute() {
    this.logger.log(
      'Checking for inconsistent model training states on startup...',
    );

    const modelsToClean =
      await this.lessonModelRepository.findPendingOrTraining();

    if (modelsToClean.length > 0) {
      for (const model of modelsToClean) {
        try {
          const job = await this.trainingQueue.getJob(model.id);
          if (job) {
            await job.remove();
            this.logger.log(`Removed BullMQ job for model ${model.id}`);
          }
        } catch (err) {
          this.logger.error(`Could not remove job ${model.id}: ${err.message}`);
        }

        model.status = 'FAILED';
        await this.lessonModelRepository.save(model);
      }
      this.logger.warn(
        `Cleaned up ${modelsToClean.length} models and their BullMQ jobs.`,
      );
    }
  }
}
