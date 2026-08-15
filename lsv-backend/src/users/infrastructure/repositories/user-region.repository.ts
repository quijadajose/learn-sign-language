import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { pickSafeOrderBy } from 'src/shared/infrastructure/safe-order-by';
import { UserRegion } from '../../../shared/domain/entities/userRegion';
import { UserRegionRepositoryInterface } from '../../domain/ports/user-region.repository.interface';
import {
  PaginatedResponseDto,
  PaginationDto,
} from 'src/shared/domain/dto/PaginationDto';
import { Region } from 'src/shared/domain/entities/region';
import { User } from 'src/shared/domain/entities/user';

@Injectable()
export class UserRegionRepository implements UserRegionRepositoryInterface {
  constructor(
    @InjectRepository(UserRegion)
    private readonly userRegionRepository: Repository<UserRegion>,
  ) {}

  async save(user: User, region: Region): Promise<UserRegion> {
    // Verificar si ya existe la relación
    const existing = await this.userRegionRepository.findOne({
      where: {
        userId: user.id,
        regionId: region.id,
      },
      relations: {
        region: {
          language: true,
        },
      },
    });

    if (existing) {
      existing.user = undefined;
      return existing;
    }

    const newUserRegion = this.userRegionRepository.create({
      userId: user.id,
      regionId: region.id,
      user,
      region,
    });

    const savedUserRegion = await this.userRegionRepository.save(newUserRegion);

    // Recargar con relaciones
    const userRegionWithRelations = await this.userRegionRepository.findOne({
      where: {
        userId: user.id,
        regionId: region.id,
      },
      relations: {
        region: {
          language: true,
        },
      },
    });

    if (userRegionWithRelations) {
      userRegionWithRelations.user = undefined;
      return userRegionWithRelations;
    }

    savedUserRegion.user = undefined;
    savedUserRegion.region = undefined;

    return savedUserRegion;
  }

  async findRegionsByUserId(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<UserRegion>> {
    const {
      page,
      limit,
      orderBy = undefined,
      sortOrder = undefined,
    } = pagination;
    const skip = (page - 1) * limit;

    const findOptions: FindManyOptions<UserRegion> = {
      where: { userId },
      relations: { region: { language: true } },
      skip,
      take: limit,
    };

    const safeOrderBy = pickSafeOrderBy(orderBy, [
      'userId',
      'regionId',
      'createdAt',
      'updatedAt',
    ]);
    if (safeOrderBy && sortOrder) {
      findOptions.order = {
        [safeOrderBy]: sortOrder,
      };
    }

    const [data, total] =
      await this.userRegionRepository.findAndCount(findOptions);

    return {
      data,
      total,
      page,
      pageSize: limit,
    };
  }

  async findRegionsByUserIdAndLanguageId(
    userId: string,
    languageId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<UserRegion>> {
    const {
      page,
      limit,
      orderBy = undefined,
      sortOrder = undefined,
    } = pagination;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRegionRepository
      .createQueryBuilder('userRegion')
      .innerJoinAndSelect('userRegion.region', 'region')
      .innerJoinAndSelect('region.language', 'language')
      .where('userRegion.userId = :userId', { userId })
      .andWhere('region.languageId = :languageId', { languageId });

    const safeOrderBy = pickSafeOrderBy(
      orderBy,
      ['userId', 'regionId', 'createdAt', 'updatedAt'],
      'createdAt',
    );
    if (safeOrderBy && sortOrder) {
      queryBuilder.orderBy(`userRegion.${safeOrderBy}`, sortOrder);
    } else {
      queryBuilder.orderBy('userRegion.createdAt', 'DESC');
    }

    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      pageSize: limit,
    };
  }

  async findByUserIdAndRegionId(
    userId: string,
    regionId: string,
  ): Promise<UserRegion | null> {
    return this.userRegionRepository.findOne({
      where: {
        userId,
        regionId,
      },
      relations: {
        region: true,
      },
    });
  }

  async delete(userId: string, regionId: string): Promise<void> {
    await this.userRegionRepository.delete({
      userId,
      regionId,
    });
  }
}
