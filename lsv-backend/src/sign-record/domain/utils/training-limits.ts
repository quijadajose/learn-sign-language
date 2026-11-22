import { BadRequestException } from '@nestjs/common';

/**
 * BE-11: el trainer rechaza datasets demasiado grandes, pero eso solo se descubría
 * después de encolar y de cargar cientos de MB en memoria. Se comprueba antes.
 * Los límites coinciden con los del trainer (TRAINER_MAX_SAMPLES / TRAINER_MAX_FRAMES).
 */
const MAX_SAMPLES = Number(process.env.TRAINER_MAX_SAMPLES ?? 2000);
const MAX_FRAMES_PER_SAMPLE = Number(process.env.TRAINER_MAX_FRAMES ?? 600);

export function assertSampleCountWithinLimits(count: number): void {
  if (count > MAX_SAMPLES) {
    throw new BadRequestException('errors.model.tooManySamples');
  }
}

export function assertRecordingWithinFrameLimit(recording: {
  landmarks: unknown[];
}): void {
  if (recording.landmarks?.length > MAX_FRAMES_PER_SAMPLE) {
    throw new BadRequestException('errors.model.tooManyFrames');
  }
}

export function assertWithinTrainingLimits(
  recordings: { landmarks: unknown[] }[],
): void {
  assertSampleCountWithinLimits(recordings.length);
  for (const recording of recordings) {
    assertRecordingWithinFrameLimit(recording);
  }
}
