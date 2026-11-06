import { Injectable, Inject } from '@nestjs/common';
import { QuizVariantRepositoryInterface } from '../../../domain/ports/quiz-variant.repository.interface.js';
import { CreateQuizVariantDto } from '../../../domain/dto/create-quiz-variant-dto.js';
import { QuizVariant } from '../../../../shared/domain/entities/quizVariant.js';

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
