import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RequireResourcePermission } from 'src/permissions/infrastructure/decorators/require-resource-permission.decorator';
import { PermissionScope } from 'src/shared/domain/entities/moderatorPermission';
import { ResourceAccessGuard } from 'src/permissions/infrastructure/guards/resource-access/resource-access.guard';
import { QuizDto } from 'src/quiz/domain/dto/quiz/quiz-dto';
import { SubmissionDto } from 'src/quiz/application/dto/submission/submission-dto';
import { QuizService } from 'src/quiz/application/services/quiz/quiz.service';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { Quiz } from 'src/shared/domain/entities/quiz';
import {
  DocCreateQuiz,
  DocDeleteQuiz,
  DocGetAllQuizzes,
  DocGetQuizById,
  DocGetQuizForAdmin,
  DocGetSubmission,
  DocQuiz,
  DocSubmission,
  DocUpdateQuiz,
} from './docs/quiz.docs';

@DocQuiz()
@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(
    PermissionScope.LANGUAGE,
    {
      body: 'lessonId',
      resolve: 'lesson.languageId',
    },
    { allowRegionModerators: true },
  )
  @Post()
  @DocCreateQuiz()
  async createQuiz(@Body() quizDto: QuizDto): Promise<Quiz> {
    return this.quizService.createQuiz(quizDto);
  }

  @Get()
  @DocGetAllQuizzes()
  async getAllQuizzes(@Query() pagination: PaginationDto) {
    return this.quizService.getAllQuizzes(pagination);
  }

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(
    PermissionScope.LANGUAGE,
    {
      param: 'id',
      resolve: 'quiz.lesson.languageId',
    },
    { allowRegionModerators: true },
  )
  @Get('admin/:id')
  @DocGetQuizForAdmin()
  async getQuizForAdmin(@Param('id', ParseUUIDPipe) id: string) {
    return this.quizService.getQuizForAdmin(id);
  }

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(
    PermissionScope.LANGUAGE,
    {
      param: 'id',
      resolve: 'quiz.lesson.languageId',
    },
    { allowRegionModerators: true },
  )
  @Put(':id')
  @DocUpdateQuiz()
  async updateQuiz(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() quizDto: QuizDto,
  ): Promise<Quiz> {
    return this.quizService.updateQuiz(id, quizDto);
  }

  @Get('/:quizId')
  @DocGetQuizById()
  async getQuizById(@Param('quizId', ParseUUIDPipe) quizId: string) {
    return this.quizService.getQuizById(quizId);
  }

  @Post('/:quizId/submissions')
  @DocSubmission()
  async submission(
    @Req() req,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() submissionDto: SubmissionDto,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new BadRequestException('User ID is missing from the request.');
    }
    return this.quizService.submissionTest(userId, quizId, submissionDto);
  }

  @Get('/:quizId/submissions')
  @DocGetSubmission()
  async getSubmission(
    @Req() req,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Query() pagination: PaginationDto,
  ) {
    const userId = req.user?.sub;
    if (!userId) {
      throw new BadRequestException('User ID is missing from the request.');
    }
    return this.quizService.getQuizSubmissionTestFromUser(
      userId,
      quizId,
      pagination,
    );
  }

  @UseGuards(ResourceAccessGuard)
  @RequireResourcePermission(
    PermissionScope.LANGUAGE,
    {
      param: 'id',
      resolve: 'quiz.lesson.languageId',
    },
    { allowRegionModerators: true },
  )
  @Delete(':id')
  @DocDeleteQuiz()
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.quizService.deleteQuiz(id);
  }
}
