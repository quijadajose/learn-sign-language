import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SignRepositoryInterface } from '../../../domain/ports/sign.repository.interface.js';
import { UpdateSignDto } from '../../../domain/dto/sign-record.dto.js';

@Injectable()
export class UpdateSignUseCase {
  constructor(
    @Inject('SignRepositoryInterface')
    private readonly signRepository: SignRepositoryInterface,
  ) {}

  async execute(id: string, data: UpdateSignDto) {
    const sign = await this.signRepository.findById(id);
    if (!sign) throw new NotFoundException('errors.sign.notFound');

    if (data.name === undefined && data.detectionType === undefined) {
      throw new BadRequestException(
        'Debes enviar al menos name o detectionType',
      );
    }

    if (data.name !== undefined) {
      sign.name = data.name;
    }
    if (data.detectionType !== undefined) {
      sign.detectionType = data.detectionType;
    }
    return this.signRepository.save(sign);
  }
}
