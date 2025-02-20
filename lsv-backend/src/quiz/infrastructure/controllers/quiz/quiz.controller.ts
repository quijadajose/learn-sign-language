import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { QuizDto } from 'src/quiz/application/dtos/quiz-dto/quiz-dto';
import { QuizService } from 'src/quiz/application/services/quiz/quiz.service';
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
}
