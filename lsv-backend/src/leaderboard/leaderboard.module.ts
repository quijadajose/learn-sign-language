import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizRepository } from '../quiz/infrastructure/typeorm/quiz.repository/quiz.repository.js';
import { QuizSubmission } from '../shared/domain/entities/quizSubmission.js';
import { LeaderboardController } from './infrastructure/leaderboard/leaderboard.controller.js';
import { Quiz } from '../shared/domain/entities/quiz.js';
import { Question } from '../shared/domain/entities/question.js';
import { Option } from '../shared/domain/entities/option.js';
import { Lesson } from '../shared/domain/entities/lesson.js';
import { GetGeneralLeaderboardUseCase } from './application/use-cases/get-general-leaderboard-use-case/get-general-leaderboard-use-case.js';
import { LeaderboardService } from './application/service/leaderboard/leaderboard.service.js';
import { GetLeaderboardByLanguageUseCase } from './application/use-cases/get-leaderboard-by-language-use-case/get-leaderboard-by-language-use-case.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quiz, Question, Option, Lesson, QuizSubmission]),
  ],
  providers: [
    GetGeneralLeaderboardUseCase,
    GetLeaderboardByLanguageUseCase,
    LeaderboardService,
    {
      provide: 'QuizRepositoryInterface',
      useClass: QuizRepository,
    },
  ],
  controllers: [LeaderboardController],
  exports: ['QuizRepositoryInterface'],
})
export class LeaderboardModule {}
