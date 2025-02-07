import { Inject } from '@nestjs/common';
import { UserLessonRepository } from 'src/user-lesson/infrastructure/typeorm/user-lesson.repository/user-lesson.repository';

export class SetLessonCompletionUseCase {
  constructor(
    @Inject('UserLessonRepositoryInterface')
    private readonly userLessonRepository: UserLessonRepository,
  ) {}
  execute(userId: string, lessonId: string, isCompleted: boolean) {
    this.userLessonRepository.setLessonCompletion(
      userId,
      lessonId,
      isCompleted,
    );
  }
}
