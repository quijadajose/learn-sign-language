import { Inject, Injectable } from '@nestjs/common';
import { LessonModelRepositoryInterface } from 'src/sign-record/domain/ports/lesson-model.repository.interface';
import { SignRecordNotificationPort } from 'src/sign-record/domain/ports/sign-record.notification.port';

@Injectable()
export class UpdateModelStatusUseCase {
  constructor(
    @Inject('LessonModelRepositoryInterface')
    private readonly lessonModelRepository: LessonModelRepositoryInterface,
    @Inject('SignRecordNotificationPort')
    private readonly notificationPort: SignRecordNotificationPort,
  ) {}

  async execute(
    id: string,
    status: 'PENDING' | 'TRAINING' | 'READY' | 'FAILED',
    errorMessage?: string,
  ) {
    const updateData: any = { status };
    if (errorMessage) {
      updateData.trainingLogs = { error: errorMessage };
    }
    await this.lessonModelRepository.update(id, updateData);

    this.notificationPort.emitStatusChange(id, status);

    return { success: true };
  }
}
