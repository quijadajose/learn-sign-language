import { Inject } from '@nestjs/common';
import { UserLessonRepositoryInterface } from 'src/user-lesson/domain/ports/user-lesson.repository.interface/user-lesson.repository.interface';

export class StartLessonUseCase {
  constructor(
    @Inject('UserLessonRepositoryInterface')
    private readonly userLessonRepository: UserLessonRepositoryInterface,
  ) {}
  execute(userId: string, lessonId: string) {
    this.userLessonRepository.startLesson(userId, lessonId);
  }
}
