import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module.js';
import { SignRecordService } from './application/sign-record/sign-record.service.js';
import { SignRecordController } from './infrastructure/sign-record/sign-record.controller.js';
import { Sign } from '../shared/domain/entities/sign.js';
import { SignVariant } from '../shared/domain/entities/signVariant.js';
import { SignRecording } from '../shared/domain/entities/signRecording.js';
import { Lesson } from '../shared/domain/entities/lesson.js';
import { LessonVariant } from '../shared/domain/entities/lessonVariant.js';
import { LessonModel } from '../shared/domain/entities/lessonModel.js';
import { SignRecordGateway } from './infrastructure/sign-record/sign-record.gateway.js';
import { SignRecordEvents } from './infrastructure/sign-record/sign-record.events.js';
import { TypeOrmSignRepository } from './infrastructure/repositories/sign.repository.js';
import { TypeOrmSignVariantRepository } from './infrastructure/repositories/sign-variant.repository.js';
import { TypeOrmLessonVariantRepository } from './infrastructure/repositories/lesson-variant.repository.js';
import { TypeOrmLessonRepository } from './infrastructure/repositories/lesson.repository.js';
import { TypeOrmLessonModelRepository } from './infrastructure/repositories/lesson-model.repository.js';
import { TypeOrmSignRecordingRepository } from './infrastructure/repositories/sign-recording.repository.js';
import { SaveLandmarksUseCase } from './application/use-cases/save-landmarks/save-landmarks.use-case.js';
import { GetSignRecordingsUseCase } from './application/use-cases/get-sign-recordings/get-sign-recordings.use-case.js';
import { TriggerTrainingUseCase } from './application/use-cases/trigger-training/trigger-training.use-case.js';
import { GetSignsForLessonUseCase } from './application/use-cases/get-signs-for-lesson/get-signs-for-lesson.use-case.js';
import { GetGlobalSignsUseCase } from './application/use-cases/get-global-signs/get-global-signs.use-case.js';
import { GetModelsUseCase } from './application/use-cases/get-models/get-models.use-case.js';
import { GetLessonModelUseCase } from './application/use-cases/get-lesson-model/get-lesson-model.use-case.js';
import { DeleteModelUseCase } from './application/use-cases/delete-model/delete-model.use-case.js';
import { DeleteRecordingUseCase } from './application/use-cases/delete-recording/delete-recording.use-case.js';
import { TriggerCustomTrainingUseCase } from './application/use-cases/trigger-custom-training/trigger-custom-training.use-case.js';
import { CreateSignUseCase } from './application/use-cases/create-sign/create-sign.use-case.js';
import { CreateSignsBulkUseCase } from './application/use-cases/create-signs-bulk/create-signs-bulk.use-case.js';
import { UpdateSignUseCase } from './application/use-cases/update-sign/update-sign.use-case.js';
import { DeleteSignUseCase } from './application/use-cases/delete-sign/delete-sign.use-case.js';
import { UpdateModelStatusUseCase } from './application/use-cases/update-model-status/update-model-status.use-case.js';
import { ReportProgressUseCase } from './application/use-cases/report-progress/report-progress.use-case.js';
import { SaveModelResultsUseCase } from './application/use-cases/save-model-results/save-model-results.use-case.js';
import { CleanupModelsUseCase } from './application/use-cases/cleanup-models/cleanup-models.use-case.js';

import { LocalFileStorageAdapter } from './infrastructure/file-storage/local-file-storage.adapter.js';
import { BullMqTrainingQueueAdapter } from './infrastructure/queue/bullmq-training-queue.adapter.js';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Sign,
      SignVariant,
      SignRecording,
      Lesson,
      LessonVariant,
      LessonModel,
    ]),
    BullModule.registerQueue({
      name: 'training-queue',
    }),
  ],
  controllers: [SignRecordController],
  providers: [
    SignRecordService,
    SignRecordGateway,
    SignRecordEvents,
    {
      provide: 'SignRepositoryInterface',
      useClass: TypeOrmSignRepository,
    },
    {
      provide: 'SignVariantRepositoryInterface',
      useClass: TypeOrmSignVariantRepository,
    },
    {
      provide: 'LessonVariantRepositoryInterface',
      useClass: TypeOrmLessonVariantRepository,
    },
    {
      provide: 'LessonRepositoryInterface',
      useClass: TypeOrmLessonRepository,
    },
    {
      provide: 'LessonModelRepositoryInterface',
      useClass: TypeOrmLessonModelRepository,
    },

    {
      provide: 'SignRecordingRepositoryInterface',
      useClass: TypeOrmSignRecordingRepository,
    },
    {
      // BE-19: reutiliza la misma instancia del gateway (antes se creaban dos).
      provide: 'SignRecordNotificationPort',
      useExisting: SignRecordGateway,
    },
    {
      provide: 'FileStoragePort',
      useClass: LocalFileStorageAdapter,
    },
    {
      provide: 'TrainingQueuePort',
      useClass: BullMqTrainingQueueAdapter,
    },
    SaveLandmarksUseCase,
    GetSignRecordingsUseCase,
    TriggerTrainingUseCase,
    GetSignsForLessonUseCase,
    GetGlobalSignsUseCase,
    GetModelsUseCase,
    GetLessonModelUseCase,
    DeleteModelUseCase,
    DeleteRecordingUseCase,
    TriggerCustomTrainingUseCase,
    CreateSignUseCase,
    CreateSignsBulkUseCase,
    UpdateSignUseCase,
    DeleteSignUseCase,
    UpdateModelStatusUseCase,
    ReportProgressUseCase,
    SaveModelResultsUseCase,
    CleanupModelsUseCase,
  ],
  exports: [SignRecordService],
})
export class SignRecordModule {}
