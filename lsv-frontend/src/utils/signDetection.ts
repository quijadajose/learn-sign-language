import * as tf from "@tensorflow/tfjs";
import { resampleSequence } from "./resampling";
import {
  PoseLandmarker,
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
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
export const DETECTION_INTERVAL_MS = 33;
export const CONFIDENCE_THRESHOLD = 0.75;
/** One-shot + 1 reintento explícito en examen dinámico */
export const MAX_DYNAMIC_EXAM_ATTEMPTS = 2;
/**
 * Movimiento entre frames por debajo del cual la pose se considera estable.
 * Suma la forma de la mano y la trayectoria del brazo: ver `measureHandMotion`.
 */
export const HAND_MOTION_THRESHOLD = 1.5;
/** Frames estables consecutivos antes de empezar a capturar señas estáticas */
export const STABLE_FRAMES_TO_START = 6;
/** Frames en reposo antes de iniciar captura dinámica (~300 ms @ 30 fps) */
export const REST_FRAMES_TO_START = 10;
/** Frames en reposo para cerrar captura dinámica (~500 ms @ 30 fps) */
export const REST_FRAMES_TO_END = 15;
/** Máximo de frames sin detección de mano antes de abortar (forward fill) */
export const MAX_FORWARD_FILL_FRAMES = 5;
/** Mínimo de frames de movimiento tras segmentación para considerar el gesto válido */
export const MIN_GESTURE_FRAMES = 10;
/** Mínimo de frames reales antes de inferir (las muestras de entrenamiento suelen tener 10–16) */
export const MIN_CAPTURE_FRAMES = 10;
/** Objetivo al grabar estáticas en Sign Studio (auto-corte tras estabilidad) */
export const TARGET_CAPTURE_FRAMES = 12;
/** Tope de frames de movimiento en dinámicas; si se excede, se aborta el intento */
export const MAX_DYNAMIC_CAPTURE_FRAMES = 90;
/**
 * Contrato de features soportado:
 * - static-v2: MLP 202D (1 frame) con pose escalado por ancho de hombros
 * - dynamic-v3: LSTM 340D con deltas de manos y de brazos → resample
 *
 * Se sigue capturando y guardando el frame completo de 258D; los 202D salen de
 * `selectPoseLandmarks`, que descarta los landmarks de pierna y los puntos de
 * mano gruesos del pose.
 *
 * Las versiones previas se rechazan en la carga: el escalado del pose cambia la
 * distribución de entrada de los dos modelos, así que un `static-v1` o un
 * `dynamic-v2` predeciría sobre features que nunca vio. No hay fallback por
 * `featuresCount`, porque un modelo sin versión explícita es anterior a este
 * bump por definición.
 */
export const UNSUPPORTED_SCHEMA_MESSAGE =
  "Este modelo usa un esquema de features anterior (el pose ahora se escala por " +
  "ancho de hombros). Reentrena el modelo para poder usarlo.";

export function isSupportedStaticSchema(
  featuresSchemaVersion?: string | null,
  featuresCount?: number | null,
): boolean {
  return (
    featuresSchemaVersion === FEATURES_SCHEMA_STATIC &&
    (featuresCount == null || featuresCount === STATIC_FEATURES_COUNT)
  );
}

export function isSupportedDynamicSchema(
  featuresSchemaVersion?: string | null,
  featuresCount?: number | null,
): boolean {
  return (
    featuresSchemaVersion === FEATURES_SCHEMA_DYNAMIC &&
    (featuresCount == null || featuresCount === DYNAMIC_FEATURES_COUNT)
  );
}

/**
 * Para los flujos que prueban un modelo sin saber de antemano si es estático o
 * dinámico: basta con que la versión sea una de las dos vigentes.
 */
export function isSupportedSchemaVersion(
  featuresSchemaVersion?: string | null,
): boolean {
  return (
    featuresSchemaVersion === FEATURES_SCHEMA_STATIC ||
    featuresSchemaVersion === FEATURES_SCHEMA_DYNAMIC
  );
}

/** Cuántos frames reales capturar antes de inferir (alineado con muestras cortas + padding). */
export function minFramesBeforeInference(sequenceLength: number): number {
  return Math.min(14, Math.max(MIN_CAPTURE_FRAMES, Math.floor(sequenceLength * 0.5)));
}
/** Ventana de inferencias recientes (~330 ms @ 30 fps) */
export const INFERENCE_VOTE_WINDOW = 10;
/** Cuántas inferencias en esa ventana deben superar el umbral (permite pausas en señas con movimiento) */
export const INFERENCE_VOTE_REQUIRED = 6;

/** Served from /public (Vite) / nginx; WASM is copied from node_modules at build. */
export const VISION_WASM = "/mediapipe/wasm";
export const POSE_MODEL = "/mediapipe/models/pose_landmarker_heavy.task";
export const HAND_MODEL = "/mediapipe/models/hand_landmarker.task";

type Landmark = { x: number; y: number; z: number; visibility?: number };

export type RawLandmark = { x: number; y: number; z: number };

export type RawHandFrame = {
  pose: RawLandmark[] | null;
  leftHand: RawLandmark[] | null;
  rightHand: RawLandmark[] | null;
};

export type TimestampRef = { current: number };

/** Timestamp monótono para MediaPipe detectForVideo (unificado en todo el frontend). */
export function nextMediaPipeTimestamp(ref: TimestampRef): number {
  let ts = performance.now();
  if (ts <= ref.current) {
    ts = ref.current + 1;
  }
  ref.current = ts;
  return ts;
}

export type ForwardFillState = {
  lastValid: RawHandFrame | null;
  consecutiveMisses: number;
};

export function createForwardFillState(): ForwardFillState {
  return { lastValid: null, consecutiveMisses: 0 };
}

function cloneRawHandFrame(frame: RawHandFrame): RawHandFrame {
  return {
    pose: frame.pose?.map((p) => ({ ...p })) ?? null,
    leftHand: frame.leftHand?.map((p) => ({ ...p })) ?? null,
    rightHand: frame.rightHand?.map((p) => ({ ...p })) ?? null,
  };
}

/**
 * Repite la última pose válida cuando MediaPipe pierde la mano brevemente.
 * Si el gap supera MAX_FORWARD_FILL_FRAMES, aborted=true y el gesto debe reiniciarse.
 */
export function forwardFillHandLandmarks(
  state: ForwardFillState,
  detected: RawHandFrame | null,
  handVisible: boolean,
): {
  frame: RawHandFrame | null;
  state: ForwardFillState;
  aborted: boolean;
  filled: boolean;
} {
  if (handVisible && detected) {
    const frame = cloneRawHandFrame(detected);
    return {
      frame,
      state: { lastValid: frame, consecutiveMisses: 0 },
      aborted: false,
      filled: false,
    };
  }

  if (!state.lastValid) {
    return {
      frame: null,
      state: { ...state, consecutiveMisses: state.consecutiveMisses + 1 },
      aborted: false,
      filled: false,
    };
  }

  const nextMisses = state.consecutiveMisses + 1;
  if (nextMisses > MAX_FORWARD_FILL_FRAMES) {
    return {
      frame: null,
      state: createForwardFillState(),
      aborted: true,
      filled: false,
    };
  }

  return {
    frame: cloneRawHandFrame(state.lastValid),
    state: { ...state, consecutiveMisses: nextMisses },
    aborted: false,
    filled: true,
  };
}

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

  tick(flat: number[] | null, handVisible: boolean): GesturePhaseTickResult {
    this.pendingCompletion = null;

    if (!handVisible || !flat) {
      this.lastFlat = null;
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
      return this.tickDynamic(flat);
    }
    return this.tickStatic(flat);
  }

  private abortDynamicTooLong(): GesturePhaseTickResult {
    this.movementBuffer = [];
    this.phase = "arming";
    this.restFrameCount = 0;
    this.isArmed = false;
    this.lastFlat = null;
    return {
      phase: this.phase,
      completedGesture: null,
      captureCount: 0,
      abortedTooLong: true,
    };
  }

  private tickDynamic(flat: number[]): GesturePhaseTickResult {
    const prev = this.lastFlat;
    this.lastFlat = flat;
    const motion = prev ? measureHandMotion(prev, flat) : 0;
    const isRest = motion <= HAND_MOTION_THRESHOLD;

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

  private tickStatic(flat: number[]): GesturePhaseTickResult {
    const prev = this.lastFlat;
    this.lastFlat = flat;

    if (!prev) {
      this.phase = "stabilizing";
      this.restFrameCount = 0;
      return {
        phase: this.phase,
        completedGesture: null,
        captureCount: this.movementBuffer.length,
      };
    }

    const motion = measureHandMotion(prev, flat);
    const isStable = motion <= HAND_MOTION_THRESHOLD;

    if (this.phase === "waiting") {
      this.phase = "stabilizing";
    }

    if (!isStable) {
      this.restFrameCount = 0;
      this.movementBuffer = [];
      this.phase = "stabilizing";
    } else {
      this.restFrameCount += 1;
      if (this.restFrameCount >= STABLE_FRAMES_TO_START) {
        this.phase = "capturing";
        this.movementBuffer.push(flat);
        if (this.movementBuffer.length > TARGET_CAPTURE_FRAMES) {
          this.movementBuffer.shift();
        }
      } else {
        this.phase = "stabilizing";
      }
    }

    return {
      phase: this.phase,
      completedGesture: null,
      captureCount: this.movementBuffer.length,
    };
  }
}

function normalizeHandLocal(handRaw: Landmark[] | null): number[] {
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

/**
 * Retorna true si MediaPipe detectó al menos una mano en el frame actual.
 * HandLandmarker solo incluye un elemento en landmarks[] si la mano está presente.
 */
export function isHandVisible(
  leftHandRaw: Landmark[] | null,
  rightHandRaw: Landmark[] | null,
): boolean {
  return leftHandRaw !== null || rightHandRaw !== null;
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

export function toRawHandFrame(
  poseRaw: Landmark[] | null,
  leftHandRaw: Landmark[] | null,
  rightHandRaw: Landmark[] | null,
): RawHandFrame | null {
  if (!isHandVisible(leftHandRaw, rightHandRaw)) return null;
  return {
    pose: poseRaw ? poseRaw.map((p) => ({ x: p.x, y: p.y, z: p.z })) : null,
    leftHand: leftHandRaw
      ? leftHandRaw.map((p) => ({ x: p.x, y: p.y, z: p.z }))
      : null,
    rightHand: rightHandRaw
      ? rightHandRaw.map((p) => ({ x: p.x, y: p.y, z: p.z }))
      : null,
  };
}

export type ProcessedHandFrame = {
  flat: number[] | null;
  raw: RawHandFrame | null;
  handVisible: boolean;
  forwardFillState: ForwardFillState;
  fillAborted: boolean;
  filled: boolean;
};

/** Aplica forward fill y devuelve el vector flat listo para el detector de fases. */
export function processHandFrameWithForwardFill(
  state: ForwardFillState,
  poseRaw: Landmark[] | null,
  leftHandRaw: Landmark[] | null,
  rightHandRaw: Landmark[] | null,
): ProcessedHandFrame {
  const detected = toRawHandFrame(poseRaw, leftHandRaw, rightHandRaw);
  const handVisible = detected !== null;
  const { frame, state: nextState, aborted, filled } = forwardFillHandLandmarks(
    state,
    detected,
    handVisible,
  );

  if (!frame) {
    return {
      flat: null,
      raw: null,
      handVisible: false,
      forwardFillState: nextState,
      fillAborted: aborted,
      filled: false,
    };
  }

  const flat = landmarksToFlatVector(
    (frame.pose ?? null) as Landmark[] | null,
    (frame.leftHand ?? null) as Landmark[] | null,
    (frame.rightHand ?? null) as Landmark[] | null,
  );

  return {
    flat: flat.length === FEATURES_COUNT ? flat : null,
    raw: frame,
    handVisible: true,
    forwardFillState: nextState,
    fillAborted: aborted,
    filled,
  };
}

/** Fases de UI compartidas entre Studio, Exam y Tester. */
export type UiCapturePhase =
  | "waiting"
  | "arming"
  | "stabilizing"
  | "collecting"
  | "closing"
  | "analyzing"
  | "complete";

export function mapGesturePhaseToUi(phase: GesturePhase): UiCapturePhase {
  switch (phase) {
    case "arming":
      return "arming";
    case "stabilizing":
      return "stabilizing";
    case "capturing":
      return "collecting";
    case "closing":
      return "closing";
    case "complete":
      return "complete";
    default:
      return "waiting";
  }
}

export function drawDetectionOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  poseRaw: NormalizedLandmark[] | null,
  leftHandRaw: NormalizedLandmark[] | null,
  rightHandRaw: NormalizedLandmark[] | null,
) {
  ctx.clearRect(0, 0, width, height);
  const drawingUtils = new DrawingUtils(ctx);
  if (poseRaw) {
    drawingUtils.drawConnectors(poseRaw, PoseLandmarker.POSE_CONNECTIONS, {
      color: "rgba(255,255,255,0.3)",
      lineWidth: 1,
    });
  }
  if (leftHandRaw) {
    drawingUtils.drawConnectors(leftHandRaw, HandLandmarker.HAND_CONNECTIONS, {
      color: "#F87171",
      lineWidth: 2,
    });
  }
  if (rightHandRaw) {
    drawingUtils.drawConnectors(rightHandRaw, HandLandmarker.HAND_CONNECTIONS, {
      color: "#4ADE80",
      lineWidth: 2,
    });
  }
}

export type HandLandmarkResults = {
  landmarks?: NormalizedLandmark[][];
  handedness?: Array<Array<{ categoryName?: string }>>;
};

/** Separa landmarks Left/Right a partir del resultado de HandLandmarker. */
export function pickHandLandmarks(handResults: HandLandmarkResults): {
  leftHandRaw: NormalizedLandmark[] | null;
  rightHandRaw: NormalizedLandmark[] | null;
} {
  const leftHandRaw =
    handResults.landmarks?.find(
      (_, i) => handResults.handedness?.[i]?.[0]?.categoryName === "Left",
    ) || null;
  const rightHandRaw =
    handResults.landmarks?.find(
      (_, i) => handResults.handedness?.[i]?.[0]?.categoryName === "Right",
    ) || null;
  return { leftHandRaw, rightHandRaw };
}

export type VisionDetectFrameResult = {
  flat: number[] | null;
  raw: RawHandFrame | null;
  handVisible: boolean;
  fillAborted: boolean;
  filled: boolean;
  forwardFillState: ForwardFillState;
  poseRaw: NormalizedLandmark[] | null;
  leftHandRaw: NormalizedLandmark[] | null;
  rightHandRaw: NormalizedLandmark[] | null;
};

/**
 * Un frame de MediaPipe + forward-fill. Compartido por Exam, Studio y Tester.
 * Si `canvas` se pasa, dibuja el overlay de esqueleto.
 */
export async function detectVisionFrame(options: {
  video: HTMLVideoElement;
  poseLandmarker: PoseLandmarker;
  handLandmarker: HandLandmarker;
  timestampRef: TimestampRef;
  forwardFillState: ForwardFillState;
  canvas?: HTMLCanvasElement | null;
}): Promise<VisionDetectFrameResult | null> {
  const {
    video,
    poseLandmarker,
    handLandmarker,
    timestampRef,
    forwardFillState,
    canvas,
  } = options;

  if (video.readyState < 2 || video.videoWidth === 0) return null;

  const startTimeMs = nextMediaPipeTimestamp(timestampRef);
  const [poseResults, handResults] = await Promise.all([
    poseLandmarker.detectForVideo(video, startTimeMs),
    handLandmarker.detectForVideo(video, startTimeMs),
  ]);

  const poseRaw = poseResults.landmarks?.[0] || null;
  const { leftHandRaw, rightHandRaw } = pickHandLandmarks(handResults);

  if (canvas) {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      drawDetectionOverlay(
        ctx,
        canvas.width,
        canvas.height,
        poseRaw,
        leftHandRaw,
        rightHandRaw,
      );
    }
  }

  const processed = processHandFrameWithForwardFill(
    forwardFillState,
    poseRaw,
    leftHandRaw,
    rightHandRaw,
  );

  return {
    flat: processed.flat,
    raw: processed.raw,
    handVisible: processed.handVisible,
    fillAborted: processed.fillAborted,
    filled: processed.filled,
    forwardFillState: processed.forwardFillState,
    poseRaw,
    leftHandRaw,
    rightHandRaw,
  };
}

export async function createVisionLandmarkers(): Promise<{
  pose: PoseLandmarker;
  hands: HandLandmarker;
}> {
  const vision = await FilesetResolver.forVisionTasks(VISION_WASM);

  const createWithDelegate = async (delegate: "GPU" | "CPU") => {
    const [pose, hands] = await Promise.all([
      PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: POSE_MODEL, delegate },
        runningMode: "VIDEO",
      }),
      HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: HAND_MODEL, delegate },
        runningMode: "VIDEO",
        numHands: 2,
      }),
    ]);
    return { pose, hands };
  };

  try {
    return await createWithDelegate("GPU");
  } catch {
    return await createWithDelegate("CPU");
  }
}

export function closeVisionLandmarkers(
  pose?: PoseLandmarker | null,
  hands?: HandLandmarker | null,
) {
  try {
    pose?.close();
  } catch {
    /* already closed */
  }
  try {
    hands?.close();
  } catch {
    /* already closed */
  }
}

export function resolveTrustedModelUrl(
  modelJsonUrl: string,
  backendBaseUrl: string,
  pageOrigin: string,
): string {
  if (!/^https?:\/\//i.test(modelJsonUrl)) {
    const base = backendBaseUrl.endsWith("/")
      ? backendBaseUrl.slice(0, -1)
      : backendBaseUrl;
    const path = modelJsonUrl.startsWith("/")
      ? modelJsonUrl
      : `/${modelJsonUrl}`;
    return `${base}${path}`;
  }
  const modelOrigin = new URL(modelJsonUrl).origin;
  const backendOrigin = new URL(backendBaseUrl, pageOrigin).origin;
  const page = new URL(pageOrigin).origin;
  if (modelOrigin !== backendOrigin && modelOrigin !== page) {
    throw new Error("Untrusted model URL");
  }
  return modelJsonUrl;
}

export async function loadTfModelFromUrl(
  modelJsonUrl: string,
  backendBaseUrl: string,
): Promise<{
  model: tf.LayersModel;
  sequenceLength: number;
  featuresCount: number;
  modelType: "static" | "dynamic";
}> {
  const pageOrigin =
    typeof window !== "undefined" ? window.location.origin : backendBaseUrl;
  const modelUrl = resolveTrustedModelUrl(
    modelJsonUrl,
    backendBaseUrl,
    pageOrigin,
  );

  const { getMemoryAccessToken } = await import("../services/api");
  const token = getMemoryAccessToken();
  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};
  const requestInit: RequestInit = {
    credentials: "include",
    headers: authHeaders,
  };

  const response = await fetch(modelUrl, requestInit);
  if (!response.ok) {
    throw new Error(
      `No se pudo cargar el modelo (${response.status}): ${modelUrl}`,
    );
  }
  const modelJson = await response.json();

  let sequenceLength = 30;
  let featuresCount = FEATURES_COUNT;
  let modelType: "static" | "dynamic" = "dynamic";

  try {
    const layers =
      modelJson.modelTopology?.model_config?.config?.layers ||
      modelJson.modelTopology?.config?.layers;
    if (layers?.length > 0) {
      const shape =
        layers[0].config?.batch_input_shape ||
        layers[0].config?.batchInputShape ||
        layers[0].config?.shape;
      if (shape?.length === 2 && shape[1] !== null) {
        modelType = "static";
        sequenceLength = 1;
        featuresCount = shape[1];
      } else if (shape?.length >= 3) {
        modelType = "dynamic";
        if (shape[shape.length - 2] !== null) {
          sequenceLength = shape[shape.length - 2];
        }
        if (shape[shape.length - 1] !== null) {
          featuresCount = shape[shape.length - 1];
        }
      }
    }
  } catch {
    /* usar valores por defecto */
  }

  // Only same-origin / backend URLs reach here; cookie + in-memory Bearer.
  const model = await tf.loadLayersModel(
    tf.io.browserHTTPRequest(modelUrl, {
      requestInit,
    }),
  );
  return { model, sequenceLength, featuresCount, modelType };
}

export type LessonModelPayload = {
  id: string;
  name?: string;
  modelJsonUrl: string;
  labels?: string[];
  modelType?: "static" | "dynamic";
  featuresCount?: number;
  featuresSchemaVersion?: string | null;
};

export type LessonModelsBundle = {
  static: LessonModelPayload | null;
  dynamic: LessonModelPayload | null;
};

export type LoadedLessonModels = {
  static: {
    model: tf.LayersModel;
    labels: string[];
    featuresCount: number;
  } | null;
  dynamic: {
    model: tf.LayersModel;
    labels: string[];
    sequenceLength: number;
    featuresCount: number;
  } | null;
};

async function loadStaticLessonModel(
  payload: LessonModelPayload,
  backendBaseUrl: string,
): Promise<NonNullable<LoadedLessonModels["static"]>> {
  if (
    !isSupportedStaticSchema(payload.featuresSchemaVersion, payload.featuresCount)
  ) {
    throw new Error(UNSUPPORTED_SCHEMA_MESSAGE);
  }
  const loaded = await loadTfModelFromUrl(payload.modelJsonUrl, backendBaseUrl);
  const featuresCount = payload.featuresCount ?? loaded.featuresCount;
  if (featuresCount !== STATIC_FEATURES_COUNT) {
    loaded.model.dispose();
    throw new Error(
      `Modelo estático incompatible: se esperaban ${STATIC_FEATURES_COUNT} features, hay ${featuresCount}.`,
    );
  }
  return {
    model: loaded.model,
    labels: payload.labels || [],
    featuresCount,
  };
}

async function loadDynamicLessonModel(
  payload: LessonModelPayload,
  backendBaseUrl: string,
): Promise<NonNullable<LoadedLessonModels["dynamic"]>> {
  if (
    !isSupportedDynamicSchema(payload.featuresSchemaVersion, payload.featuresCount)
  ) {
    throw new Error(UNSUPPORTED_SCHEMA_MESSAGE);
  }

  const loaded = await loadTfModelFromUrl(payload.modelJsonUrl, backendBaseUrl);
  const featuresCount = payload.featuresCount ?? loaded.featuresCount;
  if (featuresCount !== DYNAMIC_FEATURES_COUNT) {
    loaded.model.dispose();
    throw new Error(
      `Modelo dinámico incompatible: se esperaban ${DYNAMIC_FEATURES_COUNT} features, hay ${featuresCount}.`,
    );
  }
  return {
    model: loaded.model,
    labels: payload.labels || [],
    sequenceLength: loaded.sequenceLength,
    featuresCount,
  };
}

export async function loadLessonModelsFromApi(
  payload: LessonModelsBundle,
  backendBaseUrl: string,
): Promise<LoadedLessonModels> {
  const result: LoadedLessonModels = { static: null, dynamic: null };

  const disposeLoaded = () => {
    result.static?.model.dispose();
    result.static = null;
    result.dynamic?.model.dispose();
    result.dynamic = null;
  };

  try {
    if (payload.static?.modelJsonUrl) {
      result.static = await loadStaticLessonModel(
        payload.static,
        backendBaseUrl,
      );
    }
    if (payload.dynamic?.modelJsonUrl) {
      result.dynamic = await loadDynamicLessonModel(
        payload.dynamic,
        backendBaseUrl,
      );
    }
    return result;
  } catch (error) {
    disposeLoaded();
    throw error;
  }
}

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


/**
 * Movimiento entre dos frames: forma de la mano más trayectoria del brazo.
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
export function measureHandMotion(prev: number[], next: number[]): number {
  let handMotion = 0;
  for (let i = HAND_FEATURE_START; i < FEATURES_COUNT; i++) {
    handMotion += Math.abs(next[i] - prev[i]);
  }

  // Escala por frame en vez de normalizePoseScale: esto corre a 30 fps dentro
  // del loop de captura y no vale la pena copiar dos vectores de 258 por frame.
  const prevScale = poseScaleFactor(prev);
  const nextScale = poseScaleFactor(next);
  let armMotion = 0;
  for (const index of VELOCITY_POSE_INDICES) {
    armMotion += Math.abs(next[index] / nextScale - prev[index] / prevScale);
  }

  return handMotion + ARM_MOTION_WEIGHT * armMotion;
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

/**
 * Índices xyz de los landmarks de pose cuya velocidad se añade en dynamic-v3,
 * sobre el frame capturado de 258D. Los usa `measureHandMotion`, que corre
 * antes del recorte.
 */
const VELOCITY_POSE_INDICES = VELOCITY_POSE_LANDMARKS.flatMap((landmark) =>
  [0, 1, 2].map((axis) => landmark * POSE_VALUES_PER_LANDMARK + axis),
);

/** Posición de cada landmark de MediaPipe dentro del vector recortado. */
const MODEL_POSE_SLOT = new Map<number, number>(
  MODEL_POSE_LANDMARKS.map((landmark, slot) => [landmark, slot]),
);

/** Los mismos índices, pero sobre el layout recortado que ve el modelo. */
const MODEL_VELOCITY_POSE_INDICES = VELOCITY_POSE_LANDMARKS.flatMap((landmark) =>
  [0, 1, 2].map(
    (axis) => (MODEL_POSE_SLOT.get(landmark) as number) * POSE_VALUES_PER_LANDMARK + axis,
  ),
);

export const POSE_VELOCITY_FEATURES = VELOCITY_POSE_INDICES.length;

/** Dónde empiezan los bloques de mano una vez recortado el pose. */
export const MODEL_HAND_FEATURE_START =
  MODEL_POSE_LANDMARKS.length * POSE_VALUES_PER_LANDMARK;

const SELECT_INDICES = [
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
 * Peso del bloque de brazo dentro de `measureHandMotion`.
 *
 * El bloque de mano suma 126 dimensiones y el de brazo 12, así que sin peso las
 * manos dominarían la métrica por un factor de diez. Con 126/12 las dos partes
 * contribuyen lo mismo por dimensión, lo que deja `HAND_MOTION_THRESHOLD` con
 * aproximadamente el significado que ya tenía para gestos de mano.
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
 * Prepara secuencia para el LSTM (solo dynamic-v3 / 340D):
 * escala de pose → recorte de landmarks → deltas sobre frames reales →
 * resample a T (alineado con `normalize_pose_scale` + `select_pose_landmarks` +
 * `sequence_to_dynamic` + `resample_sequence` del trainer).
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

  const withVelocity = appendVelocityToSequence(flats);
  if (withVelocity.length === sequenceLength) return withVelocity;
  return resampleSequence(withVelocity, sequenceLength);
}

export type ModelPrediction = {
  scores: number[];
  topLabel: string;
  topScore: number;
  targetLabel?: string;
  targetScore: number;
};

/**
 * La escala de pose y el recorte de landmarks van acá dentro para que ningún
 * caller pueda olvidarlos: recibe el frame capturado de 258D.
 */
export function runStaticModelInference(
  model: tf.LayersModel,
  frame: number[],
  labels: string[],
  targetLabel?: string,
): ModelPrediction {
  return tf.tidy(() => {
    const input = tf.tensor2d([selectPoseLandmarks(normalizePoseScale(frame))]);
    const predictionTensor = model.predict(input) as tf.Tensor;
    const scores = Array.from(predictionTensor.dataSync() as Float32Array);

    const topIdx = scores.indexOf(Math.max(...scores));
    const targetIdx = targetLabel
      ? labels.findIndex((l) => l.toLowerCase() === targetLabel.toLowerCase())
      : -1;

    return {
      scores,
      topLabel: labels[topIdx] ?? `Clase ${topIdx}`,
      topScore: scores[topIdx] ?? 0,
      targetLabel,
      targetScore: targetIdx !== -1 ? scores[targetIdx] : 0,
    };
  });
}

export function runModelInference(
  model: tf.LayersModel,
  buffer: number[][],
  labels: string[],
  targetLabel?: string,
): ModelPrediction {
  return tf.tidy(() => {
    const input = tf.tensor3d([buffer]);
    const predictionTensor = model.predict(input) as tf.Tensor;
    const scores = Array.from(predictionTensor.dataSync() as Float32Array);

    const topIdx = scores.indexOf(Math.max(...scores));
    const targetIdx = targetLabel
      ? labels.findIndex((l) => l.toLowerCase() === targetLabel.toLowerCase())
      : -1;

    return {
      scores,
      topLabel: labels[topIdx] ?? `Clase ${topIdx}`,
      topScore: scores[topIdx] ?? 0,
      targetLabel,
      targetScore: targetIdx !== -1 ? scores[targetIdx] : 0,
    };
  });
}

export function applyPredictionToVotes(
  prediction: ModelPrediction,
  votesRef: { current: number[] },
  onSuccess: () => void,
): number {
  const votes = votesRef.current;
  votes.push(prediction.targetScore >= CONFIDENCE_THRESHOLD ? 1 : 0);
  if (votes.length > INFERENCE_VOTE_WINDOW) {
    votes.shift();
  }
  const hitCount = votes.reduce((sum, v) => sum + v, 0);
  if (hitCount >= INFERENCE_VOTE_REQUIRED) {
    onSuccess();
  }
  return hitCount;
}
