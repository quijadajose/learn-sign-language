import { Inject } from '@nestjs/common';
import { QuizRepository } from 'src/quiz/infrastructure/typeorm/quiz.repository/quiz.repository';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { Quiz } from 'src/shared/domain/entities/quiz';
import { User } from 'src/shared/domain/entities/user';

export class GetSubmissionTestFromUserUseCase {
  constructor(
    @Inject('QuizRepositoryInterface')
    private readonly quizRepositoryInterface: QuizRepository,
  ) {}
  execute(user: User, quiz: Quiz, pagination: PaginationDto) {
    return this.quizRepositoryInterface.getSubmissionsByUserId(
      user,
      quiz,
      pagination,
    );
  }
}
