import { ListQuizUseCase } from './list-quiz-use-case';
import { QuizRepositoryInterface } from 'src/quiz/domain/ports/quiz.repository.interface/quiz.repository.interface';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { Quiz } from 'src/shared/domain/entities/quiz';

describe('ListQuizUseCase', () => {
  it('returns quizzes from the repository', async () => {
    const quizzes = [{ id: 'q1' } as Quiz];
    const quizRepository: Pick<QuizRepositoryInterface, 'findAll'> = {
      findAll: jest.fn().mockResolvedValue(quizzes),
    };
    const useCase = new ListQuizUseCase(
      quizRepository as QuizRepositoryInterface,
    );
    const pagination: PaginationDto = { page: 1, limit: 10 };

    await expect(useCase.execute(pagination)).resolves.toEqual(quizzes);
    expect(quizRepository.findAll).toHaveBeenCalledWith(pagination);
  });
});
