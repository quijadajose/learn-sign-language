import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CreateLanguageDto } from 'src/admin/application/dtos/create-language/create-language';
import { LanguageAdminService } from 'src/admin/application/services/language-admin/language-admin.service';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';
import { GetLanguageDto } from 'src/shared/application/dtos/GetLanguageDto';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';
import { Language } from 'src/shared/domain/entities/language';

@Controller('languages')
export class LanguageAdminController {
    constructor(private readonly languageAdminService: LanguageAdminService) {}
  
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post()
  async create(@Body() createLanguageDto: CreateLanguageDto): Promise<Language> {
    return this.languageAdminService.createLanguage(createLanguageDto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get()
  async listLanguages(@Query() pagination: PaginationDto){
    return this.languageAdminService.getAllLanguages(pagination);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get(':id')
  async language(@Query() getLanguageDto: GetLanguageDto){    
    return this.languageAdminService.getLanguage(getLanguageDto.id);
  }
  

}
