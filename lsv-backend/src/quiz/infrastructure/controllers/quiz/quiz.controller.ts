import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/infrastructure/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/infrastructure/guards/roles/roles.guard';
import { QuizDto } from 'src/quiz/domain/dto/quiz/quiz-dto';
import { SubmissionDto } from 'src/quiz/application/dto/submission/submission-dto';
import { QuizService } from 'src/quiz/application/services/quiz/quiz.service';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { Quiz } from 'src/shared/domain/entities/quiz';

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}
  @Post()
  async createQuiz(@Body() quizDto: QuizDto): Promise<Quiz> {
    return this.quizService.createQuiz(quizDto);
  }
  @Get('/:quizId')
  async getQuizById(@Param('quizId', ParseUUIDPipe) quizId: string) {
    return this.quizService.getQuizById(quizId);
  }
  @Post('/:quizId/submissions')
  async submission(
    @Req() req,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() submissionDto: SubmissionDto,
  ) {
    try {
      const userId = req.user.sub;
      if (!req.user || !userId) {
        throw new BadRequestException('User ID is missing from the request.');
      }

      return await this.quizService.submissionTest(
        userId,
        quizId,
        submissionDto,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Submission failed: ${error.message}`,
      );
    }
  }
  @Get('/:quizId/submissions')
  async getSubmission(
    @Req() req,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Query() pagination: PaginationDto,
  ) {
    try {
      const userId = req.user.sub;
      if (!req.user || !userId) {
        throw new BadRequestException('User ID is missing from the request.');
      }
      return await this.quizService.getQuizSubmissionTestFromUser(
        userId,
        quizId,
        pagination,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Get submission tests failed: ${error.message}`,
      );
    }
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.quizService.deleteQuiz(id);
  }
}
