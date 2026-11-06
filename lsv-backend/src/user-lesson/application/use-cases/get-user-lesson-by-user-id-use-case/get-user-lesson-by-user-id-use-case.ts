import { Inject } from '@nestjs/common';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { UserLesson } from '../../../../shared/domain/entities/userLesson.js';
import { UserLessonRepositoryInterface } from '../../../domain/ports/user-lesson.repository.interface/user-lesson.repository.interface.js';

export class GetUserLessonByUserIdUseCase {
  constructor(
    @Inject('UserLessonRepositoryInterface')
    private readonly userLessonRepository: UserLessonRepositoryInterface,
  ) {}

  async execute(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<UserLesson>> {
    return this.userLessonRepository.getUserLessonByUserId(userId, pagination);
  }
}
