import { Module } from '@nestjs/common';
import { QuizController } from './infrastructure/controllers/quiz/quiz.controller';
import { CreateQuizWithQuestionsAndOptionsUseCase } from './application/use-cases/create-quiz-with-questions-and-options-use-case/create-quiz-with-questions-and-options-use-case';
import { QuizRepository } from './infrastructure/typeorm/quiz.repository/quiz.repository';
import { Quiz } from 'src/shared/domain/entities/quiz';
import { Question } from 'src/shared/domain/entities/question';
import { Lesson } from 'src/shared/domain/entities/lesson';
import { Option } from 'src/shared/domain/entities/option';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizService } from './application/services/quiz/quiz.service';
import { listQuizzesByLanguageIdUseCase } from './application/use-cases/list-quizzes-by-language-use-case/list-quizzes-by-language-use-case';
import { GetQuizByIdUseCase } from './application/use-cases/get-quiz-by-id-use-case/get-quiz-by-id-use-case';
import { QuizSubmission } from 'src/shared/domain/entities/quizSubmission';
import { User } from 'src/shared/domain/entities/user';
import { SubmissionTestUseCase } from './application/use-cases/submission-test-use-case/submission-test-use-case';
import { GetUserByIdUseCase } from 'src/users/application/use-cases/get-user-by-id-use-case/get-user-by-id-use-case';
import { AuthModule } from 'src/auth/auth.module';
import { GetSubmissionTestFromUserUseCase } from './application/use-cases/get-submission-test-from-user-use-case/get-submission-test-from-user-use-case';

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      Quiz,
      Question,
      Option,
      Lesson,
      QuizSubmission,
      User,
    ]),
  ],
  providers: [
    GetUserByIdUseCase,
    CreateQuizWithQuestionsAndOptionsUseCase,
    listQuizzesByLanguageIdUseCase,
    GetQuizByIdUseCase,
    SubmissionTestUseCase,
    GetSubmissionTestFromUserUseCase,
    QuizService,
    {
      provide: 'QuizRepositoryInterface',
      useClass: QuizRepository,
    },
  ],
  controllers: [QuizController],
  exports: [QuizService],
})
export class QuizModule {}
