import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from 'src/shared/application/dtos/PaginationDto';
import { UserLesson } from 'src/shared/domain/entities/userLesson';
import { UserLessonRepositoryInterface } from 'src/user-lesson/domain/ports/user-lesson.repository.interface/user-lesson.repository.interface';
import { Repository } from 'typeorm';

export class UserLessonRepository implements UserLessonRepositoryInterface {
  constructor(
    @InjectRepository(UserLesson)
    private readonly userLessonRepository: Repository<UserLesson>,
  ) {}
  async getUserLessonByUserId(
    userId: string,
    pagination: PaginationDto,
  ): Promise<UserLesson[]> {
    const {
      page,
      limit,
      orderBy = undefined,
      sortOrder = undefined,
    } = pagination;

    const skip = (page - 1) * limit;
    return await this.userLessonRepository.find({
      where: { user: { id: userId } },
      skip: skip,
      take: pagination.limit,
      order: orderBy ? { [orderBy]: sortOrder } : undefined,
    });
  }
}
