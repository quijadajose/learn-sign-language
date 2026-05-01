import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, In } from 'typeorm';
import { LessonModel } from '../../../shared/domain/entities/lessonModel';
import { LessonModelRepositoryInterface } from '../../domain/ports/lesson-model.repository.interface';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';

@Injectable()
export class TypeOrmLessonModelRepository implements LessonModelRepositoryInterface {
  constructor(
    @InjectRepository(LessonModel)
    private readonly repository: Repository<LessonModel>,
  ) {}

  async find(options?: any): Promise<LessonModel[]> {
    return this.repository.find(options);
  }

  async findAll(pagination: PaginationDto): Promise<LessonModel[]> {
    const {
      page,
      limit,
      orderBy = undefined,
      sortOrder = undefined,
    } = pagination;

    const skip = (page - 1) * limit;

    const findOptions: any = {
      skip,
      take: limit,
    };

    if (orderBy && sortOrder) {
      findOptions.order = {
        [orderBy]: sortOrder,
      };
    } else {
      findOptions.order = { createdAt: 'DESC' };
    }
    return this.repository.find(findOptions);
  }

  async findByLessonVariantId(
    lessonVariantId: string,
  ): Promise<LessonModel | null> {
    return this.repository.findOne({
      where: { lessonVariant: { id: lessonVariantId } },
    });
  }

  async findPendingOrTraining(): Promise<LessonModel[]> {
    return this.repository.find({
      where: { status: In(['TRAINING', 'PENDING']) },
    });
  }

  async findOne(options: any): Promise<LessonModel | null> {
    return this.repository.findOne(options);
  }

  create(data: DeepPartial<LessonModel>): LessonModel {
    return this.repository.create(data);
  }

  async save(model: LessonModel): Promise<LessonModel> {
    return this.repository.save(model);
  }

  async remove(model: LessonModel): Promise<LessonModel> {
    return this.repository.remove(model);
  }

  async update(id: string, data: any): Promise<void> {
    await this.repository.update(id, data);
  }
}
