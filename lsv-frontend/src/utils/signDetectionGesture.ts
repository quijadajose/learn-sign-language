/**
 * Detector de fases de gesto y movimiento de manos (FE-10).
 * Extraído de signDetection.ts; signDetection lo reexporta.
 */
import type { RawHandFrame, RawLandmark } from "./signDetectionForwardFill";
import {
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
} from "./ml-feature-contract.generated";

export type SignDetectionType = "static" | "dynamic";

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
};

export const POSE_LANDMARKS = 33;

export const POSE_VALUES_PER_LANDMARK = 4;

export const HAND_FEATURE_START = POSE_LANDMARKS * POSE_VALUES_PER_LANDMARK;

export const LEFT_SHOULDER = 11;

export const RIGHT_SHOULDER = 12;

/** Por debajo de esto el ancho de hombros es ruido (o el pose llegó en cero). */
export const POSE_SCALE_EPSILON = 1e-6;

/**
 * Forma de la mano (xy, sin brazo) por debajo de la cual una seña estática
 * cuenta como quieta. El umbral anterior (1.5 sobre xyz+brazo) nunca se
 * cumplía con jitter real de MediaPipe: Sign Studio se quedaba en
 * «Mano OK — mantén la pose (0/N)» sin pasar a grabar.
 */
export const HAND_SHAPE_STILL_THRESHOLD = 4;

/**
 * Reposo dinámico: forma de la mano + trayectoria del brazo.
 * Más alto que el de estáticas porque el brazo va ponderado y el pose trepida.
 */
export const HAND_MOTION_THRESHOLD = 8;

/**
 * Reposo dinámico medido en landmarks crudos (muñeca en imagen + forma xy).
 * El L1 del 258D no separa jitter de un gesto: o nunca arma, o nunca cierra.
 */
export const RAW_GESTURE_REST_THRESHOLD = 5;

/** Peso de la muñeca en imagen dentro de `measureRawGestureMotion`. */
export const RAW_WRIST_MOTION_WEIGHT = 80;

/** Frames estables consecutivos antes de empezar a capturar señas estáticas */
export const STABLE_FRAMES_TO_START = 6;

/** Frames en reposo antes de iniciar captura dinámica (~300 ms @ 30 fps) */
export const REST_FRAMES_TO_START = 10;

/** Frames en reposo para cerrar captura dinámica (~500 ms @ 30 fps) */
export const REST_FRAMES_TO_END = 15;

/** Mínimo de frames de movimiento tras segmentación para considerar el gesto válido */
export const MIN_GESTURE_FRAMES = 10;

/** Objetivo al grabar estáticas en Sign Studio (auto-corte tras estabilidad) */
export const TARGET_CAPTURE_FRAMES = 12;

/** Tope de frames de movimiento en dinámicas; si se excede, se aborta el intento */
export const MAX_DYNAMIC_CAPTURE_FRAMES = 90;

export type Landmark = { x: number; y: number; z: number; visibility?: number };

export type GesturePhase =
  | "waiting"
  | "arming"
  | "stabilizing"
  | "capturing"
  | "closing"
  | "complete";

export type GesturePhaseTickResult = {
  phase: GesturePhase;
  /** Secuencia de movimiento lista (solo dinámicas; sin frames de reposo). */
  completedGesture: number[][] | null;
  captureCount: number;
  /** True si el gesto dinámico superó MAX_DYNAMIC_CAPTURE_FRAMES. */
  abortedTooLong?: boolean;
};

/**
 * Detector de fases para segmentación temporal en el pipeline de captura.
 * Dinámicas: reposo → movimiento → reposo. Solo el núcleo de movimiento va al buffer.
 */
export class GesturePhaseDetector {
  private phase: GesturePhase = "waiting";
  private lastFlat: number[] | null = null;
  private lastRaw: RawHandFrame | null = null;
  private restFrameCount = 0;
  private isArmed = false;
  private movementBuffer: number[][] = [];
  private pendingCompletion: number[][] | null = null;

  constructor(private detectionType: SignDetectionType = "static") {}

  getPhase(): GesturePhase {
    return this.phase;
  }

  setDetectionType(type: SignDetectionType): void {
    if (type !== this.detectionType) {
      this.detectionType = type;
      this.reset();
    }
  }

  /** Frames consecutivos en reposo/estabilidad (útil para UI). */
  getRestFrameCount(): number {
    return this.restFrameCount;
  }

  /** True tras completar reposo inicial en dinámicas. */
  isArmedForGesture(): boolean {
    return this.isArmed;
  }

  reset(): void {
    this.phase = "waiting";
    this.lastFlat = null;
    this.lastRaw = null;
    this.restFrameCount = 0;
    this.isArmed = false;
    this.movementBuffer = [];
    this.pendingCompletion = null;
  }

  /** Toma el gesto completado y reinicia para el siguiente intento. */
  consumeCompletedGesture(): number[][] | null {
    const gesture = this.pendingCompletion;
    this.pendingCompletion = null;
    this.reset();
    return gesture;
  }

  tick(
    flat: number[] | null,
    handVisible: boolean,
    raw?: RawHandFrame | null,
  ): GesturePhaseTickResult {
    this.pendingCompletion = null;

    if (!handVisible || !flat) {
      this.lastFlat = null;
      this.lastRaw = null;
      this.restFrameCount = 0;
      this.isArmed = false;
      if (this.phase !== "waiting" && this.phase !== "complete") {
        this.movementBuffer = [];
        this.phase = "waiting";
      }
      return {
        phase: this.phase,
        completedGesture: null,
        captureCount: this.movementBuffer.length,
      };
    }

    if (this.detectionType === "dynamic") {
      return this.tickDynamic(flat, raw ?? null);
    }
    this.lastRaw = raw ?? null;
    return this.tickStatic(flat);
  }

  private abortDynamicTooLong(): GesturePhaseTickResult {
    this.movementBuffer = [];
    this.phase = "arming";
    this.restFrameCount = 0;
    this.isArmed = false;
    this.lastFlat = null;
    this.lastRaw = null;
    return {
      phase: this.phase,
      completedGesture: null,
      captureCount: 0,
      abortedTooLong: true,
    };
  }

  private tickDynamic(
    flat: number[],
    raw: RawHandFrame | null,
  ): GesturePhaseTickResult {
    const prevFlat = this.lastFlat;
    const prevRaw = this.lastRaw;
    this.lastFlat = flat;
    this.lastRaw = raw;

    const isRest =
      prevRaw && raw
        ? measureRawGestureMotion(prevRaw, raw) <= RAW_GESTURE_REST_THRESHOLD
        : prevFlat
          ? isStillForCapture(prevFlat, flat, "dynamic")
          : true;

    switch (this.phase) {
      case "waiting":
        this.phase = "arming";
        this.restFrameCount = isRest ? 1 : 0;
        this.isArmed = false;
        break;

      case "arming":
        // Reposo → armado. La captura de movimiento arranca en el primer frame
        // con moción (no en el 10.º de reposo: si no, pasaríamos a closing vacío).
        if (this.isArmed && !isRest) {
          this.phase = "capturing";
          this.movementBuffer = [flat];
          this.restFrameCount = 0;
        } else if (isRest) {
          this.restFrameCount = Math.min(
            this.restFrameCount + 1,
            REST_FRAMES_TO_START,
          );
          if (this.restFrameCount >= REST_FRAMES_TO_START) {
            this.isArmed = true;
          }
        } else if (!this.isArmed) {
          this.restFrameCount = 0;
        }
        break;

      case "capturing":
        if (!isRest) {
          this.movementBuffer.push(flat);
          this.restFrameCount = 0;
          if (this.movementBuffer.length >= MAX_DYNAMIC_CAPTURE_FRAMES) {
            return this.abortDynamicTooLong();
          }
        } else {
          this.phase = "closing";
          this.restFrameCount = 1;
        }
        break;

      case "closing":
        if (!isRest) {
          this.phase = "capturing";
          this.movementBuffer.push(flat);
          this.restFrameCount = 0;
          if (this.movementBuffer.length >= MAX_DYNAMIC_CAPTURE_FRAMES) {
            return this.abortDynamicTooLong();
          }
        } else {
          this.restFrameCount += 1;
          if (this.restFrameCount >= REST_FRAMES_TO_END) {
            if (this.movementBuffer.length >= MIN_GESTURE_FRAMES) {
              this.pendingCompletion = [...this.movementBuffer];
              this.phase = "complete";
            } else {
              this.phase = "arming";
              this.movementBuffer = [];
              this.restFrameCount = 0;
              this.isArmed = false;
            }
          }
        }
        break;

      case "complete":
        break;
    }

    return {
      phase: this.phase,
      completedGesture: this.pendingCompletion,
      captureCount: this.movementBuffer.length,
    };
  }

  /**
   * Estática: basta con la mano a la vista N frames seguidos.
   *
   * El umbral de «quieto» sobre el vector 258D no sirve en cámara real: el
   * jitter de MediaPipe (z, escala muñeca–nudillo y etiquetas Left/Right que
   * parpadean) deja el contador en 0 y Sign Studio nunca graba. La consigna
   * «mantén la pose» sigue en la UI; el gate técnico es visibilidad continua.
   */
  private tickStatic(flat: number[]): GesturePhaseTickResult {
    const prev = this.lastFlat;
    this.lastFlat = flat;

    if (this.phase === "waiting" || !prev) {
      this.phase = "stabilizing";
    }

    this.restFrameCount = prev ? this.restFrameCount + 1 : 1;

    if (
      this.phase === "capturing" ||
      this.restFrameCount >= STABLE_FRAMES_TO_START
    ) {
      this.phase = "capturing";
      this.movementBuffer.push(flat);
      if (this.movementBuffer.length > TARGET_CAPTURE_FRAMES) {
        this.movementBuffer.shift();
      }
    } else {
      this.phase = "stabilizing";
    }

    return {
      phase: this.phase,
      completedGesture: null,
      captureCount: this.movementBuffer.length,
    };
  }
}

export function normalizeHandLocal(handRaw: Landmark[] | null): number[] {
  if (!handRaw || handRaw.length === 0) return Array(21 * 3).fill(0);

  const wrist = handRaw[0];      // WRIST
  const middleMcp = handRaw[9];  // MIDDLE_FINGER_MCP

  const scale = Math.sqrt(
    (middleMcp.x - wrist.x) ** 2 +
    (middleMcp.y - wrist.y) ** 2 +
    (middleMcp.z - wrist.z) ** 2
  ) || 1;

  return handRaw
    .map(kp => [
      (kp.x - wrist.x) / scale,
      (kp.y - wrist.y) / scale,
      (kp.z - wrist.z) / scale,
    ])
    .flat();
}

export function landmarksToFlatVector(
  poseRaw: Landmark[] | null,
  leftHandRaw: Landmark[] | null,
  rightHandRaw: Landmark[] | null,
): number[] {
  let chestX = 0;
  let chestY = 0;
  let chestZ = 0;
  if (poseRaw) {
    chestX = (poseRaw[11].x + poseRaw[12].x) / 2;
    chestY = (poseRaw[11].y + poseRaw[12].y) / 2;
    chestZ = (poseRaw[11].z + poseRaw[12].z) / 2;
  }

  const pose = (poseRaw || Array(33).fill({ x: 0, y: 0, z: 0 }))
    .map((p) => [p.x - chestX, p.y - chestY, p.z - chestZ, p.visibility || 0])
    .flat();
  const lh = normalizeHandLocal(leftHandRaw);
  const rh = normalizeHandLocal(rightHandRaw);

  return [...pose, ...lh, ...rh];
}

export type MeasureMotionOptions = {
  /** Si false, solo forma de la mano (señas estáticas). Default true. */
  includeArm?: boolean;
};

/**
 * Movimiento entre dos frames: forma de la mano más trayectoria del brazo.
 *
 * Solo xy: la z de MediaPipe trepida mucho más que el plano de imagen y, con
 * 21 landmarks por mano, ese ruido solo ya superaba el umbral de «quieto».
 *
 * Los bloques de mano llegan relativos a la muñeca, así que una seña hecha
 * desplazando el brazo con la mano en forma fija no movía un solo valor y se
 * leía como reposo: la captura dinámica no arrancaba nunca. El brazo se mide
 * sobre el pose escalado por ancho de hombros para que el umbral no dependa de
 * la distancia a la cámara.
 *
 * Solo afecta la segmentación, no la entrada del modelo, pero cambia qué se
 * captura: ver la nota de calibración en `ARM_MOTION_WEIGHT`.
 */
export function measureHandMotion(
  prev: number[],
  next: number[],
  options: MeasureMotionOptions = {},
): number {
  const includeArm = options.includeArm !== false;
  let handMotion = 0;
  for (let i = HAND_FEATURE_START; i < FEATURES_COUNT; i += 3) {
    handMotion += Math.abs(next[i] - prev[i]);
    handMotion += Math.abs(next[i + 1] - prev[i + 1]);
  }

  if (!includeArm) return handMotion;

  // Escala por frame en vez de normalizePoseScale: esto corre a 30 fps dentro
  // del loop de captura y no vale la pena copiar dos vectores de 258 por frame.
  const prevScale = poseScaleFactor(prev);
  const nextScale = poseScaleFactor(next);
  let armMotion = 0;
  for (const landmark of VELOCITY_POSE_LANDMARKS) {
    const base = landmark * POSE_VALUES_PER_LANDMARK;
    for (const axis of [0, 1]) {
      const index = base + axis;
      armMotion += Math.abs(next[index] / nextScale - prev[index] / prevScale);
    }
  }

  return handMotion + ARM_MOTION_WEIGHT * armMotion;
}

/** ¿Este par de frames cuenta como reposo para arrancar o cortar la captura? */
export function isStillForCapture(
  prev: number[],
  next: number[],
  detectionType: SignDetectionType,
): boolean {
  if (detectionType === "static") {
    return (
      measureHandMotion(prev, next, { includeArm: false }) <=
      HAND_SHAPE_STILL_THRESHOLD
    );
  }
  return measureHandMotion(prev, next) <= HAND_MOTION_THRESHOLD;
}

export function handLandmarkEnergy(hand: RawLandmark[]): number {
  let energy = 0;
  for (const point of hand) {
    energy += Math.abs(point.x) + Math.abs(point.y);
  }
  return energy;
}

/** Mano con más señal; ignora el parpadeo Left/Right de MediaPipe. */
export function pickActiveRawHand(
  frame: RawHandFrame,
): RawLandmark[] | null {
  const left = frame.leftHand;
  const right = frame.rightHand;
  if (left && right) {
    return handLandmarkEnergy(left) >= handLandmarkEnergy(right) ? left : right;
  }
  return left || right;
}

/**
 * Movimiento de un gesto dinámico en coords de imagen: forma xy con una sola
 * escala + desplazamiento de la muñeca. Así el jitter no parece un gesto y un
 * barrido de brazo sí.
 */
export function measureRawGestureMotion(
  prev: RawHandFrame,
  next: RawHandFrame,
): number {
  const prevHand = pickActiveRawHand(prev);
  const nextHand = pickActiveRawHand(next);
  let handMotion = 0;
  if (prevHand && nextHand && prevHand.length >= 10 && nextHand.length >= 10) {
    const scale =
      Math.hypot(
        prevHand[9].x - prevHand[0].x,
        prevHand[9].y - prevHand[0].y,
      ) || 1e-3;
    const count = Math.min(prevHand.length, nextHand.length, 21);
    for (let i = 0; i < count; i++) {
      const px = (prevHand[i].x - prevHand[0].x) / scale;
      const py = (prevHand[i].y - prevHand[0].y) / scale;
      const nx = (nextHand[i].x - nextHand[0].x) / scale;
      const ny = (nextHand[i].y - nextHand[0].y) / scale;
      handMotion += Math.abs(nx - px) + Math.abs(ny - py);
    }
  }

  let wristTravel = 0;
  if (prevHand && nextHand) {
    wristTravel += Math.hypot(
      nextHand[0].x - prevHand[0].x,
      nextHand[0].y - prevHand[0].y,
    );
  }
  if (prev.pose && next.pose) {
    for (const index of [15, 16]) {
      const from = prev.pose[index];
      const to = next.pose[index];
      if (from && to) {
        wristTravel += Math.hypot(to.x - from.x, to.y - from.y);
      }
    }
  }

  return handMotion + RAW_WRIST_MOTION_WEIGHT * wristTravel;
}

/**
 * Índices xyz de los landmarks de pose cuya velocidad se añade desde dynamic-v3,
 * sobre el frame capturado de 258D. Los usa `measureHandMotion`, que corre
 * antes del recorte.
 */
export const VELOCITY_POSE_INDICES = VELOCITY_POSE_LANDMARKS.flatMap((landmark) =>
  [0, 1, 2].map((axis) => landmark * POSE_VALUES_PER_LANDMARK + axis),
);

export const POSE_VELOCITY_FEATURES = VELOCITY_POSE_INDICES.length;

/**
 * Peso del bloque de brazo dentro de `measureHandMotion`.
 *
 * El bloque de mano xy suma 84 dimensiones y el de brazo xy 8, así que sin peso
 * las manos dominarían. 84/8 deja las dos partes iguales por dimensión. El
 * valor numérico coincide con (126 xyz de mano) / (12 xyz de brazo) porque
 * al recortar z se recorta el mismo factor en ambos.
 *
 * Es un valor empírico, igual que el umbral: la normalización por ancho de
 * hombros divide por ~0.3 y por tanto amplifica el jitter de MediaPipe, así que
 * hay que comprobar con cámara que el reposo real siga por debajo del umbral.
 */
export const ARM_MOTION_WEIGHT =
  (FEATURES_COUNT - HAND_FEATURE_START) / POSE_VELOCITY_FEATURES;

/**
 * Ancho de hombros proyectado del frame.
 *
 * Se mide solo en el plano de imagen (x, y) porque es el tamaño aparente de la
 * persona, que es justo lo que cambia con la distancia a la cámara; sumar z
 * metería el ruido de la estimación de profundidad de MediaPipe.
 *
 * Es recuperable de cualquier 258D ya almacenado: `landmarksToFlatVector` centra
 * el pose en el punto medio de los hombros, así que resta el mismo `chest` a los
 * landmarks 11 y 12 y la distancia entre ellos se preserva.
 */
export function poseScaleFactor(frame: number[]): number {
  const left = LEFT_SHOULDER * POSE_VALUES_PER_LANDMARK;
  const right = RIGHT_SHOULDER * POSE_VALUES_PER_LANDMARK;
  const deltaX = frame[left] - frame[right];
  const deltaY = frame[left + 1] - frame[right + 1];
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  return distance > POSE_SCALE_EPSILON ? distance : 1;
}

/**
 * Divide el xyz del pose por el ancho de hombros, dejando visibility intacto.
 *
 * Vuelve el bloque de pose —y por tanto las velocidades que se derivan de él—
 * invariante a la distancia a la cámara. Las manos no se tocan: ya vienen
 * normalizadas por la distancia muñeca-nudillo.
 *
 * Es frame a frame a propósito: el modelo estático infiere sobre un frame
 * suelto, sin acceso al resto de la grabación, así que cualquier escala por
 * secuencia divergiría entre entrenamiento e inferencia. Espejo de
 * `normalize_pose_scale` en el trainer.
 */
export function normalizePoseScale(frame: number[]): number[] {
  const scale = poseScaleFactor(frame);
  const out = [...frame];
  for (let landmark = 0; landmark < POSE_LANDMARKS; landmark++) {
    const base = landmark * POSE_VALUES_PER_LANDMARK;
    out[base] /= scale;
    out[base + 1] /= scale;
    out[base + 2] /= scale;
  }
  return out;
}
