import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModeratorPermission } from 'src/shared/domain/entities/moderatorPermission';
import { Lesson } from 'src/shared/domain/entities/lesson';
import { Region } from 'src/shared/domain/entities/region';
import { Stages } from 'src/shared/domain/entities/stage';
import { LessonVariant } from 'src/shared/domain/entities/lessonVariant';
import { Quiz } from 'src/shared/domain/entities/quiz';
import { QuizVariant } from 'src/shared/domain/entities/quizVariant';
import { Sign } from 'src/shared/domain/entities/sign';
import { LessonModel } from 'src/shared/domain/entities/lessonModel';
import { SignRecording } from 'src/shared/domain/entities/signRecording';
import { ModeratorPermissionRepository } from 'src/moderator/infrastructure/typeorm/moderator-permission.repository';
import { ResourceIdResolver } from './infrastructure/guards/resource-access/resource-id-resolver';
import { ResourceAccessGuard } from './infrastructure/guards/resource-access/resource-access.guard';

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
