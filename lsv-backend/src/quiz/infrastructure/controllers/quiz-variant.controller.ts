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
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { RequireResourcePermission } from 'src/auth/infrastructure/decorators/require-resource-permission.decorator';
import { PermissionScope } from 'src/shared/domain/entities/moderatorPermission';
import { ResourceAccessGuard } from 'src/auth/infrastructure/guards/resource-access/resource-access.guard';
import { QuizVariantService } from 'src/quiz/application/services/quiz-variant.service';
import { CreateQuizVariantDto } from 'src/quiz/domain/dto/create-quiz-variant-dto';
import { QuizVariant } from 'src/shared/domain/entities/quizVariant';

@Controller('quiz-variants')
@UseGuards(AuthGuard('jwt'), ResourceAccessGuard)
export class QuizVariantController {
  constructor(private readonly quizVariantService: QuizVariantService) { }

  @RequireResourcePermission(PermissionScope.REGION, {
    param: 'lessonVariantId',
    resolve: 'variant.regionId',
  })
  @Get('lesson-variant/:lessonVariantId')
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
