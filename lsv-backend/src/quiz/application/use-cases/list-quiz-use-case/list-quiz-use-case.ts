import { Injectable, Inject } from '@nestjs/common';
import { QuizRepositoryInterface } from '../../../domain/ports/quiz.repository.interface/quiz.repository.interface.js';
import { PaginationDto } from '../../../../shared/domain/dto/PaginationDto.js';
import { Quiz } from '../../../../shared/domain/entities/quiz.js';

@Injectable()
export class ListQuizUseCase {
  constructor(
    @Inject('QuizRepositoryInterface')
    private readonly quizRepository: QuizRepositoryInterface,
  ) {}

  async execute(pagination: PaginationDto): Promise<Quiz[]> {
    return this.quizRepository.findAll(pagination);
  }
}
