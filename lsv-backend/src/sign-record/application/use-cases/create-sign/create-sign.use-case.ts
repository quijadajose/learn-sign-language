import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { Sign } from 'src/shared/domain/entities/sign';
import { Lesson } from 'src/shared/domain/entities/lesson';
import { SignRepositoryInterface } from 'src/sign-record/domain/ports/sign.repository.interface';
import { CreateSignDto } from 'src/sign-record/infrastructure/sign-record/sign-record.dto';

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

    const sign = this.signRepository.create({
      name: data.name,
      lessons: data.lessonId ? [{ id: data.lessonId } as Lesson] : [],
      isGlobal: data.isGlobal || false,
    });

    return this.signRepository.save(sign);
  }
}
