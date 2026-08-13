import { Module } from '@nestjs/common';
import { ModeratorPermissionService } from './application/services/moderator-permission/moderator-permission.service';
import { AssignPermissionUseCase } from './application/use-cases/assign-permission-use-case/assign-permission-use-case';
import { RevokePermissionUseCase } from './application/use-cases/revoke-permission-use-case/revoke-permission-use-case';
import { ListModeratorsUseCase } from './application/use-cases/list-moderators-use-case/list-moderators-use-case';
import { ModeratorController } from './infrastructure/controllers/moderator/moderator.controller';
import { LanguageModule } from 'src/language/language.module';
import { RegionModule } from 'src/region/region.module';
import { AuthModule } from 'src/auth/auth.module';
import { PermissionsModule } from 'src/permissions/permissions.module';

@Module({
  imports: [PermissionsModule, LanguageModule, RegionModule, AuthModule],
  providers: [
    ModeratorPermissionService,
    AssignPermissionUseCase,
    RevokePermissionUseCase,
    ListModeratorsUseCase,
  ],
  controllers: [ModeratorController],
  exports: [ModeratorPermissionService],
})
export class ModeratorModule {}
