import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModeratorPermission } from 'src/shared/domain/entities/moderatorPermission';
import { ModeratorPermissionRepository } from './infrastructure/typeorm/moderator-permission.repository';
import { ModeratorPermissionService } from './application/services/moderator-permission/moderator-permission.service';
import { AssignPermissionUseCase } from './application/use-cases/assign-permission-use-case/assign-permission-use-case';
import { RevokePermissionUseCase } from './application/use-cases/revoke-permission-use-case/revoke-permission-use-case';
import { ListModeratorsUseCase } from './application/use-cases/list-moderators-use-case/list-moderators-use-case';
import { ModeratorController } from './infrastructure/controllers/moderator/moderator.controller';
import { LanguageModule } from 'src/language/language.module';
import { RegionModule } from 'src/region/region.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModeratorPermission]),
    LanguageModule,
    RegionModule,
    forwardRef(() => AuthModule),
  ],
  providers: [
    ModeratorPermissionService,
    AssignPermissionUseCase,
    RevokePermissionUseCase,
    ListModeratorsUseCase,
    {
      provide: 'ModeratorPermissionRepositoryInterface',
      useClass: ModeratorPermissionRepository,
    },
  ],
  controllers: [ModeratorController],
  exports: [
    ModeratorPermissionService,
    {
      provide: 'ModeratorPermissionRepositoryInterface',
      useClass: ModeratorPermissionRepository,
    },
  ],
})
export class ModeratorModule {}
