import { GetQuizByIdUseCase } from './get-quiz-by-id-use-case';
import { QuizRepositoryInterface } from 'src/quiz/domain/ports/quiz.repository.interface/quiz.repository.interface';
import { Quiz } from 'src/shared/domain/entities/quiz';

describe('GetQuizByIdUseCase', () => {
  it('strips isCorrect from options before returning the quiz', async () => {
    const quiz = {
      id: 'q1',
      questions: [
        {
          id: 'n1',
          text: '¿Cuál?',
          options: [
            { id: 'o1', text: 'A', isCorrect: true },
            { id: 'o2', text: 'B', isCorrect: false },
          ],
        },
      ],
    } as unknown as Quiz;

    const quizRepository: Pick<QuizRepositoryInterface, 'getQuizById'> = {
      getQuizById: jest.fn().mockResolvedValue(quiz),
    };
    const useCase = new GetQuizByIdUseCase(
      quizRepository as QuizRepositoryInterface,
    );

    const result = await useCase.execute('q1');

    expect(JSON.stringify(result)).not.toContain('isCorrect');
    expect(result.questions[0].options[0]).toEqual({ id: 'o1', text: 'A' });
    expect(quizRepository.getQuizById).toHaveBeenCalledWith('q1');
  });
});
