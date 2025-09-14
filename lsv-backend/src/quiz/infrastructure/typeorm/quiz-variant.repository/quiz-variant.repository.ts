import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizVariant } from 'src/shared/domain/entities/quizVariant';
import { QuestionVariant } from 'src/shared/domain/entities/questionVariant';
import { OptionVariant } from 'src/shared/domain/entities/optionVariant';

@Injectable()
export class QuizVariantRepository {
  constructor(
    @InjectRepository(QuizVariant)
    private readonly quizVariantRepository: Repository<QuizVariant>,
    @InjectRepository(QuestionVariant)
    private readonly questionVariantRepository: Repository<QuestionVariant>,
    @InjectRepository(OptionVariant)
    private readonly optionVariantRepository: Repository<OptionVariant>,
  ) {}

  async findByLessonVariantId(lessonVariantId: string): Promise<QuizVariant[]> {
    return await this.quizVariantRepository.find({
      where: { lessonVariant: { id: lessonVariantId } },
      relations: [
        'lessonVariant',
        'lessonVariant.region',
        'questionVariants',
        'questionVariants.optionVariants',
      ],
    });
  }

  async findById(id: string): Promise<QuizVariant | null> {
    return await this.quizVariantRepository.findOne({
      where: { id },
      relations: [
        'lessonVariant',
        'questionVariants',
        'questionVariants.optionVariants',
      ],
    });
  }

  async create(quizVariant: Partial<QuizVariant>): Promise<QuizVariant> {
    const newQuizVariant = this.quizVariantRepository.create(quizVariant);
    return await this.quizVariantRepository.save(newQuizVariant);
  }

  async update(
    id: string,
    quizVariant: Partial<QuizVariant>,
  ): Promise<QuizVariant> {
    await this.quizVariantRepository.update(id, quizVariant);
    return await this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.quizVariantRepository.delete(id);
  }

  async createWithQuestions(
    lessonVariantId: string,
    questions: Array<{
      question: string;
      options: Array<{ text: string; isCorrect: boolean }>;
    }>,
  ): Promise<QuizVariant> {
    const quizVariant = await this.create({
      lessonVariant: { id: lessonVariantId } as any,
    });

    for (const questionData of questions) {
      const questionVariant = await this.questionVariantRepository.save({
        question: questionData.question,
        quizVariant: { id: quizVariant.id } as any,
      });

      for (const optionData of questionData.options) {
        await this.optionVariantRepository.save({
          text: optionData.text,
          isCorrect: optionData.isCorrect,
          questionVariant: { id: questionVariant.id } as any,
        });
      }
    }

    return await this.findById(quizVariant.id);
  }
}
