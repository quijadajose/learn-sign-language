import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonVariant } from 'src/shared/domain/entities/lessonVariant';

@Injectable()
export class LessonVariantRepository {
  constructor(
    @InjectRepository(LessonVariant)
    private readonly lessonVariantRepository: Repository<LessonVariant>,
  ) {}

  async findById(id: string): Promise<LessonVariant | null> {
    return await this.lessonVariantRepository.findOne({
      where: { id },
      relations: {
        region: true,
        baseLesson: true,
      },
    });
  }

  async findByLessonId(lessonId: string): Promise<LessonVariant[]> {
    return await this.lessonVariantRepository.find({
      where: { baseLesson: { id: lessonId } },
      relations: {
        region: true,
        baseLesson: true,
      },
    });
  }

  async save(variant: LessonVariant): Promise<LessonVariant> {
    return await this.lessonVariantRepository.save(variant);
  }

  async delete(id: string): Promise<void> {
    await this.lessonVariantRepository.delete(id);
  }

  async findByLessonAndRegion(
    lessonId: string,
    regionId: string,
  ): Promise<LessonVariant | null> {
    return await this.lessonVariantRepository.findOne({
      where: {
        baseLesson: { id: lessonId },
        region: { id: regionId },
      },
      relations: {
        region: true,
        baseLesson: true,
      },
    });
  }

  async findByLessonIdAndIsBase(
    lessonId: string,
    isBase: boolean,
  ): Promise<LessonVariant | null> {
    return await this.lessonVariantRepository.findOne({
      where: {
        baseLesson: { id: lessonId },
        isBase: isBase,
      },
      relations: {
        region: true,
        baseLesson: true,
      },
    });
  }
}
