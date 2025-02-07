import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';
import { UserLesson } from 'src/shared/domain/entities/userLesson';

export interface UserLessonRepositoryInterface {
  getUserLessonByUserId(
    userId: string,
    pagination: PaginationDto,
  ): Promise<UserLesson[]>;
  startLesson(userId: string, lessonId: string): Promise<UserLesson>;
}
