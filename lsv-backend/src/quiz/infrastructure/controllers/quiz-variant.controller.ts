import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RequireResourcePermission } from '../../../permissions/infrastructure/decorators/require-resource-permission.decorator.js';
import { PermissionScope } from '../../../shared/domain/entities/moderatorPermission.js';
import { ResourceAccessGuard } from '../../../permissions/infrastructure/guards/resource-access/resource-access.guard.js';
import { QuizVariantService } from '../../application/services/quiz-variant.service.js';
import { CreateQuizVariantDto } from '../../domain/dto/create-quiz-variant-dto.js';
import { QuizVariant } from '../../../shared/domain/entities/quizVariant.js';
import {
  DocCreateQuizVariant,
  DocDeleteQuizVariant,
  DocGetQuizVariants,
  DocQuizVariant,
  DocUpdateQuizVariant,
} from './quiz-variant.docs.js';

@DocQuizVariant()
@Controller('quiz-variants')
@UseGuards(AuthGuard('jwt'), ResourceAccessGuard)
export class QuizVariantController {
  constructor(private readonly quizVariantService: QuizVariantService) {}

  @RequireResourcePermission(PermissionScope.REGION, {
    param: 'lessonVariantId',
    resolve: 'variant.regionId',
  })
  @Get('lesson-variant/:lessonVariantId')
  @DocGetQuizVariants()
  async getQuizVariants(
    @Param('lessonVariantId', ParseUUIDPipe) lessonVariantId: string,
  ): Promise<QuizVariant[]> {
    return await this.quizVariantService.getQuizVariants(lessonVariantId);
  }

  @RequireResourcePermission(PermissionScope.REGION, {
    body: 'lessonVariantId',
    resolve: 'variant.regionId',
  })
  @Post()
  @DocCreateQuizVariant()
  async createQuizVariant(
    @Body() createQuizVariantDto: CreateQuizVariantDto,
  ): Promise<QuizVariant> {
    return await this.quizVariantService.createQuizVariant(
      createQuizVariantDto,
    );
  }

  @RequireResourcePermission(PermissionScope.REGION, {
    param: 'id',
    resolve: 'quizVariant.lessonVariant.regionId',
  })
  @Delete(':id')
  @DocDeleteQuizVariant()
  async deleteQuizVariant(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.quizVariantService.deleteQuizVariant(id);
    return { message: 'Quiz variant deleted successfully' };
  }

  @RequireResourcePermission(PermissionScope.REGION, {
    param: 'id',
    resolve: 'quizVariant.lessonVariant.regionId',
  })
  @Put(':id')
  @DocUpdateQuizVariant()
  async updateQuizVariant(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateQuizVariantDto: CreateQuizVariantDto,
  ): Promise<QuizVariant> {
    return await this.quizVariantService.updateQuizVariant(
      id,
      updateQuizVariantDto,
    );
  }
}
