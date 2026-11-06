import type { NormalizedLandmark } from "@mediapipe/tasks-vision";

/**
 * Protocolo de mensajes entre el hilo principal y `workers/vision.worker.ts` (FE-07).
 * Todo lo que cruza el worker es datos planos clonables: MediaPipe no se pasa.
 */
export type VisionHandedness = Array<Array<{ categoryName?: string }>>;

export type VisionInitRequest = {
  type: "init";
  id: number;
  wasmPath: string;
  poseModelPath: string;
  handModelPath: string;
};

export type VisionDetectRequest = {
  type: "detect";
  id: number;
  /** Se transfiere (no se copia): el hilo principal lo pierde al enviarlo. */
  bitmap: ImageBitmap;
  timestampMs: number;
};

export type VisionWorkerRequest = VisionInitRequest | VisionDetectRequest;

export type VisionWorkerResponse =
  | { type: "ready"; id: number }
  | {
      type: "result";
      id: number;
      poseLandmarks: NormalizedLandmark[][];
      handLandmarks: NormalizedLandmark[][];
      handedness: VisionHandedness;
    }
  | { type: "error"; id: number; message: string };

/** Forma que consume `detectVisionFrame`, igual a la de MediaPipe en modo VIDEO. */
export type VisionFrameResults = {
  poseResults: { landmarks: NormalizedLandmark[][] };
  handResults: { landmarks: NormalizedLandmark[][]; handedness: VisionHandedness };
};

export function toVisionFrameResults(
  response: Extract<VisionWorkerResponse, { type: "result" }>,
): VisionFrameResults {
  return {
    poseResults: { landmarks: response.poseLandmarks },
    handResults: {
      landmarks: response.handLandmarks,
      handedness: response.handedness,
    },
  };
}
