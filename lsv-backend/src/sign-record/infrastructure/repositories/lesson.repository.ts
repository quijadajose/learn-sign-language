import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from 'src/shared/domain/entities/lesson';
import { LessonRepositoryInterface } from '../../domain/ports/lesson.repository.interface';

@Injectable()
export class TypeOrmLessonRepository implements LessonRepositoryInterface {
  constructor(
    @InjectRepository(Lesson)
    private readonly repository: Repository<Lesson>,
  ) {}

  async findById(id: string): Promise<Lesson | null> {
    return this.repository.findOne({ where: { id } });
  }
}
