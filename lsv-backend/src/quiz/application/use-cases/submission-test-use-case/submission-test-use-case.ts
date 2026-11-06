import { Inject } from '@nestjs/common';
import { QuizRepositoryInterface } from '../../../domain/ports/quiz.repository.interface/quiz.repository.interface.js';
import { SubmissionDto } from '../../dto/submission/submission-dto.js';
import { Quiz } from '../../../../shared/domain/entities/quiz.js';
import { User } from '../../../../shared/domain/entities/user.js';

export class SubmissionTestUseCase {
  constructor(
    @Inject('QuizRepositoryInterface')
    private readonly quizRepositoryInterface: QuizRepositoryInterface,
  ) {}
  execute(user: User, quiz: Quiz, answers: SubmissionDto) {
    return this.quizRepositoryInterface.submissionTest(user, quiz, answers);
  }
}
