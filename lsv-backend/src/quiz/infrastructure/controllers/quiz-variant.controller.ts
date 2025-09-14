import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { QuizVariantService } from 'src/quiz/application/services/quiz-variant.service';
import { CreateQuizVariantDto } from 'src/quiz/domain/dto/create-quiz-variant-dto';
import { QuizVariant } from 'src/shared/domain/entities/quizVariant';

@Controller('quiz-variants')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
export class QuizVariantController {
  constructor(private readonly quizVariantService: QuizVariantService) {}

  @Get('lesson-variant/:lessonVariantId')
  async getQuizVariants(
    @Param('lessonVariantId', ParseUUIDPipe) lessonVariantId: string,
  ): Promise<QuizVariant[]> {
    return await this.quizVariantService.getQuizVariants(lessonVariantId);
  }

  @Post()
  async createQuizVariant(
    @Body() createQuizVariantDto: CreateQuizVariantDto,
  ): Promise<QuizVariant> {
    return await this.quizVariantService.createQuizVariant(
      createQuizVariantDto,
    );
  }

  @Delete(':id')
  async deleteQuizVariant(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ message: string }> {
    await this.quizVariantService.deleteQuizVariant(id);
    return { message: 'Quiz variant deleted successfully' };
  }
}
