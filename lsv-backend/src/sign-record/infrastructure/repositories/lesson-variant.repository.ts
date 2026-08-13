import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonVariant } from '../../../shared/domain/entities/lessonVariant';
import { LessonVariantRepositoryInterface } from '../../domain/ports/lesson-variant.repository.interface';

@Injectable()
export class TypeOrmLessonVariantRepository implements LessonVariantRepositoryInterface {
  constructor(
    @InjectRepository(LessonVariant)
    private readonly repository: Repository<LessonVariant>,
  ) {}

  async findByIdWithBaseAndRegion(id: string): Promise<LessonVariant | null> {
    return this.repository.findOne({
      where: { id },
      relations: {
        baseLesson: true,
        region: true,
      },
    });
  }
}
