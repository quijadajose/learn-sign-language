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
import { ResourceAccessGuard } from 'src/permissions/infrastructure/guards/resource-access/resource-access.guard';
import { RequireResourcePermission } from 'src/permissions/infrastructure/decorators/require-resource-permission.decorator';
import { PermissionScope } from 'src/shared/domain/entities/moderatorPermission';
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
} from './docs/sign-record.docs';
import {
  CreateSignDto,
  CreateSignsBulkDto,
  SaveLandmarksDto,
  TriggerCustomTrainingDto,
  UpdateSignDto,
} from '../../domain/dto/sign-record.dto';

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
    { allowRegionModerators: true, allowUnscopedModerator: true },
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
    { allowRegionModerators: true, allowUnscopedModerator: true },
  )
  @DocGetSignRecordings()
  async getSignRecordings(
    @Param('signId', new ParseUUIDPipe()) signId: string,
    @Query('regionId') regionId?: string,
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

  @Get('lesson/:lessonId/model')
  @DocGetLessonModel()
  async getLessonModel(
    @Param('lessonId', new ParseUUIDPipe()) lessonId: string,
    @Query('regionId') regionId?: string,
  ) {
    return this.signRecordService.getLessonModel(lessonId, regionId);
  }

  @Get('models')
  @Roles('admin', 'moderator')
  @DocGetModels()
  async getModels(@Query() pagination: PaginationDto) {
    return this.signRecordService.getModels(pagination);
  }

  @Delete('model/:id')
  @Roles('admin', 'moderator')
  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(
    PermissionScope.LANGUAGE,
    { param: 'id', resolve: 'lessonModel.languageId' },
    { allowRegionModerators: true, allowUnscopedModerator: true },
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
    { allowRegionModerators: true, allowUnscopedModerator: true },
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
    { allowRegionModerators: true, allowUnscopedModerator: true },
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
    { allowRegionModerators: true, allowUnscopedModerator: true },
  )
  @DocDeleteSign()
  async deleteSign(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.signRecordService.deleteSign(id);
  }
}
