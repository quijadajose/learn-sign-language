/**
 * Construcción de features para los modelos: recorte de pose, velocidad y secuencia dinámica (FE-10). Lógica pura.
 */
import { resampleSequence } from "./resampling";
import {
  FEATURES_COUNT,
  MODEL_POSE_LANDMARKS,
  VELOCITY_POSE_LANDMARKS,
} from "./ml-feature-contract.generated";
import {
  HAND_FEATURE_START,
  POSE_VALUES_PER_LANDMARK,
  POSE_VELOCITY_FEATURES,
  normalizePoseScale,
} from "./signDetectionGesture";

export function normalizeTrainingFrame(frame: unknown): number[] {
  if (Array.isArray(frame)) return frame as number[];
  if (frame && typeof frame === "object" && "flat" in frame) {
    // `flat` es opcional en LandmarkFrame y `in` no distingue una clave presente
    // con valor nulo. Sin el guard, una grabación vieja tumba el render, porque
    // recordingHandFrameRatio corre dentro de componentes.
    const flat = (frame as { flat?: unknown }).flat;
    return Array.isArray(flat) ? (flat as number[]) : [];
  }
  return [];
}

export function frameHasHandData(frame: unknown): boolean {
  const flat = normalizeTrainingFrame(frame);
  if (flat.length !== FEATURES_COUNT) return false;
  for (let i = HAND_FEATURE_START; i < flat.length; i++) {
    if (Math.abs(flat[i]) > 0.001) return true;
  }
  return false;
}

export function recordingHandFrameRatio(frames: unknown[]): number {
  if (!frames?.length) return 0;
  return frames.filter(frameHasHandData).length / frames.length;
}

/** Posición de cada landmark de MediaPipe dentro del vector recortado. */
export const MODEL_POSE_SLOT = new Map<number, number>(
  MODEL_POSE_LANDMARKS.map((landmark, slot) => [landmark, slot]),
);

/** Los mismos índices, pero sobre el layout recortado que ve el modelo. */
export const MODEL_VELOCITY_POSE_INDICES = VELOCITY_POSE_LANDMARKS.flatMap((landmark) =>
  [0, 1, 2].map(
    (axis) => (MODEL_POSE_SLOT.get(landmark) as number) * POSE_VALUES_PER_LANDMARK + axis,
  ),
);

/** Dónde empiezan los bloques de mano una vez recortado el pose. */
export const MODEL_HAND_FEATURE_START =
  MODEL_POSE_LANDMARKS.length * POSE_VALUES_PER_LANDMARK;

export const SELECT_INDICES = [
  ...MODEL_POSE_LANDMARKS.flatMap((landmark) =>
    [0, 1, 2, 3].map((offset) => landmark * POSE_VALUES_PER_LANDMARK + offset),
  ),
  ...Array.from(
    { length: FEATURES_COUNT - HAND_FEATURE_START },
    (_, index) => HAND_FEATURE_START + index,
  ),
];

/**
 * Proyecta el frame 258D almacenado al subconjunto de pose que ven los modelos.
 *
 * MediaPipe emite siempre los 33 landmarks, aunque el encuadre sea de cintura
 * para arriba: rodillas, tobillos y pies llegan extrapolados y a veces con
 * `visibility` alta, así que son ruido con apariencia de señal. Los puntos de
 * mano del pose (17-22) son duplicados groseros de los bloques de mano, que ya
 * traen 21 landmarks por mano.
 *
 * Se recorta acá y no en la captura para que lo que se guarda conserve el frame
 * completo: cambiar el subconjunto no invalida ninguna grabación, solo obliga a
 * reentrenar. Espejo de `select_pose_landmarks` en el trainer.
 */
export function selectPoseLandmarks(frame: number[]): number[] {
  return SELECT_INDICES.map((index) => frame[index]);
}

/**
 * Convierte un frame ya recortado (202D) a 340D: velocidad de manos y de brazos.
 *
 * Los deltas de codos y muñecas se sacan del bloque de pose porque ahí es donde
 * está la trayectoria: los bloques de mano llegan relativos a la muñeca, así que
 * desplazar el brazo con la mano en forma fija no los mueve.
 */
export function frameToDynamic(
  frame: number[],
  prevFrame: number[] | null,
): number[] {
  const pose = frame.slice(0, MODEL_HAND_FEATURE_START);
  const hands = frame.slice(MODEL_HAND_FEATURE_START);
  const handDeltas = prevFrame
    ? hands.map(
        (value, index) => value - prevFrame[MODEL_HAND_FEATURE_START + index],
      )
    : Array(hands.length).fill(0);
  const poseDeltas = prevFrame
    ? MODEL_VELOCITY_POSE_INDICES.map((index) => frame[index] - prevFrame[index])
    : Array(POSE_VELOCITY_FEATURES).fill(0);
  return [...pose, ...hands, ...handDeltas, ...poseDeltas];
}

/** Espera frames ya recortados con `selectPoseLandmarks`. */
export function appendVelocityToSequence(frames: number[][]): number[][] {
  return frames.map((frame, index) =>
    frameToDynamic(frame, index > 0 ? frames[index - 1] : null),
  );
}

/**
 * Prepara secuencia para el LSTM (dynamic-v4 / 340D):
 * escala de pose → recorte de landmarks → resample a T → deltas (alineado con
 * `normalize_pose_scale` + `select_pose_landmarks` + `build_dynamic_sequence`
 * del trainer).
 *
 * Los deltas van después del resample para medir la velocidad en fracción del
 * gesto y no por frame de cámara: así la misma seña capturada a 15 o a 30 fps
 * produce el mismo vector.
 */
export function buildDynamicInferenceSequence(
  frames: unknown[],
  sequenceLength: number,
): number[][] | null {
  const flats: number[][] = [];
  for (const frame of frames) {
    const normalized = normalizeTrainingFrame(frame);
    if (normalized.length === FEATURES_COUNT) {
      flats.push(selectPoseLandmarks(normalizePoseScale(normalized)));
    }
  }
  if (flats.length === 0) return null;

  const resampled =
    flats.length === sequenceLength
      ? flats
      : resampleSequence(flats, sequenceLength);
  return appendVelocityToSequence(resampled);
}
