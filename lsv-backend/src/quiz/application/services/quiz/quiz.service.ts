import { Injectable, Query } from '@nestjs/common';
import { QuizDto } from '../../dtos/quiz-dto/quiz-dto';
import { CreateQuizWithQuestionsAndOptionsUseCase } from '../../use-cases/create-quiz-with-questions-and-options-use-case/create-quiz-with-questions-and-options-use-case';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';
import { listQuizzesByLanguageIdUseCase } from '../../use-cases/list-quizzes-by-language-use-case/list-quizzes-by-language-use-case';

@Injectable()
export class QuizService {
  constructor(
    private readonly createQuizWithQuestionsAndOptionsUseCase: CreateQuizWithQuestionsAndOptionsUseCase,
    private readonly listQuizzesUseCase: listQuizzesByLanguageIdUseCase,
  ) {}
  createQuiz(quizDto: QuizDto) {
    return this.createQuizWithQuestionsAndOptionsUseCase.execute(quizDto);
  }
  listQuizzesByLanguageId(
    languageId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.listQuizzesUseCase.execute(languageId, pagination);
  }
}
