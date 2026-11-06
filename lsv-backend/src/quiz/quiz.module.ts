import { Module } from '@nestjs/common';
import { QuizController } from './infrastructure/controllers/quiz/quiz.controller.js';
import { QuizVariantController } from './infrastructure/controllers/quiz-variant.controller.js';
import { CreateQuizWithQuestionsAndOptionsUseCase } from './application/use-cases/create-quiz-with-questions-and-options-use-case/create-quiz-with-questions-and-options-use-case.js';
import { QuizRepository } from './infrastructure/typeorm/quiz.repository/quiz.repository.js';
import { QuizVariantRepository } from './infrastructure/typeorm/quiz-variant.repository/quiz-variant.repository.js';
import { Quiz } from '../shared/domain/entities/quiz.js';
import { Question } from '../shared/domain/entities/question.js';
import { Lesson } from '../shared/domain/entities/lesson.js';
import { Option } from '../shared/domain/entities/option.js';
import { QuizVariant } from '../shared/domain/entities/quizVariant.js';
import { QuestionVariant } from '../shared/domain/entities/questionVariant.js';
import { OptionVariant } from '../shared/domain/entities/optionVariant.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizService } from './application/services/quiz/quiz.service.js';
import { QuizVariantService } from './application/services/quiz-variant.service.js';
import { listQuizzesByLanguageIdUseCase } from './application/use-cases/list-quizzes-by-language-use-case/list-quizzes-by-language-use-case.js';
import { GetQuizByIdUseCase } from './application/use-cases/get-quiz-by-id-use-case/get-quiz-by-id-use-case.js';
import { QuizSubmission } from '../shared/domain/entities/quizSubmission.js';
import { User } from '../shared/domain/entities/user.js';
import { SubmissionTestUseCase } from './application/use-cases/submission-test-use-case/submission-test-use-case.js';
import { GetUserByIdUseCase } from '../users/application/use-cases/get-user-by-id-use-case/get-user-by-id-use-case.js';
import { AuthModule } from '../auth/auth.module.js';
import { GetSubmissionTestFromUserUseCase } from './application/use-cases/get-submission-test-from-user-use-case/get-submission-test-from-user-use-case.js';
import { DeleteQuizUseCase } from './application/use-cases/delete-quiz-use-case/delete-quiz-use-case.js';
import { UpdateQuizUseCase } from './application/use-cases/update-quiz-use-case/update-quiz-use-case.js';
import { ListQuizUseCase } from './application/use-cases/list-quiz-use-case/list-quiz-use-case.js';
import { GetQuizVariantsUseCase } from './application/use-cases/get-quiz-variants-use-case/get-quiz-variants-use-case.js';
import { CreateQuizVariantUseCase } from './application/use-cases/create-quiz-variant-use-case/create-quiz-variant-use-case.js';
import { DeleteQuizVariantUseCase } from './application/use-cases/delete-quiz-variant-use-case/delete-quiz-variant-use-case.js';
import { UpdateQuizVariantUseCase } from './application/use-cases/update-quiz-variant-use-case/update-quiz-variant-use-case.js';

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
    UpdateQuizVariantUseCase,
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
