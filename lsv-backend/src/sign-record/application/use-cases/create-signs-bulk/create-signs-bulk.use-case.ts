import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { SignRepositoryInterface } from 'src/sign-record/domain/ports/sign.repository.interface';
import { CreateSignsBulkDto } from 'src/sign-record/domain/dto/sign-record.dto';
import { Sign } from 'src/shared/domain/entities/sign';

export type BulkCreateSkipped = {
  name: string;
  reason: 'duplicate_in_request' | 'already_in_lesson';
};

export type BulkCreateResult = {
  created: Sign[];
  skipped: BulkCreateSkipped[];
};

@Injectable()
export class CreateSignsBulkUseCase {
  constructor(
    @Inject('SignRepositoryInterface')
    private readonly signRepository: SignRepositoryInterface,
  ) {}

  async execute(data: CreateSignsBulkDto): Promise<BulkCreateResult> {
    if (!data.languageId) {
      throw new BadRequestException('languageId is required');
    }
    if (!data.lessonId) {
      throw new BadRequestException('lessonId is required');
    }
    if (!Array.isArray(data.signs) || data.signs.length === 0) {
      throw new BadRequestException('signs must not be empty');
    }

    const existing = await this.signRepository.findForLessonWithRecordingsCount(
      data.lessonId,
    );
    const existingNames = new Set(
      existing.map((s) => s.name.trim().toLocaleLowerCase('es')),
    );

    const skipped: BulkCreateSkipped[] = [];
    const seenInRequest = new Set<string>();
    const toCreate: { name: string; detectionType: 'static' | 'dynamic' }[] =
      [];

    for (const item of data.signs) {
      const name = (item.name || '').trim();
      if (!name) continue;

      const key = name.toLocaleLowerCase('es');
      if (seenInRequest.has(key)) {
        skipped.push({ name, reason: 'duplicate_in_request' });
        continue;
      }
      seenInRequest.add(key);

      if (existingNames.has(key)) {
        skipped.push({ name, reason: 'already_in_lesson' });
        continue;
      }

      toCreate.push({
        name,
        detectionType: item.detectionType || 'static',
      });
    }

    if (toCreate.length === 0) {
      return { created: [], skipped };
    }

    const entities = toCreate.map((item) =>
      this.signRepository.create({
        name: item.name,
        language: { id: data.languageId },
        lessons: [{ id: data.lessonId }],
        isGlobal: false,
        detectionType: item.detectionType,
      }),
    );

    const created: Sign[] = [];
    for (const entity of entities) {
      created.push(await this.signRepository.save(entity));
    }

    return { created, skipped };
  }
}
