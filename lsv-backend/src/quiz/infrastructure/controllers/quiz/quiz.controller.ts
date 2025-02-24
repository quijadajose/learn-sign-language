import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { QuizDto } from 'src/quiz/application/dtos/quiz-dto/quiz-dto';
import { SubmissionDto } from 'src/quiz/application/dtos/submission-dto/submission-dto';
import { QuizService } from 'src/quiz/application/services/quiz/quiz.service';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';
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
}
