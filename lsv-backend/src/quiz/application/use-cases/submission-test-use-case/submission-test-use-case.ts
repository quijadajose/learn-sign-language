import { Inject } from '@nestjs/common';
import { QuizRepositoryInterface } from 'src/quiz/domain/ports/quiz.repository.interface/quiz.repository.interface';
import { SubmissionDto } from '../../dto/submission/submission-dto';
import { Quiz } from 'src/shared/domain/entities/quiz';
import { User } from 'src/shared/domain/entities/user';

export class SubmissionTestUseCase {
  constructor(
    @Inject('QuizRepositoryInterface')
    private readonly quizRepositoryInterface: QuizRepositoryInterface,
  ) {}
  execute(user: User, quiz: Quiz, answers: SubmissionDto) {
    return this.quizRepositoryInterface.submissionTest(user, quiz, answers);
  }
}
