import { Inject } from '@nestjs/common';
import { UserLessonRepositoryInterface } from 'src/user-lesson/domain/ports/user-lesson.repository.interface/user-lesson.repository.interface';

export class StartLessonUseCase {
  constructor(
    @Inject('UserLessonRepositoryInterface')
    private readonly userLessonRepository: UserLessonRepositoryInterface,
  ) { }
  async execute(userId: string, lessonId: string) {
    return await this.userLessonRepository.startLesson(userId, lessonId);
  }
}
