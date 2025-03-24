import { InjectRepository } from '@nestjs/typeorm';
import { StageDto } from 'src/shared/domain/dtos/create-stage-dto/create-stage-dto';
import { StageRepositoryInterface } from 'src/stage/domain/ports/stage.repository.interface/stage.repository.interface';
import { PaginationDto } from 'src/shared/domain/dtos/PaginationDto';
import { Stages } from 'src/shared/domain/entities/stage';
import { FindManyOptions, Repository } from 'typeorm';

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

    const findOptions: any = {
      skip,
      take: limit,
    };

    if (orderBy && sortOrder) {
      findOptions.order = {
        [orderBy]: sortOrder,
      };
    }
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
  ): Promise<Stages[]> {
    const {
      page,
      limit,
      orderBy = undefined,
      sortOrder = undefined,
    } = pagination;

    const skip = (page - 1) * limit;

    const findOptions: FindManyOptions = {
      select: ['id', 'name', 'description'],
      where: { language: { id: languageId } },
      skip,
      take: limit,
    };

    if (orderBy && sortOrder) {
      findOptions.order = {
        [orderBy]: sortOrder,
      };
    }
    return this.stageRepository.find(findOptions);
  }
}
