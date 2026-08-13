import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository, SelectQueryBuilder } from 'typeorm';
import { Sign } from '../../../shared/domain/entities/sign';
import { SignRecording } from '../../../shared/domain/entities/signRecording';
import { SignRepositoryInterface } from '../../domain/ports/sign.repository.interface';

@Injectable()
export class TypeOrmSignRepository implements SignRepositoryInterface {
  constructor(
    @InjectRepository(Sign)
    private readonly repository: Repository<Sign>,
  ) {}

  async findById(id: string): Promise<Sign | null> {
    return this.repository.findOne({ where: { id } });
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

    return this.withRecordingsCount(qb, regionId);
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

    return this.withRecordingsCount(qb, regionId);
  }

  async findForTraining(lessonId: string): Promise<Sign[]> {
    return this.repository.find({
      where: [{ lessons: { id: lessonId } }, { isGlobal: true }],
      relations: {
        variants: {
          region: true,
        },
      },
    });
  }

  create(data: DeepPartial<Sign>): Sign {
    return this.repository.create(data);
  }

  private async withRecordingsCount(
    qb: SelectQueryBuilder<Sign>,
    regionId?: string,
  ): Promise<Sign[]> {
    const signs = await qb.getMany();
    if (signs.length === 0) return signs;

    const countsQb = this.repository.manager
      .createQueryBuilder(SignRecording, 'recordings')
      .innerJoin('recordings.sign', 'sign')
      .select('sign.id', 'signId')
      .addSelect('COUNT(recordings.id)', 'count')
      .where('sign.id IN (:...signIds)', {
        signIds: signs.map((entity) => entity.id),
      })
      .groupBy('sign.id');

    if (regionId) {
      countsQb
        .innerJoin('recordings.region', 'region')
        .andWhere('region.id = :regionId', { regionId });
    }

    const rows = await countsQb.getRawMany<{ signId: string; count: string }>();
    const countBySignId = new Map(
      rows.map((row) => [row.signId, Number(row.count)]),
    );

    for (const sign of signs) {
      Object.assign(sign, {
        recordingsCount: countBySignId.get(sign.id) ?? 0,
      });
    }

    return signs;
  }
}
