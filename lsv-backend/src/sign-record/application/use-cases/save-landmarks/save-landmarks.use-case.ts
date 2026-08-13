import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Sign } from 'src/shared/domain/entities/sign';
import { Region } from 'src/shared/domain/entities/region';
import { SignRecordingRepositoryInterface } from 'src/sign-record/domain/ports/sign-recording.repository.interface';
import { SignRepositoryInterface } from 'src/sign-record/domain/ports/sign.repository.interface';
import { SaveLandmarksDto } from 'src/sign-record/domain/dto/sign-record.dto';
import {
  assertValidLandmarkFrames,
  computeHandConfidence,
  isRecordingValidated,
  LandmarkValidationError,
} from 'src/sign-record/domain/utils/landmark-validation';
import { withI18nParams } from 'src/i18n';

@Injectable()
export class SaveLandmarksUseCase {
  constructor(
    @Inject('SignRecordingRepositoryInterface')
    private readonly signRecordingRepository: SignRecordingRepositoryInterface,
    @Inject('SignRepositoryInterface')
    private readonly signRepository: SignRepositoryInterface,
  ) {}

  async execute(data: SaveLandmarksDto) {
    const sign = await this.signRepository.findById(data.signId);
    if (!sign) {
      throw new NotFoundException('Seña no encontrada');
    }

    try {
      assertValidLandmarkFrames(data.landmarks);
    } catch (err: unknown) {
      if (err instanceof LandmarkValidationError) {
        throw new BadRequestException(
          withI18nParams(err.i18nKey, err.i18nParams ?? {}),
        );
      }
      const message = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(message);
    }

    const handConfidence = computeHandConfidence(data.landmarks);
    const recording = this.signRecordingRepository.create({
      sign: { id: data.signId } as Sign,
      region: data.regionId ? ({ id: data.regionId } as Region) : null,
      landmarks: data.landmarks,
      dominantHand: data.dominantHand,
      handConfidence,
      isValidated: isRecordingValidated(data.landmarks),
    });

    return this.signRecordingRepository.saveWithLandmarksUpdate(
      recording,
      data.regionId,
    );
  }
}
