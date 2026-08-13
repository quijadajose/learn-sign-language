export type TrainingModelType = 'static' | 'dynamic';

export type TrainLessonModelJob = {
  lessonVariantId: string;
  modelId: string;
  modelType: TrainingModelType;
  dataPath: string;
  outputPath: string;
};

export type TrainCustomModelJob = {
  modelId: string;
  modelType: TrainingModelType;
  dataPath: string;
  outputPath: string;
  filters: Record<string, unknown>;
};

export type TrainingJobState =
  'active' | 'waiting' | 'completed' | 'failed' | 'delayed' | 'unknown';

export interface TrainingQueuePort {
  enqueueTrainLessonModel(
    job: TrainLessonModelJob,
    jobId: string,
  ): Promise<void>;
  enqueueTrainCustomModel(
    job: TrainCustomModelJob,
    jobId: string,
  ): Promise<void>;
  removeJob(jobId: string): Promise<void>;
  /** null when the job does not exist. */
  getJobState(jobId: string): Promise<TrainingJobState | null>;
}
