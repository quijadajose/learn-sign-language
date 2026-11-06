import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LanguageRepositoryInterface } from '../../../domain/ports/language.repository.interface/language.repository.interface.js';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { Language } from '../../../../shared/domain/entities/language.js';
import { FindManyOptions, Repository } from 'typeorm';
import { pickSafeOrderBy } from '../../../../shared/infrastructure/safe-order-by.js';

@Injectable()
export class LanguageRepository implements LanguageRepositoryInterface {
  constructor(
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
  ) {}

  async findById(id: string): Promise<Language | null> {
    return this.languageRepository.findOne({ where: { id } });
  }

  async findByName(name: string): Promise<Language | null> {
    return this.languageRepository.findOne({ where: { name } });
  }

  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Language>> {
    const {
      page,
      limit,
      orderBy = undefined,
      sortOrder = undefined,
    } = pagination;

    const skip = (page - 1) * limit;

    const findOptions: FindManyOptions<Language> = {
      skip,
      take: limit,
    };

    const safeOrderBy = pickSafeOrderBy(orderBy, [
      'id',
      'name',
      'createdAt',
      'updatedAt',
      'countryCode',
    ]);
    if (safeOrderBy && sortOrder) {
      findOptions.order = {
        [safeOrderBy]: sortOrder,
      };
    }

    const [data, total] =
      await this.languageRepository.findAndCount(findOptions);

    return new PaginatedResponseDto(data, total, page, limit);
  }

  async save(language: Language): Promise<Language> {
    return this.languageRepository.save(language);
  }

  async deleteById(id: string): Promise<void> {
    await this.languageRepository.delete(id);
  }
  async update(id: string, language: Partial<Language>): Promise<Language> {
    await this.languageRepository.update(id, language);
    return this.languageRepository.findOne({ where: { id } });
  }
}
