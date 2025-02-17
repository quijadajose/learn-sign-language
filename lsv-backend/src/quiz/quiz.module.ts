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

@Module({
  imports: [TypeOrmModule.forFeature([Quiz, Question, Option, Lesson])],
  providers: [
    CreateQuizWithQuestionsAndOptionsUseCase,
    QuizService,
    {
      provide: 'QuizRepositoryInterface',
      useClass: QuizRepository,
    },
  ],
  controllers: [QuizController],
})
export class QuizModule {}
