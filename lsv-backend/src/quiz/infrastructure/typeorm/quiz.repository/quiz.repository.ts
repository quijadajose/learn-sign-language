import { InjectRepository } from '@nestjs/typeorm';
import { QuizDto } from 'src/quiz/application/dtos/quiz-dto/quiz-dto';
import { QuizRepositoryInterface } from 'src/quiz/domain/ports/quiz.repository.interface/quiz.repository.interface';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';
import { Lesson } from 'src/shared/domain/entities/lesson';
import { Option } from 'src/shared/domain/entities/option';
import { Question } from 'src/shared/domain/entities/question';
import { Quiz } from 'src/shared/domain/entities/quiz';
import { FindManyOptions, Repository } from 'typeorm';

export class QuizRepository implements QuizRepositoryInterface {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Option)
    private readonly optionRepository: Repository<Option>,
    @InjectRepository(Lesson)
    private readonly lessonRepository: Repository<Lesson>,
  ) {}
  findById(id: string): Promise<Quiz | null> {
    return this.quizRepository.findOne({ where: { id } });
  }
  findAll(pagination: PaginationDto): Promise<Quiz[]> {
    const {
      page,
      limit,
      orderBy = undefined,
      sortOrder = undefined,
    } = pagination;

    const skip = (page - 1) * limit;

    const findOptions: any = {
      skip,
      take: limit,
    };

    if (orderBy && sortOrder) {
      findOptions.order = {
        [orderBy]: sortOrder,
      };
    }
    return this.quizRepository.find(findOptions);
  }
  save(quiz: Quiz): Promise<Quiz> {
    return this.quizRepository.save(quiz);
  }
  async deleteById(id: string): Promise<void> {
    await this.quizRepository.delete(id);
  }
  update(id: string, quiz: QuizDto): Promise<Quiz> {
    this.quizRepository.update(id, quiz);
    return this.quizRepository.findOne({ where: { id } });
  }

  async saveWithQuestionsAndOptions(quizDto: QuizDto): Promise<Quiz> {
    // Buscar la Lesson asociada
    const lesson = await this.lessonRepository.findOne({
      where: { id: quizDto.lessonId },
    });

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const quiz = this.quizRepository.create({ lesson });

    const savedQuiz = await this.quizRepository.save(quiz);

    // Iterar sobre las preguntas
    const questions = await Promise.all(
      quizDto.questions.map(async (q) => {
        const question = this.questionRepository.create({
          text: q.text,
          quiz: savedQuiz,
        });
        const savedQuestion = await this.questionRepository.save(question);

        // Iterar sobre las opciones de cada pregunta
        const options = await Promise.all(
          q.options.map(async (o) => {
            const option = this.optionRepository.create({
              text: o.text,
              isCorrect: o.isCorrect,
              question: savedQuestion,
            });
            return this.optionRepository.save(option);
          }),
        );

        savedQuestion.options = options;
        return savedQuestion;
      }),
    );

    savedQuiz.questions = questions;
    return savedQuiz;
  }

  listQuizzesByLanguageId(
    languageId: string,
    pagination: PaginationDto,
  ): Promise<Quiz[]> {
    const {
      page,
      limit,
      orderBy = undefined,
      sortOrder = undefined,
    } = pagination;

    const skip = (page - 1) * limit;

    const findOptions: FindManyOptions = {
      where: {
        lesson: {
          language: {
            id: languageId,
          },
        },
      },
      relations: ['lesson', 'lesson.language'],
      skip,
      take: limit,
    };

    if (orderBy && sortOrder) {
      findOptions.order = {
        [orderBy]: sortOrder,
      };
    }
    return this.quizRepository.find(findOptions);
  }
}
