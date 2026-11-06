import { OptionalUUIDPipe } from '../../../shared/infrastructure/pipes/optional-uuid.pipe.js';
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
  Req,
} from '@nestjs/common';
import { PaginationDto } from '../../../shared/domain/dto/PaginationDto.js';
import { SignRecordService } from '../../application/sign-record/sign-record.service.js';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles/roles.guard.js';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator.js';
import { ResourceAccessGuard } from '../../../permissions/infrastructure/guards/resource-access/resource-access.guard.js';
import { RequireResourcePermission } from '../../../permissions/infrastructure/decorators/require-resource-permission.decorator.js';
import { PermissionScope } from '../../../shared/domain/entities/moderatorPermission.js';
import {
  DocCreateSign,
  DocCreateSignsBulk,
  DocDeleteModel,
  DocDeleteRecording,
  DocDeleteSign,
  DocGetGlobalSigns,
  DocGetLessonSigns,
  DocGetLessonModel,
  DocGetModels,
  DocGetSignRecordings,
  DocSaveLandmarks,
  DocSignRecord,
  DocTriggerCustomTraining,
  DocTriggerTraining,
  DocUpdateSign,
} from './docs/sign-record.docs.js';
import {
  CreateSignDto,
  CreateSignsBulkDto,
  SaveLandmarksDto,
  TriggerCustomTrainingDto,
  UpdateSignDto,
} from '../../domain/dto/sign-record.dto.js';

@DocSignRecord()
@Controller('sign-record')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SignRecordController {
  constructor(private readonly signRecordService: SignRecordService) {}

  @Post('landmarks')
  @Roles('admin', 'moderator')
  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(
    PermissionScope.LANGUAGE,
    { body: 'signId', resolve: 'sign.languageId' },
    { allowRegionModerators: true },
  )
  @DocSaveLandmarks()
  async saveLandmarks(@Body() data: SaveLandmarksDto) {
    return this.signRecordService.saveLandmarks(data);
  }

  @Get('sign/:signId/recordings')
  @Roles('admin', 'moderator')
  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(
    PermissionScope.LANGUAGE,
    { param: 'signId', resolve: 'sign.languageId' },
    { allowRegionModerators: true },
  )
  @DocGetSignRecordings()
  async getSignRecordings(
    @Param('signId', new ParseUUIDPipe()) signId: string,
    @Query('regionId', OptionalUUIDPipe) regionId?: string,
  ) {
    return this.signRecordService.getSignRecordings(signId, regionId);
  }

  @Post('train/custom')
  @Roles('admin', 'moderator')
  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(PermissionScope.LANGUAGE, { body: 'languageId' })
  @DocTriggerCustomTraining()
  async triggerCustomTraining(@Body() filters: TriggerCustomTrainingDto) {
    return this.signRecordService.triggerCustomTraining(filters);
  }

  @Post('train/:lessonVariantId')
  @Roles('admin', 'moderator')
  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(
    PermissionScope.LANGUAGE,
    {
      param: 'lessonVariantId',
      resolve: 'variant.baseLesson.languageId',
    },
    { allowRegionModerators: true },
  )
  @DocTriggerTraining()
  async triggerTraining(
    @Param('lessonVariantId', new ParseUUIDPipe()) lessonVariantId: string,
  ) {
    return this.signRecordService.triggerTraining(lessonVariantId);
  }

  @Get('global')
  @Roles('admin', 'moderator')
  @DocGetGlobalSigns()
  async getGlobalSigns(
    @Req() req: { user: { sub: string; role: string } },
    @Query('regionId', OptionalUUIDPipe) regionId?: string,
  ) {
    return this.signRecordService.getGlobalSigns(
      { sub: req.user.sub, role: req.user.role },
      regionId,
    );
  }

  @Get('lesson/:lessonId/signs')
  @DocGetLessonSigns()
  async getLessonSigns(
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
    @Query('regionId', OptionalUUIDPipe) regionId?: string,
  ) {
    return this.signRecordService.getSignsForLesson(lessonId, regionId);
  }

  @Get('lesson/:lessonId/model')
  @DocGetLessonModel()
  async getLessonModel(
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
    @Query('regionId', OptionalUUIDPipe) regionId?: string,
  ) {
    return this.signRecordService.getLessonModel(lessonId, regionId);
  }

  @Get('models')
  @Roles('admin', 'moderator')
  @DocGetModels()
  async getModels(
    @Req() req: { user: { sub: string; role: string } },
    @Query() pagination: PaginationDto,
  ) {
    return this.signRecordService.getModels(
      { sub: req.user.sub, role: req.user.role },
      pagination,
    );
  }

  @Delete('model/:id')
  @Roles('admin', 'moderator')
  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(
    PermissionScope.LANGUAGE,
    { param: 'id', resolve: 'lessonModel.languageId' },
    { allowRegionModerators: true },
  )
  @DocDeleteModel()
  async deleteModel(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.signRecordService.deleteModel(id);
  }

  @Delete('recording/:id')
  @Roles('admin', 'moderator')
  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(
    PermissionScope.LANGUAGE,
    { param: 'id', resolve: 'signRecording.languageId' },
    { allowRegionModerators: true },
  )
  @DocDeleteRecording()
  async deleteRecording(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.signRecordService.deleteRecording(id);
  }

  @Post('sign')
  @Roles('admin', 'moderator')
  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(
    PermissionScope.LANGUAGE,
    { body: 'languageId' },
    { allowRegionModerators: true },
  )
  @DocCreateSign()
  async createSign(@Body() data: CreateSignDto) {
    return this.signRecordService.createSign(data);
  }

  @Post('signs')
  @Roles('admin', 'moderator')
  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(
    PermissionScope.LANGUAGE,
    { body: 'languageId' },
    { allowRegionModerators: true },
  )
  @DocCreateSignsBulk()
  async createSignsBulk(@Body() data: CreateSignsBulkDto) {
    return this.signRecordService.createSignsBulk(data);
  }

  @Patch('sign/:id')
  @Roles('admin', 'moderator')
  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(
    PermissionScope.LANGUAGE,
    { param: 'id', resolve: 'sign.languageId' },
    { allowRegionModerators: true },
  )
  @DocUpdateSign()
  async updateSign(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() data: UpdateSignDto,
  ) {
    return this.signRecordService.updateSign(id, data);
  }

  @Delete('sign/:id')
  @Roles('admin', 'moderator')
  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(
    PermissionScope.LANGUAGE,
    { param: 'id', resolve: 'sign.languageId' },
    { allowRegionModerators: true },
  )
  @DocDeleteSign()
  async deleteSign(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.signRecordService.deleteSign(id);
  }
}
