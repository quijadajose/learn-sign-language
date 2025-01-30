import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LanguageRepositoryInterface } from "src/admin/domain/ports/language.repository.interface/language.repository.interface";
import { PaginationDto } from "src/shared/application/dtos/PaginationDto";
import { Language } from "src/shared/domain/entities/language";
import { Repository } from "typeorm";

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
    return this.languageRepository.findOne({ where: { name } }) 
  }

  async findAll(pagination: PaginationDto): Promise<Language[]> {
    
    const { page=1, limit=10, orderBy=undefined, sortOrder=undefined } = pagination;
    
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

    return this.languageRepository.find(findOptions);
}

  async save(language: Language): Promise<Language> {
    return this.languageRepository.save(language);
  }

  async deleteById(id: string): Promise<void> {
    await this.languageRepository.delete(id);
  }
}