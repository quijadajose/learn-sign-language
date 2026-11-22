import { Inject, Injectable } from '@nestjs/common';
import { LessonModelRepositoryInterface } from '../../../domain/ports/lesson-model.repository.interface.js';
import { PaginationDto } from '../../../../shared/domain/dto/PaginationDto.js';
import { ModeratorPermissionRepositoryInterface } from '../../../../moderator/domain/ports/moderator-permission.repository.interface.js';
import {
  resolveVisibleLanguageIds,
  VisibilityActor,
} from '../../../domain/utils/language-visibility.js';

@Injectable()
export class GetModelsUseCase {
  constructor(
    @Inject('LessonModelRepositoryInterface')
    private readonly lessonModelRepository: LessonModelRepositoryInterface,
    @Inject('ModeratorPermissionRepositoryInterface')
    private readonly moderatorPermissionRepository: ModeratorPermissionRepositoryInterface,
  ) {}

  async execute(actor: VisibilityActor, pagination: PaginationDto) {
    const languageIds = await resolveVisibleLanguageIds(
      actor,
      this.moderatorPermissionRepository,
    );
    return this.lessonModelRepository.findAll(pagination, languageIds);
  }
}
