import { PaginationDto } from 'src/shared/domain/dtos/PaginationDto';
import { UserLesson } from 'src/shared/domain/entities/userLesson';

export interface UserLessonRepositoryInterface {
  getUserLessonByUserId(
    userId: string,
    pagination: PaginationDto,
  ): Promise<UserLesson[]>;
  startLesson(userId: string, lessonId: string): Promise<UserLesson>;
  setLessonCompletion(
    userId: string,
    lessonId: string,
    isCompleted: boolean,
  ): Promise<UserLesson>;
}
