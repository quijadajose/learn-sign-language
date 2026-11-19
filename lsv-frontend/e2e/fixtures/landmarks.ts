/** Mismo formato que validLandmarkFrames en lsv-backend/test/test-utils.ts (258 valores por frame). */
const FEATURES_COUNT = 258;
const HAND_FEATURE_START = 33 * 4;

/** Frames válidos con la mano activa (los valores de la mano a 1), para que la grabación se valide. */
export function validLandmarkFrames(frameCount = 2): number[][] {
  return Array.from({ length: frameCount }, () => {
    const flat = Array<number>(FEATURES_COUNT).fill(0);
    for (let i = HAND_FEATURE_START; i < FEATURES_COUNT; i += 1) {
      flat[i] = 1;
    }
    return flat;
  });
}
