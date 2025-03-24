import { Inject } from '@nestjs/common';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { UserLesson } from 'src/shared/domain/entities/userLesson';
import { UserLessonRepositoryInterface } from 'src/user-lesson/domain/ports/user-lesson.repository.interface/user-lesson.repository.interface';

export class GetUserLessonByUserIdUseCase {
  constructor(
    @Inject('UserLessonRepositoryInterface')
    private readonly userLessonRepository: UserLessonRepositoryInterface,
  ) {}

  async execute(
    userId: string,
    pagination: PaginationDto,
  ): Promise<UserLesson[]> {
    return this.userLessonRepository.getUserLessonByUserId(userId, pagination);
  }
}
