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
import { StageDto } from '../../../../shared/domain/dto/create-stage/create-stage-dto.js';
import { StageService } from '../../../application/services/stage/stage.service.js';
import { RequireResourcePermission } from '../../../../permissions/infrastructure/decorators/require-resource-permission.decorator.js';
import { PermissionScope } from '../../../../shared/domain/entities/moderatorPermission.js';
import { ResourceAccessGuard } from '../../../../permissions/infrastructure/guards/resource-access/resource-access.guard.js';
import {
  PaginationDto,
  PaginatedResponseDto,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { Stages } from '../../../../shared/domain/entities/stage.js';
import {
  DocCreateStage,
  DocDeleteStage,
  DocGetStagesByLanguageId,
  DocStage,
  DocUpdateStage,
} from './docs/stage.docs.js';

@DocStage()
@Controller('stage')
export class StageController {
  constructor(private readonly stageService: StageService) {}

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(PermissionScope.LANGUAGE, { body: 'languageId' })
  @Post()
  @DocCreateStage()
  async create(@Body() createStageDto: StageDto) {
    return this.stageService.createStage(createStageDto);
  }

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(PermissionScope.LANGUAGE, {
    param: 'id',
    resolve: 'stage.languageId',
  })
  @Put(':id')
  @HttpCode(204)
  @DocUpdateStage()
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createStageDto: StageDto,
  ) {
    return this.stageService.updateStage(id, createStageDto);
  }
  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(PermissionScope.LANGUAGE, {
    param: 'id',
    resolve: 'stage.languageId',
  })
  @Delete(':id')
  @HttpCode(204)
  @DocDeleteStage()
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.stageService.deleteStage(id);
  }
  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(
    PermissionScope.LANGUAGE,
    { param: 'id' },
    { allowRegionModerators: true },
  )
  @Get(':id')
  @DocGetStagesByLanguageId()
  async findAll(
    @Query() pagination: PaginationDto,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PaginatedResponseDto<Stages>> {
    return this.stageService.getStagesByLanguage(id, pagination);
  }
}
