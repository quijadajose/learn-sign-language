import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SignRepositoryInterface } from 'src/sign-record/domain/ports/sign.repository.interface';
import { UpdateSignDto } from 'src/sign-record/domain/dto/sign-record.dto';

@Injectable()
export class UpdateSignUseCase {
  constructor(
    @Inject('SignRepositoryInterface')
    private readonly signRepository: SignRepositoryInterface,
  ) {}

  async execute(id: string, data: UpdateSignDto) {
    const sign = await this.signRepository.findById(id);
    if (!sign) throw new NotFoundException('Sign not found');

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
