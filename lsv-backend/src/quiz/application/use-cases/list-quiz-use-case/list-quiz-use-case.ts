import { Injectable, Inject } from '@nestjs/common';
import { QuizRepositoryInterface } from 'src/quiz/domain/ports/quiz.repository.interface/quiz.repository.interface';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { Quiz } from 'src/shared/domain/entities/quiz';

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
