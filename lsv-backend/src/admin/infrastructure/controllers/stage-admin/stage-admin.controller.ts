import { Body, Controller, Post, UseGuards } from '@nestjs/common';
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
}
