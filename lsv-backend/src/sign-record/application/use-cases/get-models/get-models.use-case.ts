import { Inject, Injectable } from '@nestjs/common';
import { LessonModelRepositoryInterface } from 'src/sign-record/domain/ports/lesson-model.repository.interface';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';

@Injectable()
export class GetModelsUseCase {
  constructor(
    @Inject('LessonModelRepositoryInterface')
    private readonly lessonModelRepository: LessonModelRepositoryInterface,
  ) {}

  async execute(pagination: PaginationDto) {
    return this.lessonModelRepository.findAll(pagination);
  }
}
