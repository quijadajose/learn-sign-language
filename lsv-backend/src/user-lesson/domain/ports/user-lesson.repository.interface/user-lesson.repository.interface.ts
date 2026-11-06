import {
  PaginatedResponseDto,
  PaginationDto,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { UserLesson } from '../../../../shared/domain/entities/userLesson.js';

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
