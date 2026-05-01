import { Inject, Injectable } from '@nestjs/common';
import { SignRecordingRepositoryInterface } from 'src/sign-record/domain/ports/sign-recording.repository.interface';

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
