import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ModeratorPermissionRepositoryInterface } from '../../../domain/ports/moderator-permission.repository.interface.js';
import { UserRepositoryInterface } from '../../../../auth/domain/ports/user.repository.interface/user.repository.interface.js';

@Injectable()
export class RevokePermissionUseCase {
  constructor(
    @Inject('ModeratorPermissionRepositoryInterface')
    private readonly moderatorPermissionRepository: ModeratorPermissionRepositoryInterface,
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
  ) {}

  async execute(permissionId: string): Promise<void> {
    const permission =
      await this.moderatorPermissionRepository.findById(permissionId);
    if (!permission) {
      throw new NotFoundException('errors.permission.notFound');
    }

    await this.moderatorPermissionRepository.deleteById(permissionId);

    // BE-03: sin permisos restantes, el usuario vuelve a `user` (admin no se toca).
    const remaining = await this.moderatorPermissionRepository.findByUserId(
      permission.userId,
    );
    if (remaining.length === 0) {
      const user = await this.userRepository.findById(permission.userId);
      if (user && user.role === 'moderator') {
        user.role = 'user';
        await this.userRepository.save(user);
      }
    }
  }
}
