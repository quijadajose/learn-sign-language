import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lesson } from '../../../shared/domain/entities/lesson.js';
import { LessonRepositoryInterface } from '../../domain/ports/lesson.repository.interface.js';

@Injectable()
export class TypeOrmLessonRepository implements LessonRepositoryInterface {
  constructor(
    @InjectRepository(Lesson)
    private readonly repository: Repository<Lesson>,
  ) {}

  async findById(id: string): Promise<Lesson | null> {
    // BE-06: se carga el idioma para validar que la seña y la lección son del mismo idioma.
    return this.repository.findOne({
      where: { id },
      relations: { language: true },
    });
  }
}
