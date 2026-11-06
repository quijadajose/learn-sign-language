import { SignRecording } from '../../../shared/domain/entities/signRecording.js';

export type TrainingRecordingFilters = {
  languageId?: string;
  regionId?: string;
  stageId?: string;
  stageIds?: string[];
  signIds?: string[];
  lessonId?: string;
};

export interface SignRecordingRepositoryInterface {
  findById(id: string): Promise<SignRecording | null>;
  create(data: Partial<SignRecording>): SignRecording;
  save(recording: SignRecording): Promise<SignRecording>;
  remove(recording: SignRecording): Promise<SignRecording>;
  findForTraining(filters: TrainingRecordingFilters): Promise<SignRecording[]>;
  /** BE-11: página de grabaciones con id > afterId (keyset), para no cargarlas todas. */
  findTrainingPage(
    filters: TrainingRecordingFilters,
    afterId: string | undefined,
    limit: number,
  ): Promise<SignRecording[]>;
  findValidatedForLessonTraining(
    lessonId: string,
    regionId?: string,
  ): Promise<SignRecording[]>;
  findBySignAndRegion(
    signId: string,
    regionId?: string,
  ): Promise<SignRecording[]>;
  saveWithLandmarksUpdate(
    recording: SignRecording,
    regionId?: string,
  ): Promise<SignRecording>;
}
