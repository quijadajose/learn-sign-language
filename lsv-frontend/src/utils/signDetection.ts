import * as tf from "@tensorflow/tfjs";
import {
  PoseLandmarker,
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { FEATURES_COUNT } from "./ml-feature-contract.generated";

// Contrato de esquema y carga de modelos viven en módulos propios (FE-10);
// se reexportan para no cambiar los imports existentes.
export * from "./signDetectionSchema";
export * from "./signDetectionModels";
export * from "./signDetectionForwardFill";
export * from "./signDetectionGesture";
export * from "./signDetectionFeatures";
import { selectPoseLandmarks } from "./signDetectionFeatures";
import {
  GesturePhase,
  Landmark,
  landmarksToFlatVector,
  normalizePoseScale,
} from "./signDetectionGesture";

import {
  forwardFillHandLandmarks,
  nextMediaPipeTimestamp,
  type ForwardFillState,
  type RawHandFrame,
  type TimestampRef,
} from "./signDetectionForwardFill";

import type { VisionWorkerClient } from "./visionWorkerClient";
export const DETECTION_INTERVAL_MS = 33;
export const CONFIDENCE_THRESHOLD = 0.75;
/** One-shot + 1 reintento explícito en examen dinámico */
export const MAX_DYNAMIC_EXAM_ATTEMPTS = 2;
/** Mínimo de frames reales antes de inferir (las muestras de entrenamiento suelen tener 10–16) */
export const MIN_CAPTURE_FRAMES = 10;
/** Cuántos frames reales capturar antes de inferir (alineado con muestras cortas + padding). */
export function minFramesBeforeInference(sequenceLength: number): number {
  return Math.min(14, Math.max(MIN_CAPTURE_FRAMES, Math.floor(sequenceLength * 0.5)));
}
/** Ventana de inferencias recientes (~330 ms @ 30 fps) */
export const INFERENCE_VOTE_WINDOW = 10;
/** Cuántas inferencias en esa ventana deben superar el umbral (permite pausas en señas con movimiento) */
export const INFERENCE_VOTE_REQUIRED = 6;

/** Served from /public (Vite) / nginx. WASM is copied from node_modules; models are downloaded at Vite startup. */
export const VISION_WASM = "/mediapipe/wasm";
export const POSE_MODEL = "/mediapipe/models/pose_landmarker_heavy.task";
export const HAND_MODEL = "/mediapipe/models/hand_landmarker.task";

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
type FrameDetections = {
  poseResults: { landmarks?: NormalizedLandmark[][] };
  handResults: HandLandmarkResults;
};

async function detectOnMainThread(
  poseLandmarker: PoseLandmarker,
  handLandmarker: HandLandmarker,
  video: HTMLVideoElement,
  startTimeMs: number,
): Promise<FrameDetections> {
  const [poseResults, handResults] = await Promise.all([
    poseLandmarker.detectForVideo(video, startTimeMs),
    handLandmarker.detectForVideo(video, startTimeMs),
  ]);
  return { poseResults, handResults };
}

/** FE-07: la inferencia corre en el worker; el bitmap se transfiere, no se copia. */
async function detectOnWorker(
  visionWorker: VisionWorkerClient,
  video: HTMLVideoElement,
  startTimeMs: number,
): Promise<FrameDetections> {
  const bitmap = await createImageBitmap(video);
  return visionWorker.detect(bitmap, startTimeMs);
}

export async function detectVisionFrame(options: {
  video: HTMLVideoElement;
  poseLandmarker: PoseLandmarker;
  handLandmarker: HandLandmarker;
  timestampRef: TimestampRef;
  forwardFillState: ForwardFillState;
  canvas?: HTMLCanvasElement | null;
  /** Si viene, la inferencia corre en el worker (ver visionWorkerClient). */
  visionWorker?: VisionWorkerClient | null;
}): Promise<VisionDetectFrameResult | null> {
  const {
    video,
    poseLandmarker,
    handLandmarker,
    timestampRef,
    forwardFillState,
    canvas,
    visionWorker,
  } = options;

  if (video.readyState < 2 || video.videoWidth === 0) return null;

  const startTimeMs = nextMediaPipeTimestamp(timestampRef);
  const { poseResults, handResults } = visionWorker
    ? await detectOnWorker(visionWorker, video, startTimeMs)
    : await detectOnMainThread(poseLandmarker, handLandmarker, video, startTimeMs);

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
