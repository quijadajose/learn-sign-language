/** Re-export generated contract + validation helpers for landmarks. */
export {
  FEATURES_COUNT,
  STATIC_FEATURES_COUNT,
  DYNAMIC_FEATURES_COUNT,
  FIXED_DYNAMIC_SEQUENCE_LENGTH,
  FEATURES_SCHEMA_STATIC,
  FEATURES_SCHEMA_DYNAMIC,
  LEGACY_FEATURES_SCHEMA_STATIC,
  LEGACY_FEATURES_SCHEMA_DYNAMIC,
  MODEL_POSE_LANDMARKS,
  VELOCITY_POSE_LANDMARKS,
} from './ml-feature-contract.generated';

import {
  FEATURES_COUNT,
  STATIC_FEATURES_COUNT,
  DYNAMIC_FEATURES_COUNT,
  FEATURES_SCHEMA_STATIC,
  FEATURES_SCHEMA_DYNAMIC,
} from './ml-feature-contract.generated';

export const HAND_FEATURE_START = 33 * 4;
export const HAND_VALIDATION_THRESHOLD = 0.8;

/**
 * Lo que consume el modelo, no lo que se almacena: los dos difieren desde que
 * el pose se recorta antes de entrenar. `FEATURES_COUNT` sigue describiendo el
 * frame capturado y es lo que valida `assertValidLandmarkFrames`.
 */
export function featureMetadataForModelType(modelType: 'static' | 'dynamic'): {
  featuresCount: number;
  featuresSchemaVersion: string;
} {
  if (modelType === 'static') {
    return {
      featuresCount: STATIC_FEATURES_COUNT,
      featuresSchemaVersion: FEATURES_SCHEMA_STATIC,
    };
  }
  return {
    featuresCount: DYNAMIC_FEATURES_COUNT,
    featuresSchemaVersion: FEATURES_SCHEMA_DYNAMIC,
  };
}

/**
 * Un modelo entrenado con un contrato anterior predeciría sobre features que
 * nunca vio, así que no se sirve al frontend. Filtrarlo acá deja que el examen
 * caiga en el mensaje de "modelo aún no entrenado" en vez de romper al cargar
 * los pesos de TFJS.
 */
export function isSupportedSchemaVersion(
  featuresSchemaVersion?: string | null,
): boolean {
  return (
    featuresSchemaVersion === FEATURES_SCHEMA_STATIC ||
    featuresSchemaVersion === FEATURES_SCHEMA_DYNAMIC
  );
}

function frameFlat(frame: unknown): number[] | null {
  if (!frame) return null;
  if (Array.isArray(frame)) return frame as number[];
  if (typeof frame === 'object' && frame !== null && 'flat' in frame) {
    const flat = (frame as { flat: number[] }).flat;
    return Array.isArray(flat) ? flat : null;
  }
  return null;
}

export function frameHasHandData(frame: unknown): boolean {
  const flat = frameFlat(frame);
  if (!flat || flat.length !== FEATURES_COUNT) return false;
  for (let i = HAND_FEATURE_START; i < flat.length; i++) {
    if (Math.abs(flat[i]) > 0.001) return true;
  }
  return false;
}

/** Ratio of frames with active hand landmarks (0–1). */
export function computeHandConfidence(landmarks: unknown[]): number {
  if (!landmarks?.length) return 0;
  const withHands = landmarks.filter(frameHasHandData).length;
  return withHands / landmarks.length;
}

export function isRecordingValidated(landmarks: unknown[]): boolean {
  return computeHandConfidence(landmarks) >= HAND_VALIDATION_THRESHOLD;
}

/**
 * Ensures every frame is exactly FEATURES_COUNT numeric values.
 */
export class LandmarkValidationError extends Error {
  constructor(
    readonly i18nKey: string,
    readonly i18nParams?: Record<string, string | number>,
  ) {
    super(i18nKey);
    this.name = 'LandmarkValidationError';
  }
}

export function assertValidLandmarkFrames(landmarks: unknown[]): void {
  if (!Array.isArray(landmarks) || landmarks.length === 0) {
    throw new LandmarkValidationError('errors.landmarks.empty', {
      count: FEATURES_COUNT,
    });
  }
  for (let i = 0; i < landmarks.length; i++) {
    const flat = frameFlat(landmarks[i]);
    if (!flat || flat.length !== FEATURES_COUNT) {
      throw new LandmarkValidationError('errors.landmarks.invalidLength', {
        index: i,
        expected: FEATURES_COUNT,
        received: flat?.length ?? 0,
      });
    }
    if (!flat.every((n) => typeof n === 'number' && Number.isFinite(n))) {
      throw new LandmarkValidationError('errors.landmarks.invalidNumbers', {
        index: i,
      });
    }
  }
}
