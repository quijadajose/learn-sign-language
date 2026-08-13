import { SignRecording } from 'src/shared/domain/entities/signRecording';

export interface SignRecordingRepositoryInterface {
  findById(id: string): Promise<SignRecording | null>;
  create(data: Partial<SignRecording>): SignRecording;
  save(recording: SignRecording): Promise<SignRecording>;
  remove(recording: SignRecording): Promise<SignRecording>;
  findForTraining(filters: {
    languageId?: string;
    regionId?: string;
    stageId?: string;
    stageIds?: string[];
    signIds?: string[];
    lessonId?: string;
  }): Promise<SignRecording[]>;
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
