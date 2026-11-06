import { Inject } from '@nestjs/common';
import { UserLessonRepositoryInterface } from '../../../domain/ports/user-lesson.repository.interface/user-lesson.repository.interface.js';

export class StartLessonUseCase {
  constructor(
    @Inject('UserLessonRepositoryInterface')
    private readonly userLessonRepository: UserLessonRepositoryInterface,
  ) {}
  async execute(userId: string, lessonId: string) {
    return await this.userLessonRepository.startLesson(userId, lessonId);
  }
}
