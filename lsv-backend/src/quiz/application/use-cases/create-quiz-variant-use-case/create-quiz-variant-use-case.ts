import { Injectable, Inject } from '@nestjs/common';
import { QuizVariantRepositoryInterface } from 'src/quiz/domain/ports/quiz-variant.repository.interface';
import { CreateQuizVariantDto } from 'src/quiz/domain/dto/create-quiz-variant-dto';
import { QuizVariant } from 'src/shared/domain/entities/quizVariant';

@Injectable()
export class CreateQuizVariantUseCase {
  constructor(
    @Inject('QuizVariantRepositoryInterface')
    private readonly quizVariantRepository: QuizVariantRepositoryInterface,
  ) {}

  async execute(
    createQuizVariantDto: CreateQuizVariantDto,
  ): Promise<QuizVariant> {
    return await this.quizVariantRepository.createWithQuestions(
      createQuizVariantDto.lessonVariantId,
      createQuizVariantDto.questions,
    );
  }
}
