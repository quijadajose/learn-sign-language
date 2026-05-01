import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Sign } from '../../../shared/domain/entities/sign';
import { SignRepositoryInterface } from '../../domain/ports/sign.repository.interface';

@Injectable()
export class TypeOrmSignRepository implements SignRepositoryInterface {
  constructor(
    @InjectRepository(Sign)
    private readonly repository: Repository<Sign>,
  ) {}

  async findById(id: string): Promise<Sign | null> {
    return this.repository.findOne({ where: { id } as any });
  }

  async find(options?: any): Promise<Sign[]> {
    return this.repository.find(options);
  }

  async save(sign: Sign): Promise<Sign> {
    return this.repository.save(sign);
  }

  async update(id: string, partialSign: Partial<Sign>): Promise<void> {
    await this.repository.update(id, partialSign);
  }

  async remove(sign: Sign): Promise<Sign> {
    return this.repository.remove(sign);
  }

  async findGlobalWithRecordingsCount(regionId?: string): Promise<Sign[]> {
    const qb = this.repository
      .createQueryBuilder('sign')
      .leftJoinAndSelect('sign.variants', 'variants')
      .where('sign.isGlobal = :isGlobal', { isGlobal: true });

    if (regionId) {
      qb.loadRelationCountAndMap(
        'sign.recordingsCount',
        'sign.recordings',
        'recordings',
        (qb) => qb.where('recordings.regionId = :regionId', { regionId }),
      );
    } else {
      qb.loadRelationCountAndMap('sign.recordingsCount', 'sign.recordings');
    }

    return qb.getMany();
  }

  async findForLessonWithRecordingsCount(
    lessonId: string,
    regionId?: string,
  ): Promise<Sign[]> {
    const qb = this.repository
      .createQueryBuilder('sign')
      .leftJoinAndSelect('sign.variants', 'variants')
      .innerJoin('sign.lessons', 'lesson', 'lesson.id = :lessonId', {
        lessonId,
      });

    if (regionId) {
      qb.loadRelationCountAndMap(
        'sign.recordingsCount',
        'sign.recordings',
        'recordings',
        (qb) => qb.where('recordings.regionId = :regionId', { regionId }),
      );
    } else {
      qb.loadRelationCountAndMap('sign.recordingsCount', 'sign.recordings');
    }

    return qb.getMany();
  }

  async findForTraining(lessonId: string): Promise<Sign[]> {
    return this.repository.find({
      where: [{ lessons: { id: lessonId } }, { isGlobal: true }],
      relations: ['variants', 'variants.region'],
    });
  }

  create(data: DeepPartial<Sign>): Sign {
    return this.repository.create(data);
  }
}
