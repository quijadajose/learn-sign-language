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
import { StageDto } from 'src/shared/domain/dto/create-stage/create-stage-dto';
import { StageService } from 'src/stage/application/services/stage/stage.service';
import { RequireResourcePermission } from 'src/permissions/infrastructure/decorators/require-resource-permission.decorator';
import { PermissionScope } from 'src/shared/domain/entities/moderatorPermission';
import { ResourceAccessGuard } from 'src/permissions/infrastructure/guards/resource-access/resource-access.guard';
import {
  PaginationDto,
  PaginatedResponseDto,
} from 'src/shared/domain/dto/PaginationDto';
import { Stages } from 'src/shared/domain/entities/stage';
import {
  DocCreateStage,
  DocDeleteStage,
  DocGetStagesByLanguageId,
  DocStage,
  DocUpdateStage,
} from './docs/stage.docs';

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
