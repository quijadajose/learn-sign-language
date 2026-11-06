import { VisibilityActor } from '../../domain/utils/language-visibility.js';
import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { PaginationDto } from '../../../shared/domain/dto/PaginationDto.js';
import { SaveLandmarksUseCase } from '../use-cases/save-landmarks/save-landmarks.use-case.js';
import { GetSignRecordingsUseCase } from '../use-cases/get-sign-recordings/get-sign-recordings.use-case.js';
import { TriggerTrainingUseCase } from '../use-cases/trigger-training/trigger-training.use-case.js';
import { GetSignsForLessonUseCase } from '../use-cases/get-signs-for-lesson/get-signs-for-lesson.use-case.js';
import { GetGlobalSignsUseCase } from '../use-cases/get-global-signs/get-global-signs.use-case.js';
import { GetModelsUseCase } from '../use-cases/get-models/get-models.use-case.js';
import { GetLessonModelUseCase } from '../use-cases/get-lesson-model/get-lesson-model.use-case.js';
import { DeleteModelUseCase } from '../use-cases/delete-model/delete-model.use-case.js';
import { DeleteRecordingUseCase } from '../use-cases/delete-recording/delete-recording.use-case.js';
import { TriggerCustomTrainingUseCase } from '../use-cases/trigger-custom-training/trigger-custom-training.use-case.js';
import { CreateSignUseCase } from '../use-cases/create-sign/create-sign.use-case.js';
import { CreateSignsBulkUseCase } from '../use-cases/create-signs-bulk/create-signs-bulk.use-case.js';
import { UpdateSignUseCase } from '../use-cases/update-sign/update-sign.use-case.js';
import { DeleteSignUseCase } from '../use-cases/delete-sign/delete-sign.use-case.js';
import { UpdateModelStatusUseCase } from '../use-cases/update-model-status/update-model-status.use-case.js';
import { ReportProgressUseCase } from '../use-cases/report-progress/report-progress.use-case.js';
import { SaveModelResultsUseCase } from '../use-cases/save-model-results/save-model-results.use-case.js';
import { CleanupModelsUseCase } from '../use-cases/cleanup-models/cleanup-models.use-case.js';
import { FileStoragePort } from '../../domain/ports/file-storage.port.js';
import {
  CreateSignDto,
  CreateSignsBulkDto,
  SaveLandmarksDto,
  TriggerCustomTrainingDto,
  UpdateSignDto,
} from '../../domain/dto/sign-record.dto.js';

@Injectable()
export class SignRecordService implements OnApplicationBootstrap {
  constructor(
    private readonly saveLandmarksUseCase: SaveLandmarksUseCase,
    private readonly getSignRecordingsUseCase: GetSignRecordingsUseCase,
    private readonly triggerTrainingUseCase: TriggerTrainingUseCase,
    private readonly getSignsForLessonUseCase: GetSignsForLessonUseCase,
    private readonly getGlobalSignsUseCase: GetGlobalSignsUseCase,
    private readonly getModelsUseCase: GetModelsUseCase,
    private readonly getLessonModelUseCase: GetLessonModelUseCase,
    private readonly deleteModelUseCase: DeleteModelUseCase,
    private readonly deleteRecordingUseCase: DeleteRecordingUseCase,
    private readonly triggerCustomTrainingUseCase: TriggerCustomTrainingUseCase,
    private readonly createSignUseCase: CreateSignUseCase,
    private readonly createSignsBulkUseCase: CreateSignsBulkUseCase,
    private readonly updateSignUseCase: UpdateSignUseCase,
    private readonly deleteSignUseCase: DeleteSignUseCase,
    private readonly updateModelStatusUseCase: UpdateModelStatusUseCase,
    private readonly reportProgressUseCase: ReportProgressUseCase,
    private readonly saveModelResultsUseCase: SaveModelResultsUseCase,
    private readonly cleanupModelsUseCase: CleanupModelsUseCase,
    @Inject('FileStoragePort')
    private readonly fileStoragePort: FileStoragePort,
  ) {}

  async onApplicationBootstrap() {
    await this.fileStoragePort.ensureSharedDirWritable();
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

  async getGlobalSigns(actor: VisibilityActor, regionId?: string) {
    return this.getGlobalSignsUseCase.execute(actor, regionId);
  }

  async getModels(actor: VisibilityActor, pagination: PaginationDto) {
    return this.getModelsUseCase.execute(actor, pagination);
  }

  async getLessonModel(lessonId: string, regionId?: string) {
    return this.getLessonModelUseCase.execute(lessonId, regionId);
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

  async saveModelResults(id: string, data: unknown) {
    return this.saveModelResultsUseCase.execute(id, data);
  }

  async createSign(data: CreateSignDto) {
    return this.createSignUseCase.execute(data);
  }

  async createSignsBulk(data: CreateSignsBulkDto) {
    return this.createSignsBulkUseCase.execute(data);
  }

  async updateSign(id: string, data: UpdateSignDto) {
    return this.updateSignUseCase.execute(id, data);
  }

  async deleteSign(id: string) {
    return this.deleteSignUseCase.execute(id);
  }
}
