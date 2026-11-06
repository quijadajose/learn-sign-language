import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { RequireResourcePermission } from '../../../../permissions/infrastructure/decorators/require-resource-permission.decorator.js';
import { PermissionScope } from '../../../../shared/domain/entities/moderatorPermission.js';
import { ResourceAccessGuard } from '../../../../permissions/infrastructure/guards/resource-access/resource-access.guard.js';
import { QuizDto } from '../../../domain/dto/quiz/quiz-dto.js';
import { SubmissionDto } from '../../../application/dto/submission/submission-dto.js';
import { QuizService } from '../../../application/services/quiz/quiz.service.js';
import { PaginationDto } from '../../../../shared/domain/dto/PaginationDto.js';
import { Quiz } from '../../../../shared/domain/entities/quiz.js';
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
} from './docs/quiz.docs.js';

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
      throw new BadRequestException('errors.quiz.userIdMissing');
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
      throw new BadRequestException('errors.quiz.userIdMissing');
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
  @HttpCode(204)
  @DocDeleteQuiz()
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.quizService.deleteQuiz(id);
  }
}
