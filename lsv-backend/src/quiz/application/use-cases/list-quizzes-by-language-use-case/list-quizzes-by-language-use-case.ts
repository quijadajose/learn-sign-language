import { Inject } from '@nestjs/common';
import { QuizRepositoryInterface } from '../../../domain/ports/quiz.repository.interface/quiz.repository.interface.js';
import { PaginationDto } from '../../../../shared/domain/dto/PaginationDto.js';

export class listQuizzesByLanguageIdUseCase {
  constructor(
    @Inject('QuizRepositoryInterface')
    private readonly quizRepositoryInterface: QuizRepositoryInterface,
  ) {}
  execute(languageId: string, pagination: PaginationDto) {
    return this.quizRepositoryInterface.listQuizzesByLanguageId(
      languageId,
      pagination,
    );
  }
}
