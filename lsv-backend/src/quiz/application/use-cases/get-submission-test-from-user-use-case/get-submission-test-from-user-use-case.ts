import { Inject } from '@nestjs/common';
import { QuizRepositoryInterface } from '../../../domain/ports/quiz.repository.interface/quiz.repository.interface.js';
import { PaginationDto } from '../../../../shared/domain/dto/PaginationDto.js';
import { Quiz } from '../../../../shared/domain/entities/quiz.js';
import { User } from '../../../../shared/domain/entities/user.js';

export class GetSubmissionTestFromUserUseCase {
  constructor(
    @Inject('QuizRepositoryInterface')
    private readonly quizRepositoryInterface: QuizRepositoryInterface,
  ) {}
  execute(user: User, quiz: Quiz, pagination: PaginationDto) {
    return this.quizRepositoryInterface.getSubmissionsByUserId(
      user,
      quiz,
      pagination,
    );
  }
}
