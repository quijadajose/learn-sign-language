import { Module } from '@nestjs/common';
import { LanguageRepository } from './infrastructure/typeorm/language.repository/language.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Language } from 'src/shared/domain/entities/language';
import { LanguageAdminController } from './infrastructure/controllers/language-admin/language-admin.controller';
import { LanguageAdminService } from './application/services/language-admin/language-admin.service';
import { CreateLanguageUseCase } from './application/use-cases/create-language-use-case/create-language-use-case';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([Language]),
    ],
    providers: [
        {
            provide: APP_GUARD,
            useClass: RolesGuard
        },
        LanguageRepository,
        LanguageAdminService,
        CreateLanguageUseCase,
        {
            provide: 'LanguageRepositoryInterface',
            useClass: LanguageRepository,
        }
    ],
    controllers: [LanguageAdminController],
})
export class AdminModule { }
