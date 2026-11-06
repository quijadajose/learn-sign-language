import { Inject, Injectable } from '@nestjs/common';
import { LessonModel } from '../../../../shared/domain/entities/lessonModel.js';
import { LessonModelRepositoryInterface } from '../../../domain/ports/lesson-model.repository.interface.js';
import { SignRecordNotificationPort } from '../../../domain/ports/sign-record.notification.port.js';

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
    const updateData: Partial<LessonModel> = { status };
    if (errorMessage) {
      updateData.trainingLogs = { error: errorMessage };
    }
    await this.lessonModelRepository.update(id, updateData);

    this.notificationPort.emitStatusChange(id, status);

    return { success: true };
  }
}
