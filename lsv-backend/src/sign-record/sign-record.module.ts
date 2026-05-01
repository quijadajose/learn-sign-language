import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { SignRecordService } from './application/sign-record/sign-record.service';
import { SignRecordController } from './infrastructure/sign-record/sign-record.controller';
import { Sign } from '../shared/domain/entities/sign';
import { SignVariant } from '../shared/domain/entities/signVariant';
import { SignRecording } from '../shared/domain/entities/signRecording';
import { Lesson } from '../shared/domain/entities/lesson';
import { LessonVariant } from '../shared/domain/entities/lessonVariant';
import { LessonModel } from '../shared/domain/entities/lessonModel';
import { SignRecordGateway } from './infrastructure/sign-record/sign-record.gateway';
import { SignRecordEvents } from './infrastructure/sign-record/sign-record.events';
import { TypeOrmSignRepository } from './infrastructure/repositories/sign.repository';
import { TypeOrmSignVariantRepository } from './infrastructure/repositories/sign-variant.repository';
import { TypeOrmLessonVariantRepository } from './infrastructure/repositories/lesson-variant.repository';
import { TypeOrmLessonModelRepository } from './infrastructure/repositories/lesson-model.repository';
import { TypeOrmSignRecordingRepository } from './infrastructure/repositories/sign-recording.repository';
import { SaveLandmarksUseCase } from './application/use-cases/save-landmarks/save-landmarks.use-case';
import { GetSignRecordingsUseCase } from './application/use-cases/get-sign-recordings/get-sign-recordings.use-case';
import { TriggerTrainingUseCase } from './application/use-cases/trigger-training/trigger-training.use-case';
import { GetSignsForLessonUseCase } from './application/use-cases/get-signs-for-lesson/get-signs-for-lesson.use-case';
import { GetGlobalSignsUseCase } from './application/use-cases/get-global-signs/get-global-signs.use-case';
import { GetModelsUseCase } from './application/use-cases/get-models/get-models.use-case';
import { DeleteModelUseCase } from './application/use-cases/delete-model/delete-model.use-case';
import { DeleteRecordingUseCase } from './application/use-cases/delete-recording/delete-recording.use-case';
import { TriggerCustomTrainingUseCase } from './application/use-cases/trigger-custom-training/trigger-custom-training.use-case';
import { CreateSignUseCase } from './application/use-cases/create-sign/create-sign.use-case';
import { UpdateSignUseCase } from './application/use-cases/update-sign/update-sign.use-case';
import { DeleteSignUseCase } from './application/use-cases/delete-sign/delete-sign.use-case';
import { UpdateModelStatusUseCase } from './application/use-cases/update-model-status/update-model-status.use-case';
import { ReportProgressUseCase } from './application/use-cases/report-progress/report-progress.use-case';
import { SaveModelResultsUseCase } from './application/use-cases/save-model-results/save-model-results.use-case';
import { CleanupModelsUseCase } from './application/use-cases/cleanup-models/cleanup-models.use-case';

import { LocalFileStorageAdapter } from './infrastructure/file-storage/local-file-storage.adapter';

@Module({
  imports: [
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
      provide: 'LessonModelRepositoryInterface',
      useClass: TypeOrmLessonModelRepository,
    },
    {
      provide: 'SignRecordingRepositoryInterface',
      useClass: TypeOrmSignRecordingRepository,
    },
    {
      provide: 'SignRecordNotificationPort',
      useClass: SignRecordGateway,
    },
    {
      provide: 'FileStoragePort',
      useClass: LocalFileStorageAdapter,
    },
    SaveLandmarksUseCase,
    GetSignRecordingsUseCase,
    TriggerTrainingUseCase,
    GetSignsForLessonUseCase,
    GetGlobalSignsUseCase,
    GetModelsUseCase,
    DeleteModelUseCase,
    DeleteRecordingUseCase,
    TriggerCustomTrainingUseCase,
    CreateSignUseCase,
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
