import { InjectRepository } from '@nestjs/typeorm';
import {
  PaginatedResponseDto,
  PaginationDto,
} from '../../../../shared/domain/dto/PaginationDto.js';
import { UserLesson } from '../../../../shared/domain/entities/userLesson.js';
import { UserLessonRepositoryInterface } from '../../../domain/ports/user-lesson.repository.interface/user-lesson.repository.interface.js';
import { Repository } from 'typeorm';
import { pickSafeOrderBy } from '../../../../shared/infrastructure/safe-order-by.js';

export class UserLessonRepository implements UserLessonRepositoryInterface {
  constructor(
    @InjectRepository(UserLesson)
    private readonly userLessonRepository: Repository<UserLesson>,
  ) {}
  async getUserLessonByUserId(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<UserLesson>> {
    const {
      page,
      limit,
      orderBy = undefined,
      sortOrder = undefined,
    } = pagination;

    const skip = (page - 1) * limit;
    const [data, total] = await this.userLessonRepository.findAndCount({
      where: { user: { id: userId } },
      skip: skip,
      take: limit,
      order: (() => {
        const safeOrderBy = pickSafeOrderBy(orderBy, [
          'id',
          'isCompleted',
          'completedAt',
          'createdAt',
        ]);
        return safeOrderBy ? { [safeOrderBy]: sortOrder } : undefined;
      })(),
    });

    return new PaginatedResponseDto(data, total, page, limit);
  }
  async startLesson(userId: string, lessonId: string): Promise<UserLesson> {
    let userLesson = await this.userLessonRepository.findOne({
      where: { user: { id: userId }, lesson: { id: lessonId } },
    });

    if (!userLesson) {
      userLesson = this.userLessonRepository.create({
        user: { id: userId },
        lesson: { id: lessonId },
        isCompleted: false,
        completedAt: null,
      });

      await this.userLessonRepository.save(userLesson);
    }

    return userLesson;
  }

  async setLessonCompletion(
    userId: string,
    lessonId: string,
    isCompleted: boolean,
  ): Promise<UserLesson> {
    let userLesson = await this.userLessonRepository.findOne({
      where: { user: { id: userId }, lesson: { id: lessonId } },
    });

    if (!userLesson) {
      userLesson = this.userLessonRepository.create({
        user: { id: userId },
        lesson: { id: lessonId },
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      });
    } else {
      userLesson.isCompleted = isCompleted;
      userLesson.completedAt = isCompleted ? new Date() : null;
    }

    return this.userLessonRepository.save(userLesson);
  }
}
