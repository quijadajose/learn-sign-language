import {
  OnQueueEvent,
  QueueEventsHost,
  QueueEventsListener,
  InjectQueue,
} from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { isUUID } from 'class-validator';
import { SignRecordService } from '../../application/sign-record/sign-record.service';
import { Logger } from '@nestjs/common';

@QueueEventsListener('training-queue')
export class SignRecordEvents extends QueueEventsHost {
  private readonly logger = new Logger(SignRecordEvents.name);

  constructor(
    private readonly signRecordService: SignRecordService,
    @InjectQueue('training-queue') private readonly trainingQueue: Queue,
  ) {
    super();
  }

  private async getModelIdFromJob(jobId: string): Promise<string> {
    if (isUUID(jobId)) return jobId;
    try {
      const job = await this.trainingQueue.getJob(jobId);
      return job?.data?.modelId || jobId;
    } catch (e) {
      this.logger.error(`Failed to get job ${jobId} to retrieve modelId`, e);
      return jobId;
    }
  }

  @OnQueueEvent('active')
  async onActive({ jobId }: { jobId: string }) {
    this.logger.log(`Job ${jobId} is now active (training started)`);
    const modelId = await this.getModelIdFromJob(jobId);
    if (isUUID(modelId)) {
      await this.signRecordService.updateModelStatus(modelId, 'TRAINING');
    }
  }

  @OnQueueEvent('progress')
  async onProgress({ jobId, data }: { jobId: string; data: any }) {
    let parsedData = data;
    try {
      if (typeof data === 'string') {
        parsedData = JSON.parse(data);
      }
    } catch (e) {
      this.logger.error(`Error parsing progress data for job ${jobId}`, e);
    }

    this.logger.log(`Job ${jobId} progress: ${JSON.stringify(parsedData)}`);
    const modelId =
      parsedData?.modelId || (await this.getModelIdFromJob(jobId));
    if (isUUID(modelId)) {
      await this.signRecordService.reportProgress(modelId, parsedData);
    }
  }

  @OnQueueEvent('completed')
  async onCompleted({
    jobId,
    returnvalue,
  }: {
    jobId: string;
    returnvalue: any;
  }) {
    this.logger.log(`Job ${jobId} completed`);
    let parsedData = returnvalue;
    try {
      if (typeof returnvalue === 'string') {
        parsedData = JSON.parse(returnvalue);
      }
    } catch (e) {
      this.logger.error(`Error parsing returnvalue for job ${jobId}`, e);
      return;
    }

    const modelId =
      parsedData?.modelId || (await this.getModelIdFromJob(jobId));
    this.logger.log(`Saving results for model ${modelId}`);
    if (isUUID(modelId)) {
      await this.signRecordService.saveModelResults(modelId, parsedData);
    } else {
      this.logger.warn(
        `Model ID ${modelId} is not a valid UUID, skipping saveModelResults`,
      );
    }
  }

  @OnQueueEvent('failed')
  async onFailed({
    jobId,
    failedReason,
  }: {
    jobId: string;
    failedReason: string;
  }) {
    this.logger.error(`Job ${jobId} failed: ${failedReason}`);
    const modelId = await this.getModelIdFromJob(jobId);
    if (isUUID(modelId)) {
      await this.signRecordService.updateModelStatus(
        modelId,
        'FAILED',
        failedReason,
      );
    }
  }
}
