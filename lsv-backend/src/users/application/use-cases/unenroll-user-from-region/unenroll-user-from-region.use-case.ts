import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRegionRepositoryInterface } from '../../../domain/ports/user-region.repository.interface.js';

@Injectable()
export class UnenrollUserFromRegionUseCase {
  constructor(
    @Inject('UserRegionRepositoryInterface')
    private readonly userRegionRepository: UserRegionRepositoryInterface,
  ) {}

  async execute(userId: string, regionId: string): Promise<void> {
    // Verificar que el usuario esté inscrito en la región
    const userRegion = await this.userRegionRepository.findByUserIdAndRegionId(
      userId,
      regionId,
    );

    if (!userRegion) {
      throw new NotFoundException('errors.region.notEnrolled');
    }

    // Eliminar la inscripción
    await this.userRegionRepository.delete(userId, regionId);
  }
}
