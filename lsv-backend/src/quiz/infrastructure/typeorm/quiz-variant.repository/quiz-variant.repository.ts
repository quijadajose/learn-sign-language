import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuizVariant } from 'src/shared/domain/entities/quizVariant';
import { QuestionVariant } from 'src/shared/domain/entities/questionVariant';
import { OptionVariant } from 'src/shared/domain/entities/optionVariant';
import { QuizSubmission } from 'src/shared/domain/entities/quizSubmission';
import { User } from 'src/shared/domain/entities/user';
import { SubmissionDto } from 'src/quiz/application/dto/submission/submission-dto';

@Injectable()
export class QuizVariantRepository {
  constructor(
    @InjectRepository(QuizVariant)
    private readonly quizVariantRepository: Repository<QuizVariant>,
    @InjectRepository(QuestionVariant)
    private readonly questionVariantRepository: Repository<QuestionVariant>,
    @InjectRepository(OptionVariant)
    private readonly optionVariantRepository: Repository<OptionVariant>,
    @InjectRepository(QuizSubmission)
    private readonly submissionRepository: Repository<QuizSubmission>,
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

  async updateWithQuestions(
    id: string,
    lessonVariantId: string,
    questions: Array<{
      question: string;
      options: Array<{ text: string; isCorrect: boolean }>;
    }>,
  ): Promise<QuizVariant> {
    const existingQuizVariant = await this.quizVariantRepository.findOne({
      where: { id },
      relations: ['questionVariants', 'questionVariants.optionVariants'],
    });

    if (!existingQuizVariant) {
      throw new Error('Quiz variant not found');
    }

    // Delete existing questions and options
    if (
      existingQuizVariant.questionVariants &&
      existingQuizVariant.questionVariants.length > 0
    ) {
      for (const question of existingQuizVariant.questionVariants) {
        if (question.optionVariants && question.optionVariants.length > 0) {
          await this.optionVariantRepository.delete({
            questionVariant: { id: question.id },
          });
        }
        await this.questionVariantRepository.delete({ id: question.id });
      }
    }

    // Update lesson variant if provided
    if (lessonVariantId) {
      existingQuizVariant.lessonVariant = { id: lessonVariantId } as any;
      await this.quizVariantRepository.save(existingQuizVariant);
    }

    // Create new questions and options
    for (const questionData of questions) {
      const questionVariant = await this.questionVariantRepository.save({
        question: questionData.question,
        quizVariant: { id: existingQuizVariant.id } as any,
      });

      for (const optionData of questionData.options) {
        await this.optionVariantRepository.save({
          text: optionData.text,
          isCorrect: optionData.isCorrect,
          questionVariant: { id: questionVariant.id } as any,
        });
      }
    }

    return await this.findById(existingQuizVariant.id);
  }

  async submissionTest(
    user: User,
    quizVariant: QuizVariant,
    submissionDto: SubmissionDto,
  ) {
    const correctOptions = await this.optionVariantRepository.find({
      where: {
        questionVariant: {
          quizVariant: { id: quizVariant.id },
        },
        isCorrect: true,
      },
      relations: ['questionVariant'],
    });

    const correctAnswersMap = new Map<string, string>(); // questionId -> optionId
    correctOptions.forEach((option) => {
      correctAnswersMap.set(option.questionVariant.id, option.id);
    });

    let correctCount = 0;
    for (const submission of submissionDto.answers) {
      if (
        correctAnswersMap.get(submission.questionId) === submission.optionId
      ) {
        correctCount++;
      }
    }

    const totalQuestions = correctOptions.length;
    const score =
      totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const submission = this.submissionRepository.create({
      user: user,
      quizVariant: quizVariant,
      answers: JSON.stringify(submissionDto.answers) as any,
      score: Math.round(score),
    });
    const savedSubmission = await this.submissionRepository.save(submission);
    const { id, submittedAt } = savedSubmission;
    return { id, submittedAt, score };
  }
}
