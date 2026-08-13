import { InjectRepository } from '@nestjs/typeorm';
import { StageDto } from 'src/shared/domain/dto/create-stage/create-stage-dto';
import {
  StageProgressRow,
  StageRepositoryInterface,
} from 'src/stage/domain/ports/stage.repository.interface/stage.repository.interface';
import {
  PaginatedResponseDto,
  PaginationDto,
} from 'src/shared/domain/dto/PaginationDto';
import { Stages } from 'src/shared/domain/entities/stage';
import { FindManyOptions, Repository } from 'typeorm';
import { QuizSubmission } from 'src/shared/domain/entities/quizSubmission';

export class StageRepository implements StageRepositoryInterface {
  constructor(
    @InjectRepository(Stages)
    private readonly stageRepository: Repository<Stages>,
  ) {}
  findById(id: string): Promise<Stages | null> {
    return this.stageRepository.findOne({ where: { id } });
  }
  findByNameInLanguage(
    name: string,
    languageId: string,
  ): Promise<Stages | null> {
    return this.stageRepository.findOne({
      where: {
        name: name,
        language: { id: languageId },
      },
    });
  }
  findAll(pagination: PaginationDto): Promise<Stages[]> {
    const {
      page,
      limit,
      orderBy = undefined,
      sortOrder = undefined,
    } = pagination;

    const skip = (page - 1) * limit;
    const allowedOrderBy = new Set(['createdAt', 'updatedAt', 'name']);
    const safeOrderBy =
      orderBy && allowedOrderBy.has(orderBy) ? orderBy : 'name';
    const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const findOptions: FindManyOptions = {
      skip,
      take: limit,
      order: { [safeOrderBy]: safeSortOrder },
    };

    return this.stageRepository.find(findOptions);
  }
  save(stage: Stages): Promise<Stages> {
    return this.stageRepository.save(stage);
  }
  async deleteById(id: string): Promise<void> {
    this.stageRepository.delete(id);
  }
  update(id: string, stage: StageDto): Promise<Stages> {
    this.stageRepository.update(id, stage);
    return this.stageRepository.findOne({ where: { id } });
  }
  findStagesByLanguage(
    languageId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<Stages>> {
    const {
      page,
      limit,
      orderBy = undefined,
      sortOrder = undefined,
    } = pagination;

    const skip = (page - 1) * limit;

    const allowedOrderBy = new Set(['createdAt', 'updatedAt', 'name']);
    const safeOrderBy =
      orderBy && allowedOrderBy.has(orderBy) ? orderBy : 'name';
    const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';

    const findOptions: FindManyOptions = {
      select: { id: true, name: true, description: true },
      where: { language: { id: languageId } },
      skip,
      take: limit,
      order: { [safeOrderBy]: safeSortOrder },
    };

    return this.stageRepository
      .findAndCount(findOptions)
      .then(([data, total]) => {
        return new PaginatedResponseDto(data, total, page, limit);
      });
  }

  async findByLanguageId(languageId: string): Promise<Stages[]> {
    return this.stageRepository.find({
      where: { language: { id: languageId } },
      relations: {
        lessons: true,
      },
    });
  }

  async getStagesProgressForUser(
    userId: string,
    languageId: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResponseDto<StageProgressRow>> {
    // Learning path is always beginner → advanced (A1 → C2).
    // Do not inherit PaginationDto's global DESC default.
    const { page = 1, limit = 100, orderBy = 'name' } = pagination;
    const skip = (page - 1) * limit;
    const allowedOrderBy = new Set(['name', 'description']);
    const safeOrderBy =
      orderBy && allowedOrderBy.has(orderBy) ? orderBy : 'name';
    const safeSortOrder = 'ASC' as const;

    const queryBuilder = this.stageRepository
      .createQueryBuilder('s')
      .select('s.id', 'id')
      .addSelect('s.name', 'name')
      .addSelect('s.description', 'description')
      .addSelect('COUNT(DISTINCT l.id)', 'totalLessons')
      .addSelect(
        'COUNT(DISTINCT CASE WHEN qs.score >= 80 THEN l.id END)',
        'completedLessons',
      )
      .addSelect(
        'ROUND(COUNT(DISTINCT CASE WHEN qs.score >= 80 THEN l.id END) / NULLIF(COUNT(DISTINCT l.id), 0) * 100, 2)',
        'progress',
      )
      .leftJoin('s.lessons', 'l')
      .leftJoin('l.quizzes', 'q')
      .leftJoin('l.variants', 'lv')
      .leftJoin('lv.quizVariants', 'qv')
      .leftJoin(
        QuizSubmission,
        'qs',
        'qs.userId = :userId AND (qs.quizId = q.id OR qs.quizVariantId = qv.id)',
        { userId },
      )
      .where('s.languageId = :languageId', { languageId })
      .groupBy('s.id')
      .addGroupBy('s.name')
      .addGroupBy('s.description')
      .orderBy(`s.${safeOrderBy}`, safeSortOrder);

    queryBuilder.skip(skip).take(limit);

    const [data, total] = await Promise.all([
      queryBuilder.getRawMany<StageProgressRow>(),
      this.stageRepository
        .createQueryBuilder('s')
        .select('COUNT(DISTINCT s.id)', 'count')
        .where('s.languageId = :languageId', { languageId })
        .getRawOne()
        .then((result) => parseInt(result.count) || 0),
    ]);

    return {
      data,
      total,
      page,
      pageSize: limit,
    };
  }
}
