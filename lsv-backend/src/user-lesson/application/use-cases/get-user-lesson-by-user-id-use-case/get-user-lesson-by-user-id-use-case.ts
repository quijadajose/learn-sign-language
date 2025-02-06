import { Inject } from '@nestjs/common';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';
import { UserLesson } from 'src/shared/domain/entities/userLesson';
import { UserLessonRepository } from 'src/user-lesson/infrastructure/typeorm/user-lesson.repository/user-lesson.repository';

export class GetUserLessonByUserIdUseCase {
  constructor(
    @Inject('UserLessonRepositoryInterface')
    private readonly userLessonRepository: UserLessonRepository,
  ) {}

  async execute(
    userId: string,
    pagination: PaginationDto,
  ): Promise<UserLesson[]> {
    return this.userLessonRepository.getUserLessonByUserId(userId, pagination);
  }
}
