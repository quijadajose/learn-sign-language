import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SignRecordingRepositoryInterface } from 'src/sign-record/domain/ports/sign-recording.repository.interface';

@Injectable()
export class DeleteRecordingUseCase {
  constructor(
    @Inject('SignRecordingRepositoryInterface')
    private readonly signRecordingRepository: SignRecordingRepositoryInterface,
  ) {}

  async execute(id: string) {
    const recording = await this.signRecordingRepository.findById(id);
    if (!recording) throw new NotFoundException('Grabación no encontrada');
    await this.signRecordingRepository.remove(recording);
    return { success: true };
  }
}
