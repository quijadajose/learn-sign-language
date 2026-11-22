import { Inject, Injectable } from '@nestjs/common';
import { SignRecordingRepositoryInterface } from '../../../domain/ports/sign-recording.repository.interface.js';

@Injectable()
export class GetSignRecordingsUseCase {
  constructor(
    @Inject('SignRecordingRepositoryInterface')
    private readonly signRecordingRepository: SignRecordingRepositoryInterface,
  ) {}

  async execute(signId: string, regionId?: string) {
    return this.signRecordingRepository.findBySignAndRegion(signId, regionId);
  }
}
