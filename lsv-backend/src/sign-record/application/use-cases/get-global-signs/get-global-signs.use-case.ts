import { Inject, Injectable } from '@nestjs/common';
import { SignRepositoryInterface } from '../../../domain/ports/sign.repository.interface.js';
import { ModeratorPermissionRepositoryInterface } from '../../../../moderator/domain/ports/moderator-permission.repository.interface.js';
import {
  resolveVisibleLanguageIds,
  VisibilityActor,
} from '../../../domain/utils/language-visibility.js';

@Injectable()
export class GetGlobalSignsUseCase {
  constructor(
    @Inject('SignRepositoryInterface')
    private readonly signRepository: SignRepositoryInterface,
    @Inject('ModeratorPermissionRepositoryInterface')
    private readonly moderatorPermissionRepository: ModeratorPermissionRepositoryInterface,
  ) {}

  async execute(actor: VisibilityActor, regionId?: string) {
    const languageIds = await resolveVisibleLanguageIds(
      actor,
      this.moderatorPermissionRepository,
    );
    return this.signRepository.findGlobalWithRecordingsCount(
      regionId,
      languageIds,
    );
  }
}
