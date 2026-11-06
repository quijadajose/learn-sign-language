import { Module } from '@nestjs/common';
import { ModeratorPermissionService } from './application/services/moderator-permission/moderator-permission.service.js';
import { AssignPermissionUseCase } from './application/use-cases/assign-permission-use-case/assign-permission-use-case.js';
import { RevokePermissionUseCase } from './application/use-cases/revoke-permission-use-case/revoke-permission-use-case.js';
import { ListModeratorsUseCase } from './application/use-cases/list-moderators-use-case/list-moderators-use-case.js';
import { ModeratorController } from './infrastructure/controllers/moderator/moderator.controller.js';
import { LanguageModule } from '../language/language.module.js';
import { RegionModule } from '../region/region.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { PermissionsModule } from '../permissions/permissions.module.js';

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
