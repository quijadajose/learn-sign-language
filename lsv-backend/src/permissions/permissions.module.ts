import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModeratorPermission } from '../shared/domain/entities/moderatorPermission.js';
import { Lesson } from '../shared/domain/entities/lesson.js';
import { Region } from '../shared/domain/entities/region.js';
import { Stages } from '../shared/domain/entities/stage.js';
import { LessonVariant } from '../shared/domain/entities/lessonVariant.js';
import { Quiz } from '../shared/domain/entities/quiz.js';
import { QuizVariant } from '../shared/domain/entities/quizVariant.js';
import { Sign } from '../shared/domain/entities/sign.js';
import { LessonModel } from '../shared/domain/entities/lessonModel.js';
import { SignRecording } from '../shared/domain/entities/signRecording.js';
import { ModeratorPermissionRepository } from '../moderator/infrastructure/typeorm/moderator-permission.repository.js';
import { ResourceIdResolver } from './infrastructure/guards/resource-access/resource-id-resolver.js';
import { ResourceAccessGuard } from './infrastructure/guards/resource-access/resource-access.guard.js';

/**
 * Cross-cutting authorization: resource permissions + ResourceAccessGuard.
 * Global so feature modules do not need to import Auth/Moderator for guards.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ModeratorPermission,
      Lesson,
      Region,
      Stages,
      LessonVariant,
      Quiz,
      QuizVariant,
      Sign,
      LessonModel,
      SignRecording,
    ]),
  ],
  providers: [
    {
      provide: 'ModeratorPermissionRepositoryInterface',
      useClass: ModeratorPermissionRepository,
    },
    ResourceIdResolver,
    ResourceAccessGuard,
  ],
  exports: [
    'ModeratorPermissionRepositoryInterface',
    ResourceIdResolver,
    ResourceAccessGuard,
  ],
})
export class PermissionsModule {}
