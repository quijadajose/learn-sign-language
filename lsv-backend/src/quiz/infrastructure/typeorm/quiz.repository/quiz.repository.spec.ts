import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QuizRepository } from './quiz.repository';
import { Quiz } from 'src/shared/domain/entities/quiz';
import { Question } from 'src/shared/domain/entities/question';
import { Option } from 'src/shared/domain/entities/option';
import { Lesson } from 'src/shared/domain/entities/lesson';
import { QuizSubmission } from 'src/shared/domain/entities/quizSubmission';
import { SortOrder } from 'src/shared/domain/dto/PaginationDto';

describe('QuizRepository', () => {
  let quizRepository: QuizRepository;
  let quizRepoMock: Repository<Quiz>;
  let questionRepoMock: Repository<Question>;
  let optionRepoMock: Repository<Option>;
  let lessonRepoMock: Repository<Lesson>;
  let submissionRepoMock: Repository<QuizSubmission>;

  beforeEach(async () => {
    // Creamos el módulo de pruebas con mocks de los repositorios
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizRepository,
        {
          provide: getRepositoryToken(Quiz),
          useClass: Repository, // Mock del repositorio de Quiz
        },
        {
          provide: getRepositoryToken(Question),
          useClass: Repository, // Mock del repositorio de Question
        },
        {
          provide: getRepositoryToken(Option),
          useClass: Repository, // Mock del repositorio de Option
        },
        {
          provide: getRepositoryToken(Lesson),
          useClass: Repository, // Mock del repositorio de Lesson
        },
        {
          provide: getRepositoryToken(QuizSubmission),
          useClass: Repository, // Mock del repositorio de QuizSubmission
        },
      ],
    }).compile();

    // Inyectamos las dependencias en variables para su uso en las pruebas
    quizRepository = module.get<QuizRepository>(QuizRepository);
    quizRepoMock = module.get(getRepositoryToken(Quiz));
    questionRepoMock = module.get(getRepositoryToken(Question));
    optionRepoMock = module.get(getRepositoryToken(Option));
    lessonRepoMock = module.get(getRepositoryToken(Lesson));
    submissionRepoMock = module.get(getRepositoryToken(QuizSubmission));
  });

  it('should be defined', () => {
    expect(quizRepository).toBeDefined();
  });
  describe('findById', () => {
    it('should return a quiz if it exists', async () => {
      const mockQuiz: Quiz = {
        id: '1',
        name: 'Quiz 1',
        description: 'Descripción del quiz',
        questions: [
          {
            id: '101',
            text: '¿Cuál es la capital de Francia?', // en los casos reales serán urls de los videos o imágenes
            options: [
              // por temas de facilitar la lectura coloqué una pregunta de geografía
              { id: '201', text: 'Madrid', isCorrect: false },
              { id: '202', text: 'París', isCorrect: true },
              { id: '203', text: 'Berlín', isCorrect: false },
            ],
          } as unknown as Question,
        ],
        lesson: {
          id: '301',
          title: 'Lección sobre geografía',
        } as unknown as Lesson,
        submissions: [] as QuizSubmission[], // Si necesitas mockear envíos de quiz
      } as unknown as Quiz;
      jest.spyOn(quizRepoMock, 'findOne').mockResolvedValue(mockQuiz);
      const result = await quizRepository.findById('1');
      expect(result).toEqual(mockQuiz);
      expect(quizRepoMock.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    });
  });

  describe('findAll', () => {
    it('should return a paginated list of quizzes', async () => {
      const mockPagination = {
        page: 1,
        limit: 2,
        orderBy: 'name',
        sortOrder: 'ASC' as SortOrder,
      };

      const mockQuizzes: Quiz[] = [
        {
          id: '1',
          name: 'Quiz A',
          description: 'Primer quiz',
        } as unknown as Quiz,
        {
          id: '2',
          name: 'Quiz B',
          description: 'Segundo quiz',
        } as unknown as Quiz,
      ];

      jest.spyOn(quizRepoMock, 'find').mockResolvedValue(mockQuizzes);

      const result = await quizRepository.findAll(mockPagination);

      expect(result).toEqual(mockQuizzes);
      expect(quizRepoMock.find).toHaveBeenCalledWith({
        skip: 0,
        take: 2,
        order: { name: 'ASC' },
      });
    });

    it('should handle pagination without sorting', async () => {
      const mockPagination = { page: 2, limit: 3 };

      const mockQuizzes: Quiz[] = [
        {
          id: '3',
          name: 'Quiz C',
          description: 'Tercer quiz',
        } as unknown as Quiz,
        {
          id: '4',
          name: 'Quiz D',
          description: 'Cuarto quiz',
        } as unknown as Quiz,
        {
          id: '5',
          name: 'Quiz E',
          description: 'Quinto quiz',
        } as unknown as Quiz,
      ];

      jest.spyOn(quizRepoMock, 'find').mockResolvedValue(mockQuizzes);

      const result = await quizRepository.findAll(mockPagination);

      expect(result).toEqual(mockQuizzes);
      expect(quizRepoMock.find).toHaveBeenCalledWith({
        skip: 3,
        take: 3,
      });
    });
  });

  it('should be defined', () => {
    expect(quizRepoMock).toBeDefined();
  });
  it('should be defined', () => {
    expect(questionRepoMock).toBeDefined();
  });
  it('should be defined', () => {
    expect(optionRepoMock).toBeDefined();
  });
  it('should be defined', () => {
    expect(lessonRepoMock).toBeDefined();
  });
  it('should be defined', () => {
    expect(submissionRepoMock).toBeDefined();
  });
});
