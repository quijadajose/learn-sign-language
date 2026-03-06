import { Inject } from '@nestjs/common';
import { UserLessonRepositoryInterface } from 'src/user-lesson/domain/ports/user-lesson.repository.interface/user-lesson.repository.interface';

export class SetLessonCompletionUseCase {
  constructor(
    @Inject('UserLessonRepositoryInterface')
    private readonly userLessonRepository: UserLessonRepositoryInterface,
  ) { }
  async execute(userId: string, lessonId: string, isCompleted: boolean) {
    return await this.userLessonRepository.setLessonCompletion(
      userId,
      lessonId,
      isCompleted,
    );
  }
}
