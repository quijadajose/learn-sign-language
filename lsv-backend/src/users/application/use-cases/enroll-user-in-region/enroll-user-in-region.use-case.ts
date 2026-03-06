import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { UserRepositoryInterface } from 'src/auth/domain/ports/user.repository.interface/user.repository.interface';
import { UserRegion } from 'src/shared/domain/entities/userRegion';
import { UserRegionRepositoryInterface } from 'src/users/domain/ports/user-region.repository.interface';
import { RegionRepositoryInterface } from 'src/region/domain/ports/region.repository.interface/region.repository.interface';

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
      throw new NotFoundException('User not found');
    }

    const region = await this.regionRepository.findById(regionId);
    if (!region) {
      throw new NotFoundException('Region not found');
    }

    const result = await this.userRegionRepository.save(user, region);
    return result;
  }
}
