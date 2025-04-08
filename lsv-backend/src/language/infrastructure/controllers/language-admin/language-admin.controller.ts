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
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { Language } from 'src/shared/domain/entities/language';
import { Stages } from 'src/shared/domain/entities/stage';
import { AuthGuard } from '@nestjs/passport';
import { QuizService } from 'src/quiz/application/services/quiz/quiz.service';
import { Quiz } from 'src/shared/domain/entities/quiz';

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
  async create(@Body() createLanguageDto: LanguageDto): Promise<Language> {
    return this.languageService.createLanguage(createLanguageDto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('/')
  async listLanguages(@Query() pagination: PaginationDto): Promise<Language[]> {
    return this.languageService.getAllLanguages(pagination);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get(':id')
  async getLanguage(@Param('id', ParseUUIDPipe) id: string): Promise<Language> {
    return this.languageService.getLanguage(id);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Put(':id')
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
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.languageService.removeLanguage(id);
  }
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get(':id/stages')
  async getStagesByLanguage(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationDto,
  ): Promise<Stages[]> {
    return this.stageService.getStagesByLanguage(id, pagination);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id/quizzes')
  async getQuizzes(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() pagination: PaginationDto,
  ): Promise<Quiz[]> {
    return this.quizService.listQuizzesByLanguageId(id, pagination);
  }
}
