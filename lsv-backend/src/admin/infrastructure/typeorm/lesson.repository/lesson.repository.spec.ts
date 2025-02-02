import { LessonRepository } from './lesson.repository';

describe('LessonRepository', () => {
  it('should be defined', () => {
    expect(new LessonRepository()).toBeDefined();
  });
});
