import { listQuizzesByLanguageIdUseCase } from './list-quizzes-by-language-use-case';

describe('ListQuizzesUseCase', () => {
  it('should be defined', () => {
    expect(new listQuizzesByLanguageIdUseCase()).toBeDefined();
  });
});
