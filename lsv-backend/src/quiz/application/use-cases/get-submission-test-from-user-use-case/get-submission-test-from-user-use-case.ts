import { Inject } from '@nestjs/common';
import { QuizRepositoryInterface } from 'src/quiz/domain/ports/quiz.repository.interface/quiz.repository.interface';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { Quiz } from 'src/shared/domain/entities/quiz';
import { User } from 'src/shared/domain/entities/user';

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
