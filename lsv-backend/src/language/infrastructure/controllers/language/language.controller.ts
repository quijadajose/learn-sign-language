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
import { CreateLanguageDto as LanguageDto } from 'src/language/domain/dto/create-language/create-language';
import { LanguageService } from 'src/language/application/services/language/language-admin.service';
import { StageService } from 'src/stage/application/services/stage/stage.service';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';
import { RequireResourcePermission } from 'src/auth/infrastructure/decorators/require-resource-permission.decorator';
import { PermissionScope } from 'src/shared/domain/entities/moderatorPermission';
import { ResourceAccessGuard } from 'src/auth/infrastructure/guards/resource-access/resource-access.guard';
import {
  PaginatedResponseDto,
  PaginationDto,
} from 'src/shared/domain/dto/PaginationDto';
import { Language } from 'src/shared/domain/entities/language';
import { Stages } from 'src/shared/domain/entities/stage';
import { AuthGuard } from '@nestjs/passport';
import { QuizService } from 'src/quiz/application/services/quiz/quiz.service';
import { Quiz } from 'src/shared/domain/entities/quiz';
import {
  DocCreateLanguage,
  DocGetLanguage,
  DocGetQuizzes,
  DocGetStagesByLanguage,
  DocLanguage,
  DocListLanguages,
  DocRemoveLanguage,
  DocUpdateLanguage,
} from './docs/language.docs';

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
