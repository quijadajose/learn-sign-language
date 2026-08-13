import { Sign } from 'src/shared/domain/entities/sign';
import { SignRecording } from 'src/shared/domain/entities/signRecording';

export type TrainingSample = {
  signName: string;
  detectionType: 'static' | 'dynamic';
  isGlobal: boolean;
  landmarks: number[][];
};

export function serializeRecordingLandmarks(landmarks: unknown[]): number[][] {
  return landmarks.map((frame: unknown) => {
    if (Array.isArray(frame)) return frame as number[];
    if (frame && typeof frame === 'object' && 'flat' in frame) {
      return (frame as { flat: number[] }).flat;
    }
    return [];
  });
}

export function recordingsToTrainingSamples(
  recordings: SignRecording[],
): TrainingSample[] {
  return recordings.map((rec) => ({
    signName: rec.sign.name,
    detectionType: rec.sign.detectionType ?? 'static',
    isGlobal: rec.sign.isGlobal,
    landmarks: serializeRecordingLandmarks(rec.landmarks),
  }));
}

export function splitRecordingsForDualTraining(recordings: SignRecording[]): {
  staticRecordings: SignRecording[];
  dynamicRecordings: SignRecording[];
  globalStaticForDynamic: SignRecording[];
} {
  const staticRecordings: SignRecording[] = [];
  const dynamicRecordings: SignRecording[] = [];
  const globalStaticForDynamic: SignRecording[] = [];

  for (const rec of recordings) {
    const type = rec.sign.detectionType ?? 'static';
    if (type === 'dynamic') {
      dynamicRecordings.push(rec);
    } else {
      staticRecordings.push(rec);
      if (rec.sign.isGlobal) {
        globalStaticForDynamic.push(rec);
      }
    }
  }

  return { staticRecordings, dynamicRecordings, globalStaticForDynamic };
}

/** Recordings validados + landmarks legacy solo para señas aún sin sample. */
export function mergeValidatedWithLandmarkFallback(
  validatedRecordings: SignRecording[],
  signs: Sign[],
  regionId?: string,
): SignRecording[] {
  const coveredSignIds = new Set(
    validatedRecordings
      .map((rec) => rec.sign?.id)
      .filter((id): id is string => Boolean(id)),
  );

  const fallbacks = signs
    .filter((sign) => !coveredSignIds.has(sign.id))
    .map((sign) => {
      const variant = sign.variants?.find((v) => v.region?.id === regionId);
      const rawLandmarks = variant?.landmarks || sign.landmarks || [];
      if (!rawLandmarks.length) return null;
      return {
        sign,
        landmarks: rawLandmarks,
        isValidated: true,
      } as unknown as SignRecording;
    })
    .filter((item): item is SignRecording => Boolean(item));

  return [...validatedRecordings, ...fallbacks];
}
