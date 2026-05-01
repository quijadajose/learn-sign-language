import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SignRepositoryInterface } from 'src/sign-record/domain/ports/sign.repository.interface';
import { UpdateSignDto } from 'src/sign-record/infrastructure/sign-record/sign-record.dto';

@Injectable()
export class UpdateSignUseCase {
  constructor(
    @Inject('SignRepositoryInterface')
    private readonly signRepository: SignRepositoryInterface,
  ) {}

  async execute(id: string, data: UpdateSignDto) {
    const sign = await this.signRepository.findById(id);
    if (!sign) throw new NotFoundException('Sign not found');

    sign.name = data.name;
    return this.signRepository.save(sign);
  }
}
