import { Inject, Injectable } from '@nestjs/common';
import { Sign } from 'src/shared/domain/entities/sign';
import { SignRecordingRepositoryInterface } from 'src/sign-record/domain/ports/sign-recording.repository.interface';
import { SaveLandmarksDto } from 'src/sign-record/infrastructure/sign-record/sign-record.dto';

@Injectable()
export class SaveLandmarksUseCase {
  constructor(
    @Inject('SignRecordingRepositoryInterface')
    private readonly signRecordingRepository: SignRecordingRepositoryInterface,
  ) {}

  async execute(data: SaveLandmarksDto) {
    const recording = this.signRecordingRepository.create({
      sign: { id: data.signId } as Sign,
      region: data.regionId ? ({ id: data.regionId } as any) : null,
      landmarks: data.landmarks,
      dominantHand: data.dominantHand,
    });

    return this.signRecordingRepository.saveWithLandmarksUpdate(
      recording,
      data.regionId,
    );
  }
}
