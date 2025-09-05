import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { UserLanguage } from '../../../shared/domain/entities/userLanguage';
import { UserLanguageRepositoryInterface } from '../../domain/ports/user-language.repository.interface';
import {
  PaginatedResponseDto,
  PaginationDto,
} from 'src/shared/domain/dto/PaginationDto';
import { Language } from 'src/shared/domain/entities/language';
import { User } from 'src/shared/domain/entities/user';

@Injectable()
export class UserLanguageRepository implements UserLanguageRepositoryInterface {
  constructor(
    @InjectRepository(UserLanguage)
    private readonly userLanguageRepository: Repository<UserLanguage>,
  ) {}
  async save(user: User, language: Language): Promise<UserLanguage> {
    const newUserLanguage = this.userLanguageRepository.create({
      user,
      language,
    });
    const userLanguage = this.userLanguageRepository.create(newUserLanguage);
    userLanguage.user = undefined;
    return userLanguage;
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
      relations: ['language'],
      skip,
      take: limit,
    };

    if (orderBy && sortOrder) {
      findOptions.order = {
        [orderBy]: sortOrder,
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
}
