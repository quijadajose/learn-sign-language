import { UserLessonRepository } from './user-lesson.repository';

describe('UserLessonRepository', () => {
  it('should be defined', () => {
    expect(new UserLessonRepository()).toBeDefined();
  });
});
