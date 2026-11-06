import { Sign } from '../../../shared/domain/entities/sign.js';

export interface SignRepositoryInterface {
  findById(id: string): Promise<Sign | null>;
  save(sign: Sign): Promise<Sign>;
  update(id: string, partialSign: Partial<Sign>): Promise<void>;
  remove(sign: Sign): Promise<Sign>;
  findGlobalWithRecordingsCount(
    regionId?: string,
    languageIds?: string[],
  ): Promise<Sign[]>;
  findForLessonWithRecordingsCount(
    lessonId: string,
    regionId?: string,
  ): Promise<Sign[]>;
  findForTraining(lessonId: string): Promise<Sign[]>;
  create(
    data: Partial<Omit<Sign, 'language' | 'lessons'>> & {
      language?: { id: string };
      lessons?: { id: string }[];
    },
  ): Sign;
}
