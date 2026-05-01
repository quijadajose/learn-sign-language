import { Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, DeepPartial, IsNull } from 'typeorm';
import { SignRecording } from '../../../shared/domain/entities/signRecording';
import { Sign } from '../../../shared/domain/entities/sign';
import { SignVariant } from '../../../shared/domain/entities/signVariant';
import { SignRecordingRepositoryInterface } from '../../domain/ports/sign-recording.repository.interface';

@Injectable()
export class TypeOrmSignRecordingRepository implements SignRecordingRepositoryInterface {
  constructor(
    @InjectRepository(SignRecording)
    private readonly repository: Repository<SignRecording>,
    private readonly dataSource: DataSource,
  ) {}

  async find(options?: any): Promise<SignRecording[]> {
    return this.repository.find(options);
  }

  async findOne(options: any): Promise<SignRecording | null> {
    return this.repository.findOne(options);
  }

  create(data: DeepPartial<SignRecording>): SignRecording {
    return this.repository.create(data);
  }

  async save(recording: SignRecording): Promise<SignRecording> {
    return this.repository.save(recording);
  }

  async remove(recording: SignRecording): Promise<SignRecording> {
    return this.repository.remove(recording);
  }

  async findForTraining(filters: {
    languageId?: string;
    regionId?: string;
    stageId?: string;
    stageIds?: string[];
    signIds?: string[];
    lessonId?: string;
  }): Promise<SignRecording[]> {
    const query = this.repository
      .createQueryBuilder('recording')
      .leftJoinAndSelect('recording.sign', 'sign')
      .leftJoin('sign.lessons', 'lesson')
      .leftJoin('lesson.stage', 'stage');

    const mainConditions = [];
    const params: any = {};

    if (filters.languageId) {
      mainConditions.push('lesson.languageId = :languageId');
      params.languageId = filters.languageId;
    }

    if (filters.lessonId) {
      mainConditions.push('lesson.id = :lessonId');
      params.lessonId = filters.lessonId;
    }

    if (filters.stageId) {
      mainConditions.push('stage.id = :stageId');
      params.stageId = filters.stageId;
    }

    if (filters.stageIds && filters.stageIds.length > 0) {
      mainConditions.push('stage.id IN (:...stageIds)');
      params.stageIds = filters.stageIds;
    }

    if (filters.signIds && filters.signIds.length > 0) {
      mainConditions.push('sign.id IN (:...signIds)');
      params.signIds = filters.signIds;
    }

    if (mainConditions.length > 0) {
      const combinedCriteria = mainConditions.join(' AND ');
      query.andWhere(`(${combinedCriteria} OR sign.isGlobal = true)`, params);
    } else {
      query.andWhere('sign.isGlobal = true');
    }

    if (filters.regionId && isUUID(filters.regionId)) {
      query.andWhere('recording.regionId = :regionId', {
        regionId: filters.regionId,
      });
    }

    return query.getMany();
  }

  async findBySignAndRegion(
    signId: string,
    regionId?: string,
  ): Promise<SignRecording[]> {
    const where: any = { sign: { id: signId } };

    if (regionId && isUUID(regionId)) {
      where.region = { id: regionId };
    } else {
      where.region = IsNull();
    }

    return this.repository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async saveWithLandmarksUpdate(
    recording: SignRecording,
    regionId?: string,
  ): Promise<SignRecording> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const savedRecording = await queryRunner.manager.save(
        SignRecording,
        recording,
      );
      if (regionId) {
        let variant = await queryRunner.manager.findOne(SignVariant, {
          where: { sign: { id: recording.sign.id }, region: { id: regionId } },
        });

        if (!variant) {
          variant = queryRunner.manager.create(SignVariant, {
            sign: { id: recording.sign.id } as Sign,
            region: { id: regionId } as any,
          });
        }
        variant.landmarks = recording.landmarks;
        await queryRunner.manager.save(SignVariant, variant);
      } else {
        await queryRunner.manager.update(Sign, recording.sign.id, {
          landmarks: recording.landmarks,
        });
      }

      await queryRunner.commitTransaction();
      return savedRecording;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
