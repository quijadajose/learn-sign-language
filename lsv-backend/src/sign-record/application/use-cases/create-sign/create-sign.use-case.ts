import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { SignRepositoryInterface } from 'src/sign-record/domain/ports/sign.repository.interface';
import { CreateSignDto } from 'src/sign-record/domain/dto/sign-record.dto';

@Injectable()
export class CreateSignUseCase {
  constructor(
    @Inject('SignRepositoryInterface')
    private readonly signRepository: SignRepositoryInterface,
  ) {}

  async execute(data: CreateSignDto) {
    if (!data.name) {
      throw new BadRequestException('Name is required');
    }
    if (!data.languageId) {
      throw new BadRequestException('languageId is required');
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
