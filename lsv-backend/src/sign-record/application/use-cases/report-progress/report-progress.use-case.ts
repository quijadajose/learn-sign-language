import { Inject, Injectable, Logger } from '@nestjs/common';
import { LessonModelRepositoryInterface } from 'src/sign-record/domain/ports/lesson-model.repository.interface';
import { SignRecordNotificationPort } from 'src/sign-record/domain/ports/sign-record.notification.port';

@Injectable()
export class ReportProgressUseCase {
  private readonly logger = new Logger(ReportProgressUseCase.name);

  constructor(
    @Inject('LessonModelRepositoryInterface')
    private readonly lessonModelRepository: LessonModelRepositoryInterface,
    @Inject('SignRecordNotificationPort')
    private readonly notificationPort: SignRecordNotificationPort,
  ) {}

  async execute(modelId: string, data: { progress: number; accuracy: number }) {
    try {
      await this.lessonModelRepository.update(modelId, {
        progress: data.progress,
        accuracy: data.accuracy,
        status: 'TRAINING',
      });
    } catch (error) {
      this.logger.error(
        `Error updating progress for model ${modelId}: ${error.message}`,
      );
    }

    this.notificationPort.sendProgress(modelId, data.progress, data.accuracy);
    return { success: true };
  }
}
