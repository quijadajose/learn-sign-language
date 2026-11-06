import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { pickSafeOrderBy } from '../../../shared/infrastructure/safe-order-by.js';
import { UserLanguage } from '../../../shared/domain/entities/userLanguage.js';
import { UserLanguageRepositoryInterface } from '../../domain/ports/user-language.repository.interface.js';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '../../../shared/domain/dto/PaginationDto.js';
import { Language } from '../../../shared/domain/entities/language.js';
import { User } from '../../../shared/domain/entities/user.js';

@Injectable()
export class UserLanguageRepository implements UserLanguageRepositoryInterface {
  constructor(
    @InjectRepository(UserLanguage)
    private readonly userLanguageRepository: Repository<UserLanguage>,
  ) {}
  async save(user: User, language: Language): Promise<UserLanguage> {
    const newUserLanguage = this.userLanguageRepository.create({
      userId: user.id,
      languageId: language.id,
      user,
      language,
    });

    const savedUserLanguage =
      await this.userLanguageRepository.save(newUserLanguage);
    savedUserLanguage.user = undefined;
    savedUserLanguage.language = undefined;

    return savedUserLanguage;
  }
  async findLanguagesByUserId(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<UserLanguage>> {
    const {
      page,
      limit,
      orderBy = undefined,
      sortOrder = undefined,
    } = pagination;
    const skip = (page - 1) * limit;

    const findOptions: FindManyOptions<UserLanguage> = {
      where: { userId },
      relations: { language: true },
      skip,
      take: limit,
    };

    const safeOrderBy = pickSafeOrderBy(orderBy, [
      'userId',
      'languageId',
      'createdAt',
      'updatedAt',
    ]);
    if (safeOrderBy && sortOrder) {
      findOptions.order = {
        [safeOrderBy]: sortOrder,
      };
    }

    const [data, total] =
      await this.userLanguageRepository.findAndCount(findOptions);

    return {
      data,
      total,
      page,
      pageSize: limit,
    };
  }

  async delete(userId: string, languageId: string): Promise<void> {
    await this.userLanguageRepository.delete({
      userId,
      languageId,
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return this.userLanguageRepository.count({
      where: { userId },
    });
  }
}
