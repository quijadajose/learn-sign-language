import {
  PaginatedResponseDto,
  PaginationDto,
} from 'src/shared/domain/dto/PaginationDto';
import { UserLesson } from 'src/shared/domain/entities/userLesson';

export interface UserLessonRepositoryInterface {
  getUserLessonByUserId(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<UserLesson>>;
  startLesson(userId: string, lessonId: string): Promise<UserLesson>;
  setLessonCompletion(
    userId: string,
    lessonId: string,
    isCompleted: boolean,
  ): Promise<UserLesson>;
}
