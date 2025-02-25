import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizRepository } from 'src/quiz/infrastructure/typeorm/quiz.repository/quiz.repository';
import { QuizSubmission } from 'src/shared/domain/entities/quizSubmission';
import { LeaderboardController } from './infrastructure/leaderboard/leaderboard.controller';
import { Quiz } from 'src/shared/domain/entities/quiz';
import { Question } from 'src/shared/domain/entities/question';
import { Option } from 'src/shared/domain/entities/option';
import { Lesson } from 'src/shared/domain/entities/lesson';
import { GetGeneralLeaderboardUseCase } from './application/use-cases/get-general-leaderboard-use-case/get-general-leaderboard-use-case';
import { LeaderboardService } from './application/service/leaderboard/leaderboard.service';
import { GetLeaderboardByLanguageUseCase } from './application/use-cases/get-leaderboard-by-language-use-case/get-leaderboard-by-language-use-case';

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
})
export class LeaderboardModule {}
