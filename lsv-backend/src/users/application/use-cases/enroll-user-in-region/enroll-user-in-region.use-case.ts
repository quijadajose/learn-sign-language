import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepositoryInterface } from '../../../../auth/domain/ports/user.repository.interface/user.repository.interface.js';
import { UserRegion } from '../../../../shared/domain/entities/userRegion.js';
import { UserRegionRepositoryInterface } from '../../../domain/ports/user-region.repository.interface.js';
import { RegionRepositoryInterface } from '../../../../region/domain/ports/region.repository.interface/region.repository.interface.js';

@Injectable()
export class EnrollUserInRegionUseCase {
  constructor(
    @Inject('UserRegionRepositoryInterface')
    private readonly userRegionRepository: UserRegionRepositoryInterface,
    @Inject('UserRepositoryInterface')
    private readonly userRepository: UserRepositoryInterface,
    @Inject('RegionRepositoryInterface')
    private readonly regionRepository: RegionRepositoryInterface,
  ) {}

  async execute(userId: string, regionId: string): Promise<UserRegion> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('errors.user.notFound');
    }

    const region = await this.regionRepository.findById(regionId);
    if (!region) {
      throw new NotFoundException('errors.region.notFound');
    }

    const result = await this.userRegionRepository.save(user, region);
    return result;
  }
}
