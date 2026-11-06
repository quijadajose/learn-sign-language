import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateLanguageDto as LanguageDto } from '../../../domain/dto/create-language/create-language.js';
import { LanguageService } from '../../../application/services/language/language-admin.service.js';
import { StageService } from '../../../../stage/application/services/stage/stage.service.js';
import { Roles } from '../../../../auth/infrastructure/decorators/roles.decorator.js';
import { RolesGuard } from '../../../../auth/infrastructure/guards/roles/roles.guard.js';
import { RequireResourcePermission } from '../../../../permissions/infrastructure/decorators/require-resource-permission.decorator.js';
import { PermissionScope } from '../../../../shared/domain/entities/moderatorPermission.js';
import { ResourceAccessGuard } from '../../../../permissions/infrastructure/guards/resource-access/resource-access.guard.js';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { Language } from '../../../../shared/domain/entities/language.js';
import { Stages } from '../../../../shared/domain/entities/stage.js';
import { AuthGuard } from '@nestjs/passport';
import { QuizService } from '../../../../quiz/application/services/quiz/quiz.service.js';
import { Quiz } from '../../../../shared/domain/entities/quiz.js';
import {
  DocCreateLanguage,
  DocGetLanguage,
  DocGetQuizzes,
  DocGetStagesByLanguage,
  DocLanguage,
  DocListLanguages,
  DocRemoveLanguage,
  DocUpdateLanguage,
} from './docs/language.docs.js';

@DocLanguage()
@Controller('languages')
export class LanguageController {
  constructor(
    private readonly languageService: LanguageService,
    private readonly stageService: StageService,
    private readonly quizService: QuizService,
  ) {}

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post()
  @DocCreateLanguage()
  async create(@Body() createLanguageDto: LanguageDto): Promise<Language> {
    return this.languageService.createLanguage(createLanguageDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/')
  @DocListLanguages()
  async listLanguages(
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Language>> {
    return this.languageService.getAllLanguages(pagination);
  }

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(PermissionScope.LANGUAGE, { param: 'id' })
  @Get(':id')
  @DocGetLanguage()
  async getLanguage(@Param('id', ParseUUIDPipe) id: string): Promise<Language> {
    return this.languageService.getLanguage(id);
  }

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(PermissionScope.LANGUAGE, { param: 'id' })
  @Put(':id')
  @DocUpdateLanguage()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLanguageDto: LanguageDto,
  ): Promise<Language> {
    return this.languageService.updateLanguage(id, updateLanguageDto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete(':id')
  @HttpCode(204)
  @DocRemoveLanguage()
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.languageService.removeLanguage(id);
  }

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(PermissionScope.LANGUAGE, { param: 'id' })
  @Get(':id/stages')
  @DocGetStagesByLanguage()
  async getStagesByLanguage(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Stages>> {
    return this.stageService.getStagesByLanguage(id, pagination);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/quizzes')
  @DocGetQuizzes()
  async getQuizzes(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationDto,
  ): Promise<Quiz[]> {
    return this.quizService.listQuizzesByLanguageId(id, pagination);
  }
}
