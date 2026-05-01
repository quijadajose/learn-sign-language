import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SignRepositoryInterface } from 'src/sign-record/domain/ports/sign.repository.interface';

@Injectable()
export class DeleteSignUseCase {
  constructor(
    @Inject('SignRepositoryInterface')
    private readonly signRepository: SignRepositoryInterface,
  ) {}

  async execute(id: string) {
    const sign = await this.signRepository.findById(id);
    if (!sign) throw new NotFoundException('Sign not found');

    return this.signRepository.remove(sign);
  }
}
