import { Inject, Injectable, Logger } from '@nestjs/common';
import { LessonModelRepositoryInterface } from '../../../domain/ports/lesson-model.repository.interface.js';
import { SignRecordNotificationPort } from '../../../domain/ports/sign-record.notification.port.js';

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
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error updating progress for model ${modelId}: ${message}`,
      );
    }

    const languageId = await this.findLanguageId(modelId);
    this.notificationPort.sendProgress(
      modelId,
      languageId,
      data.progress,
      data.accuracy,
    );
    return { success: true };
  }

  private async findLanguageId(modelId: string): Promise<string | null> {
    try {
      const model = await this.lessonModelRepository.findById(modelId);
      return model?.lesson?.language?.id ?? null;
    } catch {
      return null;
    }
  }
}
