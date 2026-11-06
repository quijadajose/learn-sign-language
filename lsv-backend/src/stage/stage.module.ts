import { Module, forwardRef } from '@nestjs/common';
import { StageController } from './infrastructure/controllers/stage-admin/stage-admin.controller.js';
import { StageService } from './application/services/stage/stage.service.js';
import { GetStagesFromLanguageUseCase } from './application/use-cases/get-stages-from-language-use-case/get-stages-from-language-use-case.js';
import { CreateStageUseCase } from './application/use-cases/create-stage-use-case/create-stage-use-case.js';
import { UpdateStageUseCase } from './application/use-cases/update-stage-use-case/update-stage-use-case.js';
import { DeleteStageUseCase } from './application/use-cases/delete-stage-use-case/delete-stage-use-case.js';
import { LessonModule } from '../lesson/lesson.module.js';
import { LanguageModule } from '../language/language.module.js';

@Module({
  imports: [forwardRef(() => LessonModule), LanguageModule],
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
