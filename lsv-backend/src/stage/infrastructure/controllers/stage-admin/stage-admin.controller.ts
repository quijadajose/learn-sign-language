import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { StageDto } from 'src/shared/domain/dto/create-stage/create-stage-dto';
import { StageService } from 'src/stage/application/services/stage/stage.service';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';

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
}
