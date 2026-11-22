import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SignRepositoryInterface } from '../../../domain/ports/sign.repository.interface.js';

@Injectable()
export class DeleteSignUseCase {
  constructor(
    @Inject('SignRepositoryInterface')
    private readonly signRepository: SignRepositoryInterface,
  ) {}

  async execute(id: string) {
    const sign = await this.signRepository.findById(id);
    if (!sign) throw new NotFoundException('errors.sign.notFound');

    return this.signRepository.remove(sign);
  }
}
