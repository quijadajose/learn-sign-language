import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateLanguageDto } from 'src/admin/application/dtos/create-language/create-language';
import { LanguageAdminService } from 'src/admin/application/services/language-admin/language-admin.service';
import { Language } from 'src/shared/domain/entities/language';

@Controller('languages')
export class LanguageAdminController {
    constructor(private readonly languageAdminService: LanguageAdminService) {}

  @Post()
  async create(@Body() createLanguageDto: CreateLanguageDto): Promise<Language> {
    return this.languageAdminService.createLanguage(createLanguageDto);
  }

}
