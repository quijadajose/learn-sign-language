import { Inject } from "@nestjs/common";
import { LanguageRepositoryInterface } from "src/admin/domain/ports/language.repository.interface/language.repository.interface";
import { Language } from "src/shared/domain/entities/language";

export class GetLanguageUseCase {
    constructor(
        @Inject('LanguageRepositoryInterface')
        private readonly languageRepository: LanguageRepositoryInterface,
    ) { }
    async execute(id:string): Promise<Language> {
        const language = await this.languageRepository.findById(id);        
        return language;
    }
}
