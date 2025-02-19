import { QuizRepository } from './quiz.repository';

describe('QuizRepository', () => {
  it('should be defined', () => {
    expect(new QuizRepository()).toBeDefined();
  });
});
