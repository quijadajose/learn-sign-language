import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LanguageRepositoryInterface } from 'src/language/domain/ports/language.repository.interface/language.repository.interface';
import {
  PaginatedResponseDto,
  PaginationDto,
} from 'src/shared/domain/dto/PaginationDto';
import { Language } from 'src/shared/domain/entities/language';
import { Repository } from 'typeorm';

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

    const findOptions: any = {
      skip,
      take: limit,
    };

    if (orderBy && sortOrder) {
      findOptions.order = {
        [orderBy]: sortOrder,
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
  async update(id: string, language: Language): Promise<Language> {
    await this.languageRepository.update(id, language);
    return this.languageRepository.findOne({ where: { id } });
  }
}
