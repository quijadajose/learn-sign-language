import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { SignRecordService } from '../../application/sign-record/sign-record.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import {
  DocCreateSign,
  DocDeleteModel,
  DocDeleteRecording,
  DocDeleteSign,
  DocGetGlobalSigns,
  DocGetLessonSigns,
  DocGetModels,
  DocGetSignRecordings,
  DocSaveLandmarks,
  DocSignRecord,
  DocTriggerCustomTraining,
  DocTriggerTraining,
  DocTriggerTraining as DocTriggerTrainingOld,
  DocUpdateSign,
} from './docs/sign-record.docs';
import {
  CreateSignDto,
  SaveLandmarksDto,
  TriggerCustomTrainingDto,
  UpdateSignDto,
} from './sign-record.dto';

@DocSignRecord()
@Controller('sign-record')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SignRecordController {
  constructor(private readonly signRecordService: SignRecordService) {}

  @Post('landmarks')
  @DocSaveLandmarks()
  async saveLandmarks(@Body() data: SaveLandmarksDto) {
    return this.signRecordService.saveLandmarks(data);
  }

  @Get('sign/:signId/recordings')
  @DocGetSignRecordings()
  async getSignRecordings(
    @Param('signId', new ParseUUIDPipe()) signId: string,
    @Query('regionId') regionId?: string,
  ) {
    return this.signRecordService.getSignRecordings(signId, regionId);
  }

  @Post('train/custom')
  @Roles('admin')
  @DocTriggerCustomTraining()
  async triggerCustomTraining(@Body() filters: TriggerCustomTrainingDto) {
    return this.signRecordService.triggerCustomTraining(filters);
  }

  @Post('train/:lessonVariantId')
  @DocTriggerTraining()
  async triggerTraining(
    @Param('lessonVariantId', new ParseUUIDPipe()) lessonVariantId: string,
  ) {
    return this.signRecordService.triggerTraining(lessonVariantId);
  }

  @Get('global')
  @DocGetGlobalSigns()
  async getGlobalSigns(@Query('regionId') regionId?: string) {
    return this.signRecordService.getGlobalSigns(regionId);
  }

  @Get('lesson/:lessonId/signs')
  @DocGetLessonSigns()
  async getLessonSigns(
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
    @Query('regionId') regionId?: string,
  ) {
    return this.signRecordService.getSignsForLesson(lessonId, regionId);
  }

  @Get('models')
  @Roles('admin')
  @DocGetModels()
  async getModels(@Query() pagination: PaginationDto) {
    return this.signRecordService.getModels(pagination);
  }

  @Delete('model/:id')
  @Roles('admin')
  @DocDeleteModel()
  async deleteModel(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.signRecordService.deleteModel(id);
  }

  @Delete('recording/:id')
  @Roles('admin')
  @DocDeleteRecording()
  async deleteRecording(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.signRecordService.deleteRecording(id);
  }

  @Post('sign')
  @Roles('admin')
  @DocCreateSign()
  async createSign(@Body() data: CreateSignDto) {
    return this.signRecordService.createSign(data);
  }

  @Patch('sign/:id')
  @Roles('admin')
  @DocUpdateSign()
  async updateSign(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: UpdateSignDto,
  ) {
    return this.signRecordService.updateSign(id, data);
  }

  @Delete('sign/:id')
  @Roles('admin')
  @DocDeleteSign()
  async deleteSign(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.signRecordService.deleteSign(id);
  }
}
