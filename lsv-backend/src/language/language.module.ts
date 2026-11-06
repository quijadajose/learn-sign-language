import { Module, forwardRef } from '@nestjs/common';
import { LanguageService } from './application/services/language/language-admin.service.js';
import { GetLanguageUseCase } from './application/use-cases/get-language-use-case/get-language-use-case.js';
import { ListLanguagesUseCase } from './application/use-cases/list-languages-use-case/list-languages-use-case.js';
import { UpdateLanguagesUseCase } from './application/use-cases/update-languages-use-case/update-languages-use-case.js';
import { DeleteLanguagesUseCase } from './application/use-cases/delete-languages-use-case/delete-languages-use-case.js';
import { GetStagesFromLanguageUseCase } from '../stage/application/use-cases/get-stages-from-language-use-case/get-stages-from-language-use-case.js';
import { LanguageRepository } from './infrastructure/typeorm/language.repository/language.repository.js';
import { LessonRepository } from '../lesson/infrastructure/typeorm/lesson.repository/lesson.repository.js';
import { StageRepository } from '../stage/infrastructure/typeorm/stage.repository/stage.repository.js';
import { CreateLanguageUseCase } from './application/use-cases/create-language-use-case/create-language-use-case.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Language } from '../shared/domain/entities/language.js';
import { Stages } from '../shared/domain/entities/stage.js';
import { Lesson } from '../shared/domain/entities/lesson.js';
import { QuizSubmission } from '../shared/domain/entities/quizSubmission.js';
import { StageService } from '../stage/application/services/stage/stage.service.js';
import { LanguageController } from './infrastructure/controllers/language/language.controller.js';
import { CreateStageUseCase } from '../stage/application/use-cases/create-stage-use-case/create-stage-use-case.js';
import { UpdateStageUseCase } from '../stage/application/use-cases/update-stage-use-case/update-stage-use-case.js';
import { DeleteStageUseCase } from '../stage/application/use-cases/delete-stage-use-case/delete-stage-use-case.js';
import { QuizModule } from '../quiz/quiz.module.js';
import { LessonModule } from '../lesson/lesson.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Language, Stages, Lesson, QuizSubmission]),
    QuizModule,
    forwardRef(() => LessonModule),
  ],
  providers: [
    LanguageService,
    GetLanguageUseCase,
    ListLanguagesUseCase,
    UpdateLanguagesUseCase,
    DeleteLanguagesUseCase,
    GetStagesFromLanguageUseCase,
    CreateLanguageUseCase,
    StageService,
    CreateStageUseCase,
    UpdateStageUseCase,
    DeleteStageUseCase,
    {
      provide: 'LanguageRepositoryInterface',
      useClass: LanguageRepository,
    },
    {
      provide: 'LessonRepositoryInterface',
      useClass: LessonRepository,
    },
    {
      provide: 'StageRepositoryInterface',
      useClass: StageRepository,
    },
  ],
  controllers: [LanguageController],
  exports: [
    LanguageService,
    'LanguageRepositoryInterface',
    'LessonRepositoryInterface',
    'StageRepositoryInterface',
    CreateLanguageUseCase,
    CreateStageUseCase,
  ],
})
export class LanguageModule {}
