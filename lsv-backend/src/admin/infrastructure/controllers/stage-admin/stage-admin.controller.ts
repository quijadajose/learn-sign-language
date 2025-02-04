import { Body, Controller, Delete, HttpCode, Param, ParseUUIDPipe, Post, Put, UseGuards } from '@nestjs/common';
import { CreateStageDto } from 'src/admin/application/dtos/create-stage-dto/create-stage-dto';
import { StageAdminService } from 'src/admin/application/services/stage-admin/stage-admin.service';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';

@Controller('stage')
export class StageAdminController {
    
    constructor(private readonly stageService: StageAdminService) {}

    @UseGuards(RolesGuard)
    @Roles('admin')
    @Post()
    async create(@Body() createStageDto: CreateStageDto) {
        return this.stageService.createStage(createStageDto);
    }

    @UseGuards(RolesGuard)
    @Roles('admin')
    @Put(':id')
    @HttpCode(204)
    async update(@Param('id', ParseUUIDPipe) id: string,@Body() createStageDto: CreateStageDto) {
        return this.stageService.updateStage(id,createStageDto);
    }
    @UseGuards(RolesGuard)
    @Roles('admin')
    @Delete(':id')
    @HttpCode(204)
    async delete(@Param('id', ParseUUIDPipe) id: string) {
        return this.stageService.deleteStage(id);
    }
}
