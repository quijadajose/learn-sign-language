import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Sign } from '../../../../shared/domain/entities/sign.js';
import { Region } from '../../../../shared/domain/entities/region.js';
import { SignRecordingRepositoryInterface } from '../../../domain/ports/sign-recording.repository.interface.js';
import { SignRepositoryInterface } from '../../../domain/ports/sign.repository.interface.js';
import { SaveLandmarksDto } from '../../../domain/dto/sign-record.dto.js';
import {
  assertValidLandmarkFrames,
  computeHandConfidence,
  isRecordingValidated,
  LandmarkValidationError,
} from '../../../domain/utils/landmark-validation.js';
import { withI18nParams } from '../../../../i18n/index.js';

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
      throw new NotFoundException('errors.sign.notFound');
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
