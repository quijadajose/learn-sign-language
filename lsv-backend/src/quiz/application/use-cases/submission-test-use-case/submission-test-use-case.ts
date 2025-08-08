import { Inject } from '@nestjs/common';
import { QuizRepository } from 'src/quiz/infrastructure/typeorm/quiz.repository/quiz.repository';
import { SubmissionDto } from '../../dto/submission/submission-dto';
import { Quiz } from 'src/shared/domain/entities/quiz';
import { User } from 'src/shared/domain/entities/user';

export class SubmissionTestUseCase {
  constructor(
    @Inject('QuizRepositoryInterface')
    private readonly quizRepositoryInterface: QuizRepository,
  ) {}
  execute(user: User, quiz: Quiz, answers: SubmissionDto) {
    return this.quizRepositoryInterface.submissionTest(user, quiz, answers);
  }
}
