import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  TrainCustomModelJob,
  TrainLessonModelJob,
  TrainingJobState,
  TrainingQueuePort,
} from '../../domain/ports/training-queue.port.js';
import { withJobHmac } from './sign-training-job.js';

/** Shared BullMQ options for ML training jobs (long-running, mostly non-retryable). */
const TRAINING_JOB_OPTIONS = {
  attempts: 1,
  removeOnComplete: { age: 86_400, count: 100 },
  removeOnFail: { age: 7 * 86_400, count: 200 },
} as const;

@Injectable()
export class BullMqTrainingQueueAdapter implements TrainingQueuePort {
  constructor(
    @InjectQueue('training-queue')
    private readonly trainingQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

  private hmacSecret(): string {
    // Sin fallback a JWT_SECRET: compartirlo haría que filtrar uno comprometa
    // también el otro (firmar jobs o emitir sesiones).
    const secret = this.configService.get<string>('TRAINER_JOB_SECRET');
    if (!secret) {
      throw new Error('TRAINER_JOB_SECRET is required');
    }
    return secret;
  }

  async enqueueTrainLessonModel(
    job: TrainLessonModelJob,
    jobId: string,
  ): Promise<void> {
    await this.trainingQueue.add(
      'train-lesson-model',
      withJobHmac({ ...job }, this.hmacSecret()),
      {
        jobId,
        ...TRAINING_JOB_OPTIONS,
      },
    );
  }

  async enqueueTrainCustomModel(
    job: TrainCustomModelJob,
    jobId: string,
  ): Promise<void> {
    await this.trainingQueue.add(
      'train-job',
      withJobHmac({ ...job }, this.hmacSecret()),
      {
        jobId,
        ...TRAINING_JOB_OPTIONS,
      },
    );
  }

  async removeJob(jobId: string): Promise<void> {
    const queueJob = await this.trainingQueue.getJob(jobId);
    if (queueJob) await queueJob.remove();
  }

  async getJobState(jobId: string): Promise<TrainingJobState | null> {
    const queueJob = await this.trainingQueue.getJob(jobId);
    if (!queueJob) return null;
    const state = await queueJob.getState();
    if (
      state === 'active' ||
      state === 'waiting' ||
      state === 'completed' ||
      state === 'failed' ||
      state === 'delayed'
    ) {
      return state;
    }
    return 'unknown';
  }
}
