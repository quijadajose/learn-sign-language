import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ModeratorPermissionRepositoryInterface } from 'src/moderator/domain/ports/moderator-permission.repository.interface';

@Injectable()
export class RevokePermissionUseCase {
  constructor(
    @Inject('ModeratorPermissionRepositoryInterface')
    private readonly moderatorPermissionRepository: ModeratorPermissionRepositoryInterface,
  ) {}

  async execute(permissionId: string): Promise<void> {
    const permission = await this.moderatorPermissionRepository.findById(
      permissionId,
    );
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    await this.moderatorPermissionRepository.deleteById(permissionId);
  }
}







