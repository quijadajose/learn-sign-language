import { Module } from '@nestjs/common';
import { QuizController } from './infrastructure/controllers/quiz/quiz.controller';
import { QuizVariantController } from './infrastructure/controllers/quiz-variant.controller';
import { CreateQuizWithQuestionsAndOptionsUseCase } from './application/use-cases/create-quiz-with-questions-and-options-use-case/create-quiz-with-questions-and-options-use-case';
import { QuizRepository } from './infrastructure/typeorm/quiz.repository/quiz.repository';
import { QuizVariantRepository } from './infrastructure/typeorm/quiz-variant.repository/quiz-variant.repository';
import { Quiz } from 'src/shared/domain/entities/quiz';
import { Question } from 'src/shared/domain/entities/question';
import { Lesson } from 'src/shared/domain/entities/lesson';
import { Option } from 'src/shared/domain/entities/option';
import { QuizVariant } from 'src/shared/domain/entities/quizVariant';
import { QuestionVariant } from 'src/shared/domain/entities/questionVariant';
import { OptionVariant } from 'src/shared/domain/entities/optionVariant';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizService } from './application/services/quiz/quiz.service';
import { QuizVariantService } from './application/services/quiz-variant.service';
import { listQuizzesByLanguageIdUseCase } from './application/use-cases/list-quizzes-by-language-use-case/list-quizzes-by-language-use-case';
import { GetQuizByIdUseCase } from './application/use-cases/get-quiz-by-id-use-case/get-quiz-by-id-use-case';
import { QuizSubmission } from 'src/shared/domain/entities/quizSubmission';
import { User } from 'src/shared/domain/entities/user';
import { SubmissionTestUseCase } from './application/use-cases/submission-test-use-case/submission-test-use-case';
import { GetUserByIdUseCase } from 'src/users/application/use-cases/get-user-by-id-use-case/get-user-by-id-use-case';
import { AuthModule } from 'src/auth/auth.module';
import { GetSubmissionTestFromUserUseCase } from './application/use-cases/get-submission-test-from-user-use-case/get-submission-test-from-user-use-case';
import { DeleteQuizUseCase } from './application/use-cases/delete-quiz-use-case/delete-quiz-use-case';
import { UpdateQuizUseCase } from './application/use-cases/update-quiz-use-case/update-quiz-use-case';
import { ListQuizUseCase } from './application/use-cases/list-quiz-use-case/list-quiz-use-case';
import { GetQuizVariantsUseCase } from './application/use-cases/get-quiz-variants-use-case/get-quiz-variants-use-case';
import { CreateQuizVariantUseCase } from './application/use-cases/create-quiz-variant-use-case/create-quiz-variant-use-case';
import { DeleteQuizVariantUseCase } from './application/use-cases/delete-quiz-variant-use-case/delete-quiz-variant-use-case';

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
      QuizVariant,
      QuestionVariant,
      OptionVariant,
    ]),
  ],
  providers: [
    GetUserByIdUseCase,
    CreateQuizWithQuestionsAndOptionsUseCase,
    listQuizzesByLanguageIdUseCase,
    ListQuizUseCase,
    GetQuizByIdUseCase,
    SubmissionTestUseCase,
    GetSubmissionTestFromUserUseCase,
    DeleteQuizUseCase,
    UpdateQuizUseCase,
    GetQuizVariantsUseCase,
    CreateQuizVariantUseCase,
    DeleteQuizVariantUseCase,
    QuizService,
    QuizVariantService,
    {
      provide: 'QuizRepositoryInterface',
      useClass: QuizRepository,
    },
    {
      provide: 'QuizVariantRepositoryInterface',
      useClass: QuizVariantRepository,
    },
  ],
  controllers: [QuizController, QuizVariantController],
  exports: [
    QuizService,
    QuizVariantService,
    CreateQuizWithQuestionsAndOptionsUseCase,
    DeleteQuizUseCase,
    UpdateQuizUseCase,
  ],
})
export class QuizModule {}
