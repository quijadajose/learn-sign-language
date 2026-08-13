import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  TrainCustomModelJob,
  TrainLessonModelJob,
  TrainingJobState,
  TrainingQueuePort,
} from '../../domain/ports/training-queue.port';

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
  ) {}

  async enqueueTrainLessonModel(
    job: TrainLessonModelJob,
    jobId: string,
  ): Promise<void> {
    await this.trainingQueue.add('train-lesson-model', job, {
      jobId,
      ...TRAINING_JOB_OPTIONS,
    });
  }

  async enqueueTrainCustomModel(
    job: TrainCustomModelJob,
    jobId: string,
  ): Promise<void> {
    await this.trainingQueue.add('train-job', job, {
      jobId,
      ...TRAINING_JOB_OPTIONS,
    });
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
