import { Inject, Injectable } from '@nestjs/common';
import { SignRepositoryInterface } from 'src/sign-record/domain/ports/sign.repository.interface';

@Injectable()
export class GetGlobalSignsUseCase {
  constructor(
    @Inject('SignRepositoryInterface')
    private readonly signRepository: SignRepositoryInterface,
  ) {}

  async execute(regionId?: string) {
    return this.signRepository.findGlobalWithRecordingsCount(regionId);
  }
}
