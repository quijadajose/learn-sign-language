import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, In } from 'typeorm';
import { LessonModel } from '../../../shared/domain/entities/lessonModel';
import { LessonModelRepositoryInterface } from '../../domain/ports/lesson-model.repository.interface';
import { PaginationDto } from 'src/shared/domain/dto/PaginationDto';
import { resolveSupersedeScope } from '../../domain/utils/model-scope';

function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

@Injectable()
export class TypeOrmLessonModelRepository implements LessonModelRepositoryInterface {
  constructor(
    @InjectRepository(LessonModel)
    private readonly repository: Repository<LessonModel>,
  ) {}

  async findAll(pagination: PaginationDto): Promise<LessonModel[]> {
    const {
      page,
      limit,
      orderBy = undefined,
      sortOrder = undefined,
    } = pagination;

    const skip = (page - 1) * limit;
    const allowedOrderBy = new Set([
      'createdAt',
      'updatedAt',
      'name',
      'accuracy',
      'status',
      'progress',
    ]);
    const safeOrderBy =
      orderBy && allowedOrderBy.has(orderBy) ? orderBy : 'createdAt';
    const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    return this.repository.find({
      skip,
      take: limit,
      relations: {
        lesson: true,
      },
      order: { [safeOrderBy]: safeSortOrder },
    });
  }

  async findByLessonVariantId(
    lessonVariantId: string,
  ): Promise<LessonModel | null> {
    return this.repository.findOne({
      where: { lessonVariant: { id: lessonVariantId } },
    });
  }

  async findReadyForLesson(
    lessonId: string,
    lessonName: string,
    regionId?: string,
  ): Promise<LessonModel | null> {
    const { static: staticModel, dynamic: dynamicModel } =
      await this.findReadyModelsForLesson(lessonId, lessonName, regionId);
    return dynamicModel ?? staticModel;
  }

  async findReadyModelsForLesson(
    lessonId: string,
    lessonName: string,
    regionId?: string,
  ): Promise<{ static: LessonModel | null; dynamic: LessonModel | null }> {
    const candidates = await this.findAllReadyCandidates(
      lessonId,
      lessonName,
      regionId,
    );

    const staticModel =
      candidates.find((model) => model.modelType === 'static') ?? null;
    const dynamicModel =
      candidates.find((model) => model.modelType === 'dynamic') ?? null;

    return { static: staticModel, dynamic: dynamicModel };
  }

  private async findAllReadyCandidates(
    lessonId: string,
    lessonName: string,
    regionId?: string,
  ): Promise<LessonModel[]> {
    const results: LessonModel[] = [];

    const byLessonQuery = this.repository
      .createQueryBuilder('model')
      .leftJoinAndSelect('model.lessonVariant', 'variant')
      .leftJoin('variant.region', 'region')
      .where('model.lessonId = :lessonId', { lessonId })
      .andWhere('model.status = :status', { status: 'READY' });

    if (regionId && regionId !== 'global') {
      // Modelos base (sin variante) o de la región pedida; no filtrar otra región.
      byLessonQuery.andWhere(
        '(model.lessonVariantId IS NULL OR region.id = :regionId)',
        { regionId },
      );
    } else {
      byLessonQuery.andWhere(
        '(model.lessonVariantId IS NULL OR variant.isBase = :isBase)',
        { isBase: true },
      );
    }

    results.push(
      ...(await byLessonQuery.orderBy('model.updatedAt', 'DESC').getMany()),
    );

    const variantQuery = this.repository
      .createQueryBuilder('model')
      .innerJoin('model.lessonVariant', 'variant')
      .innerJoin('variant.baseLesson', 'baseLesson')
      .where('baseLesson.id = :lessonId', { lessonId })
      .andWhere('model.status = :status', { status: 'READY' });

    if (regionId && regionId !== 'global') {
      variantQuery
        .innerJoin('variant.region', 'region')
        .andWhere('region.id = :regionId', { regionId });
    } else {
      variantQuery.andWhere('variant.isBase = :isBase', { isBase: true });
    }

    results.push(
      ...(await variantQuery.orderBy('model.updatedAt', 'DESC').getMany()),
    );

    // Legacy: custom models sin lessonId, solo por sufijo de nombre (escapado).
    const suffixCandidates = [
      ` - ${lessonName}`,
      ` - ${lessonName.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F]/gu, '').trim()}`,
    ]
      .map((suffix) => suffix.toLowerCase())
      .filter(
        (suffix, index, arr) =>
          suffix.length > 3 && arr.indexOf(suffix) === index,
      );

    for (const suffix of suffixCandidates) {
      const escaped = escapeLikePattern(suffix);
      const customModels = await this.repository
        .createQueryBuilder('model')
        .where('model.status = :status', { status: 'READY' })
        .andWhere('model.lessonId IS NULL')
        .andWhere('model.lessonVariantId IS NULL')
        .andWhere('LOWER(model.name) LIKE :suffix ESCAPE :esc', {
          suffix: `%${escaped}`,
          esc: '\\',
        })
        .orderBy('LENGTH(model.name)', 'DESC')
        .getMany();
      results.push(...customModels);
    }

    const unique = new Map<string, LessonModel>();
    for (const model of results) {
      if (!unique.has(model.id)) {
        unique.set(model.id, model);
      }
    }

    return Array.from(unique.values());
  }

  async findPendingOrTraining(): Promise<LessonModel[]> {
    return this.repository.find({
      where: { status: In(['TRAINING', 'PENDING']) },
    });
  }

  async findById(id: string): Promise<LessonModel | null> {
    return this.repository.findOne({
      where: { id },
      relations: {
        lesson: true,
        lessonVariant: true,
      },
    });
  }

  create(
    data: Partial<Omit<LessonModel, 'lesson' | 'lessonVariant'>> & {
      lesson?: { id: string };
      lessonVariant?: { id: string };
    },
  ): LessonModel {
    return this.repository.create(data as DeepPartial<LessonModel>);
  }

  async save(model: LessonModel): Promise<LessonModel> {
    return this.repository.save(model);
  }

  async remove(model: LessonModel): Promise<LessonModel> {
    return this.repository.remove(model);
  }

  async update(id: string, data: Partial<LessonModel>): Promise<void> {
    await this.repository.update(id, data);
  }

  async supersedeReadyModels(params: {
    exceptId: string;
    modelType: 'static' | 'dynamic';
    lessonId?: string | null;
    lessonVariantId?: string | null;
    name?: string | null;
  }): Promise<number> {
    const { exceptId, modelType, lessonId, lessonVariantId, name } = params;
    const scope = resolveSupersedeScope({ lessonId, lessonVariantId, name });
    if (scope.mode === 'none') {
      return 0;
    }

    const qb = this.repository
      .createQueryBuilder()
      .update(LessonModel)
      .set({ status: 'FAILED' })
      .where('status = :ready', { ready: 'READY' })
      .andWhere('id != :exceptId', { exceptId })
      .andWhere('modelType = :modelType', { modelType });

    if (scope.mode === 'variant') {
      qb.andWhere('"lessonVariantId" = :lessonVariantId', {
        lessonVariantId: scope.lessonVariantId,
      });
    } else if (scope.mode === 'lesson') {
      qb.andWhere('"lessonId" = :lessonId', {
        lessonId: scope.lessonId,
      }).andWhere('"lessonVariantId" IS NULL');
    } else {
      qb.andWhere('name = :name', { name: scope.name })
        .andWhere('"lessonId" IS NULL')
        .andWhere('"lessonVariantId" IS NULL');
    }

    const result = await qb.execute();
    return result.affected ?? 0;
  }
}
