import { Module } from '@nestjs/common';
import { LanguageService } from './application/services/language/language-admin.service';
import { GetLanguageUseCase } from './application/use-cases/get-language-use-case/get-language-use-case';
import { ListLanguagesUseCase } from './application/use-cases/list-languages-use-case/list-languages-use-case';
import { UpdateLanguagesUseCase } from './application/use-cases/update-languages-use-case/update-languages-use-case';
import { DeleteLanguagesUseCase } from './application/use-cases/delete-languages-use-case/delete-languages-use-case';
import { GetStagesFromLanguageUseCase } from 'src/stage/application/use-cases/get-stages-from-language-use-case/get-stages-from-language-use-case';
import { LanguageRepository } from './infrastructure/typeorm/language.repository/language.repository';
import { LessonRepository } from 'src/lesson/infrastructure/typeorm/lesson.repository/lesson.repository';
import { StageRepository } from 'src/stage/infrastructure/typeorm/stage.repository/stage.repository';
import { CreateLanguageUseCase } from './application/use-cases/create-language-use-case/create-language-use-case';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Language } from 'src/shared/domain/entities/language';
import { Stages } from 'src/shared/domain/entities/stage';
import { Lesson } from 'src/shared/domain/entities/lesson';
import { StageService } from 'src/stage/application/services/stage/stage.service';
import { LanguageController } from './infrastructure/controllers/language-admin/language-admin.controller';
import { CreateStageUseCase } from 'src/stage/application/use-cases/create-stage-use-case/create-stage-use-case';
import { UpdateStageUseCase } from 'src/stage/application/use-cases/update-stage-use-case/update-stage-use-case';
import { DeleteStageUseCase } from 'src/stage/application/use-cases/delete-stage-use-case/delete-stage-use-case';
import { QuizModule } from 'src/quiz/quiz.module';

@Module({
  imports: [TypeOrmModule.forFeature([Language, Stages, Lesson]), QuizModule],
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
