import { Injectable } from '@nestjs/common';
import { GetQuizVariantsUseCase } from '../use-cases/get-quiz-variants-use-case/get-quiz-variants-use-case';
import { CreateQuizVariantUseCase } from '../use-cases/create-quiz-variant-use-case/create-quiz-variant-use-case';
import { DeleteQuizVariantUseCase } from '../use-cases/delete-quiz-variant-use-case/delete-quiz-variant-use-case';
import { UpdateQuizVariantUseCase } from '../use-cases/update-quiz-variant-use-case/update-quiz-variant-use-case';
import { CreateQuizVariantDto } from 'src/quiz/domain/dto/create-quiz-variant-dto';
import { QuizVariant } from 'src/shared/domain/entities/quizVariant';

@Injectable()
export class QuizVariantService {
  constructor(
    private readonly getQuizVariantsUseCase: GetQuizVariantsUseCase,
    private readonly createQuizVariantUseCase: CreateQuizVariantUseCase,
    private readonly deleteQuizVariantUseCase: DeleteQuizVariantUseCase,
    private readonly updateQuizVariantUseCase: UpdateQuizVariantUseCase,
  ) {}

  async getQuizVariants(lessonVariantId: string): Promise<QuizVariant[]> {
    return await this.getQuizVariantsUseCase.execute(lessonVariantId);
  }

  async createQuizVariant(
    createQuizVariantDto: CreateQuizVariantDto,
  ): Promise<QuizVariant> {
    return await this.createQuizVariantUseCase.execute(createQuizVariantDto);
  }

  async updateQuizVariant(
    id: string,
    updateQuizVariantDto: CreateQuizVariantDto,
  ): Promise<QuizVariant> {
    return await this.updateQuizVariantUseCase.execute(
      id,
      updateQuizVariantDto,
    );
  }

  async deleteQuizVariant(id: string): Promise<void> {
    return await this.deleteQuizVariantUseCase.execute(id);
  }
}
