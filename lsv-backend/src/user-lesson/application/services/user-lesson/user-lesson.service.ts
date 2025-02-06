import { Injectable } from '@nestjs/common';
import { GetUserLessonByUserIdUseCase } from '../../use-cases/get-user-lesson-by-user-id-use-case/get-user-lesson-by-user-id-use-case';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';
import { UserLesson } from 'src/shared/domain/entities/userLesson';

@Injectable()
export class UserLessonService {
  constructor(
    private readonly getUserLessonByUserIdUseCase: GetUserLessonByUserIdUseCase,
  ) {}
  getUserLessonByUserId(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<UserLesson[]> {
    return this.getUserLessonByUserIdUseCase.execute(userId, paginationDto);
  }
}
