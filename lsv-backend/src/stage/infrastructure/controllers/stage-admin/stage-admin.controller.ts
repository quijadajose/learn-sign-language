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
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';

@Controller('stage')
export class StageController {
  constructor(private readonly stageService: StageService) {}

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post()
  async create(@Body() createStageDto: StageDto) {
    return this.stageService.createStage(createStageDto);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Put(':id')
  @HttpCode(204)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() createStageDto: StageDto,
  ) {
    return this.stageService.updateStage(id, createStageDto);
  }
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete(':id')
  @HttpCode(204)
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.stageService.deleteStage(id);
  }
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get(':id')
  async findAll(
    @Query() pagination: PaginationDto,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.stageService.getStagesByLanguage(id, pagination);
  }
}
