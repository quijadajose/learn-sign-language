import { Injectable } from '@nestjs/common';
import { CreateLanguageUseCase } from '../../use-cases/create-language-use-case/create-language-use-case';
import { CreateLanguageDto } from '../../dtos/create-language/create-language';
import { Language } from 'src/shared/domain/entities/language';

@Injectable()
export class LanguageAdminService {
    constructor(
        private readonly createLanguageUseCase: CreateLanguageUseCase,
    ) { }
    async createLanguage(createLanguageDto: CreateLanguageDto): Promise<Language> {
        return this.createLanguageUseCase.execute(createLanguageDto);
    }
}
