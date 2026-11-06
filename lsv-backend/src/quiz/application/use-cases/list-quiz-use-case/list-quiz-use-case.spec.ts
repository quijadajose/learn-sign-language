import { ListQuizUseCase } from './list-quiz-use-case.js';
import { QuizRepositoryInterface } from '../../../domain/ports/quiz.repository.interface/quiz.repository.interface.js';
import { PaginationDto } from '../../../../shared/domain/dto/PaginationDto.js';
import { Quiz } from '../../../../shared/domain/entities/quiz.js';

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
