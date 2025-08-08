import { Inject } from '@nestjs/common';
import { UserLessonRepositoryInterface } from 'src/user-lesson/domain/ports/user-lesson.repository.interface/user-lesson.repository.interface';

export class SetLessonCompletionUseCase {
  constructor(
    @Inject('UserLessonRepositoryInterface')
    private readonly userLessonRepository: UserLessonRepositoryInterface,
  ) {}
  execute(userId: string, lessonId: string, isCompleted: boolean) {
    this.userLessonRepository.setLessonCompletion(
      userId,
      lessonId,
      isCompleted,
    );
  }
}
