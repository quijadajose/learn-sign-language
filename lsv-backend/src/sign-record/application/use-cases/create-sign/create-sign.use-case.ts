import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { SignRepositoryInterface } from '../../../domain/ports/sign.repository.interface.js';
import { CreateSignDto } from '../../../domain/dto/sign-record.dto.js';

@Injectable()
export class CreateSignUseCase {
  constructor(
    @Inject('SignRepositoryInterface')
    private readonly signRepository: SignRepositoryInterface,
  ) {}

  async execute(data: CreateSignDto) {
    if (!data.name) {
      throw new BadRequestException('errors.sign.nameRequired');
    }
    if (!data.languageId) {
      throw new BadRequestException('errors.sign.languageIdRequired');
    }

    const sign = this.signRepository.create({
      name: data.name,
      language: { id: data.languageId },
      lessons: data.lessonId ? [{ id: data.lessonId }] : [],
      isGlobal: data.isGlobal || false,
      detectionType: data.detectionType || 'static',
    });

    return this.signRepository.save(sign);
  }
}
