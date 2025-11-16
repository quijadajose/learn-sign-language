import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRegionRepositoryInterface } from 'src/users/domain/ports/user-region.repository.interface';

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
      throw new NotFoundException('No estás inscrito en esta región.');
    }

    // Eliminar la inscripción
    await this.userRegionRepository.delete(userId, regionId);
  }
}
