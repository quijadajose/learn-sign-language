import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SignRecordingRepositoryInterface } from '../../../domain/ports/sign-recording.repository.interface.js';

@Injectable()
export class DeleteRecordingUseCase {
  constructor(
    @Inject('SignRecordingRepositoryInterface')
    private readonly signRecordingRepository: SignRecordingRepositoryInterface,
  ) {}

  async execute(id: string) {
    const recording = await this.signRecordingRepository.findById(id);
    if (!recording) throw new NotFoundException('errors.recording.notFound');
    await this.signRecordingRepository.remove(recording);
    return { success: true };
  }
}
