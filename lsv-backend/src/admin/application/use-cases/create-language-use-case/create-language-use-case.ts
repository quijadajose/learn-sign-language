import { BadRequestException, Inject } from "@nestjs/common";
import { LanguageRepository } from "src/admin/infrastructure/typeorm/language.repository/language.repository";
import { CreateLanguageDto } from "../../dtos/create-language/create-language";
import { Language } from "src/shared/domain/entities/language";
import { LanguageRepositoryInterface } from "src/admin/domain/ports/language.repository.interface/language.repository.interface";

export class CreateLanguageUseCase {
    constructor(
        @Inject('LanguageRepositoryInterface')
        private readonly languageRepository: LanguageRepositoryInterface,
    ) { }

    async execute(createLanguageDto: CreateLanguageDto): Promise<Language> {
        const { name } = createLanguageDto;

        const existingLanguage = await this.languageRepository.findByName(name);
        
        if (existingLanguage) {
            throw new BadRequestException('Language already in use');
        }

        const language = new Language();
        language.name = createLanguageDto.name;
        language.description = createLanguageDto.description;
        const createdLanguage = await this.languageRepository.save(language);
        return createdLanguage;
    }
}
