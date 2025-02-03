import { Module } from '@nestjs/common';
import { LanguageRepository } from './infrastructure/typeorm/language.repository/language.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Language } from 'src/shared/domain/entities/language';
import { LanguageAdminController } from './infrastructure/controllers/language-admin/language-admin.controller';
import { LanguageAdminService } from './application/services/language-admin/language-admin.service';
import { CreateLanguageUseCase } from './application/use-cases/create-language-use-case/create-language-use-case';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';
import { ListLanguagesUseCase } from './application/use-cases/list-languages-use-case/list-languages-use-case';
import { GetLanguageUseCase } from './application/use-cases/get-language-use-case/get-language-use-case';
import { UpdateLanguagesUseCase } from './application/use-cases/update-languages-use-case/update-languages-use-case';
import { DeleteLanguagesUseCase } from './application/use-cases/delete-languages-use-case/delete-languages-use-case';
import { Lesson } from 'src/shared/domain/entities/lesson';
import { CreateLessonUseCase } from './application/use-cases/create-lesson-use-case/create-lesson-use-case';
import { Stages } from 'src/shared/domain/entities/stage';
import { LessonAdminController } from './infrastructure/controllers/lesson-admin/lesson-admin.controller';
import { LessonAdminService } from './application/services/lesson-admin/lesson-admin.service';
import { LessonRepository } from './infrastructure/typeorm/lesson.repository/lesson.repository';
import { StageRepository } from './infrastructure/typeorm/stage.repository/stage.repository';
import { UploadPictureUseCase } from 'src/shared/application/use-cases/upload-picture-use-case/upload-picture-use-case';
import { GetLessonByLaguageUseCase } from './application/use-cases/get-lesson-by-laguage-use-case/get-lesson-by-laguage-use-case';

@Module({
    imports: [
        TypeOrmModule.forFeature([Language,Lesson, Stages]),
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: RolesGuard
        },
        LanguageRepository,
        LanguageAdminService,
        CreateLanguageUseCase,
        GetLanguageUseCase,
        ListLanguagesUseCase,
        UpdateLanguagesUseCase,
        DeleteLanguagesUseCase,
        CreateLessonUseCase,
        LessonAdminService,
        UploadPictureUseCase,
        GetLessonByLaguageUseCase,
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
        }
    ],
    controllers: [LanguageAdminController, LessonAdminController],
})
export class AdminModule { }
