import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { SaveLandmarksUseCase } from '../use-cases/save-landmarks/save-landmarks.use-case';
import { GetSignRecordingsUseCase } from '../use-cases/get-sign-recordings/get-sign-recordings.use-case';
import { TriggerTrainingUseCase } from '../use-cases/trigger-training/trigger-training.use-case';
import { GetSignsForLessonUseCase } from '../use-cases/get-signs-for-lesson/get-signs-for-lesson.use-case';
import { GetGlobalSignsUseCase } from '../use-cases/get-global-signs/get-global-signs.use-case';
import { GetModelsUseCase } from '../use-cases/get-models/get-models.use-case';
import { DeleteModelUseCase } from '../use-cases/delete-model/delete-model.use-case';
import { DeleteRecordingUseCase } from '../use-cases/delete-recording/delete-recording.use-case';
import { TriggerCustomTrainingUseCase } from '../use-cases/trigger-custom-training/trigger-custom-training.use-case';
import { CreateSignUseCase } from '../use-cases/create-sign/create-sign.use-case';
import { UpdateSignUseCase } from '../use-cases/update-sign/update-sign.use-case';
import { DeleteSignUseCase } from '../use-cases/delete-sign/delete-sign.use-case';
import { UpdateModelStatusUseCase } from '../use-cases/update-model-status/update-model-status.use-case';
import { ReportProgressUseCase } from '../use-cases/report-progress/report-progress.use-case';
import { SaveModelResultsUseCase } from '../use-cases/save-model-results/save-model-results.use-case';
import { CleanupModelsUseCase } from '../use-cases/cleanup-models/cleanup-models.use-case';
import {
  CreateSignDto,
  SaveLandmarksDto,
  TriggerCustomTrainingDto,
  UpdateSignDto,
} from '../../infrastructure/sign-record/sign-record.dto';

@Injectable()
export class SignRecordService implements OnApplicationBootstrap {
  constructor(
    private readonly saveLandmarksUseCase: SaveLandmarksUseCase,
    private readonly getSignRecordingsUseCase: GetSignRecordingsUseCase,
    private readonly triggerTrainingUseCase: TriggerTrainingUseCase,
    private readonly getSignsForLessonUseCase: GetSignsForLessonUseCase,
    private readonly getGlobalSignsUseCase: GetGlobalSignsUseCase,
    private readonly getModelsUseCase: GetModelsUseCase,
    private readonly deleteModelUseCase: DeleteModelUseCase,
    private readonly deleteRecordingUseCase: DeleteRecordingUseCase,
    private readonly triggerCustomTrainingUseCase: TriggerCustomTrainingUseCase,
    private readonly createSignUseCase: CreateSignUseCase,
    private readonly updateSignUseCase: UpdateSignUseCase,
    private readonly deleteSignUseCase: DeleteSignUseCase,
    private readonly updateModelStatusUseCase: UpdateModelStatusUseCase,
    private readonly reportProgressUseCase: ReportProgressUseCase,
    private readonly saveModelResultsUseCase: SaveModelResultsUseCase,
    private readonly cleanupModelsUseCase: CleanupModelsUseCase,
  ) {}

  async onApplicationBootstrap() {
    await this.cleanupModelsUseCase.execute();
  }
  async saveLandmarks(data: SaveLandmarksDto) {
    return this.saveLandmarksUseCase.execute(data);
  }

  async getSignRecordings(signId: string, regionId?: string) {
    return this.getSignRecordingsUseCase.execute(signId, regionId);
  }

  async triggerTraining(lessonVariantId: string) {
    return this.triggerTrainingUseCase.execute(lessonVariantId);
  }

  async getSignsForLesson(lessonId: string, regionId?: string) {
    return this.getSignsForLessonUseCase.execute(lessonId, regionId);
  }

  async getGlobalSigns(regionId?: string) {
    return this.getGlobalSignsUseCase.execute(regionId);
  }

  async getModels(pagination: PaginationDto) {
    return this.getModelsUseCase.execute(pagination);
  }

  async deleteModel(id: string) {
    return this.deleteModelUseCase.execute(id);
  }

  async deleteRecording(id: string) {
    return this.deleteRecordingUseCase.execute(id);
  }

  async triggerCustomTraining(filters: TriggerCustomTrainingDto) {
    return this.triggerCustomTrainingUseCase.execute(filters);
  }

  async updateModelStatus(
    id: string,
    status: 'PENDING' | 'TRAINING' | 'READY' | 'FAILED',
    errorMessage?: string,
  ) {
    return this.updateModelStatusUseCase.execute(id, status, errorMessage);
  }

  async reportProgress(
    modelId: string,
    data: { progress: number; accuracy: number },
  ) {
    return this.reportProgressUseCase.execute(modelId, data);
  }

  async saveModelResults(id: string, data: any) {
    return this.saveModelResultsUseCase.execute(id, data);
  }

  async createSign(data: CreateSignDto) {
    return this.createSignUseCase.execute(data);
  }

  async updateSign(id: string, data: UpdateSignDto) {
    return this.updateSignUseCase.execute(id, data);
  }

  async deleteSign(id: string) {
    return this.deleteSignUseCase.execute(id);
  }
}
