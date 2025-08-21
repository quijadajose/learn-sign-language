import { Module } from '@nestjs/common';
import { StageController } from './infrastructure/controllers/stage-admin/stage-admin.controller';
import { StageService } from './application/services/stage/stage.service';
import { GetStagesFromLanguageUseCase } from './application/use-cases/get-stages-from-language-use-case/get-stages-from-language-use-case';
import { CreateStageUseCase } from './application/use-cases/create-stage-use-case/create-stage-use-case';
import { UpdateStageUseCase } from './application/use-cases/update-stage-use-case/update-stage-use-case';
import { DeleteStageUseCase } from './application/use-cases/delete-stage-use-case/delete-stage-use-case';
import { LessonModule } from 'src/lesson/lesson.module';
import { LanguageModule } from 'src/language/language.module';

@Module({
  imports: [LessonModule, LanguageModule, StageModule],
  providers: [
    StageService,
    GetStagesFromLanguageUseCase,
    CreateStageUseCase,
    UpdateStageUseCase,
    DeleteStageUseCase,
  ],
  controllers: [StageController],
  exports: [StageService],
})
export class StageModule {}
