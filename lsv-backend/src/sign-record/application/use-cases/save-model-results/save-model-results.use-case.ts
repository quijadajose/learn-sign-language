import { Inject, Injectable } from '@nestjs/common';
import { LessonModelRepositoryInterface } from 'src/sign-record/domain/ports/lesson-model.repository.interface';
import { SignRecordNotificationPort } from 'src/sign-record/domain/ports/sign-record.notification.port';

@Injectable()
export class SaveModelResultsUseCase {
  constructor(
    @Inject('LessonModelRepositoryInterface')
    private readonly lessonModelRepository: LessonModelRepositoryInterface,
    @Inject('SignRecordNotificationPort')
    private readonly notificationPort: SignRecordNotificationPort,
  ) {}

  async execute(id: string, data: any) {
    await this.lessonModelRepository.update(id, {
      status: 'READY',
      modelJsonUrl: data.modelJsonUrl,
      binUrls: data.binUrls,
      accuracy: data.accuracy,
      labels: data.labels,
      trainingLogs: data.logs,
    });

    this.notificationPort.sendModelReady(id, {
      ...data,
      trainingLogs: data.logs,
    });
    return { success: true };
  }
}
