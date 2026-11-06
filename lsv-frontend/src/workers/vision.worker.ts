import {
  FilesetResolver,
  HandLandmarker,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import type {
  VisionDetectRequest,
  VisionHandedness,
  VisionInitRequest,
  VisionWorkerRequest,
  VisionWorkerResponse,
} from "../utils/visionWorkerProtocol";

// Sin `lib: webworker` (choca con DOM en este proyecto): tipamos el scope a mano.
type WorkerScope = {
  postMessage: (message: VisionWorkerResponse) => void;
  onmessage: ((event: MessageEvent<VisionWorkerRequest>) => void) | null;
};
const scope = self as unknown as WorkerScope;

let pose: PoseLandmarker | null = null;
let hands: HandLandmarker | null = null;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function initLandmarkers(request: VisionInitRequest): Promise<void> {
  const vision = await FilesetResolver.forVisionTasks(request.wasmPath);
  const create = async (delegate: "GPU" | "CPU") => {
    const [nextPose, nextHands] = await Promise.all([
      PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: request.poseModelPath, delegate },
        runningMode: "VIDEO",
      }),
      HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: request.handModelPath, delegate },
        runningMode: "VIDEO",
        numHands: 2,
      }),
    ]);
    pose = nextPose;
    hands = nextHands;
  };
  try {
    await create("GPU");
  } catch {
    await create("CPU");
  }
}

function detect(request: VisionDetectRequest): void {
  try {
    if (!pose || !hands) {
      throw new Error("vision worker not initialized");
    }
    const poseResults = pose.detectForVideo(request.bitmap, request.timestampMs);
    const handResults = hands.detectForVideo(request.bitmap, request.timestampMs);
    const handedness: VisionHandedness = (handResults.handedness ?? []).map(
      (hand) => hand.map((category) => ({ categoryName: category.categoryName })),
    );
    scope.postMessage({
      type: "result",
      id: request.id,
      poseLandmarks: poseResults.landmarks ?? [],
      handLandmarks: handResults.landmarks ?? [],
      handedness,
    });
  } catch (error) {
    scope.postMessage({ type: "error", id: request.id, message: errorMessage(error) });
  } finally {
    request.bitmap.close();
  }
}

scope.onmessage = (event) => {
  const request = event.data;
  if (request.type === "init") {
    initLandmarkers(request)
      .then(() => scope.postMessage({ type: "ready", id: request.id }))
      .catch((error: unknown) =>
        scope.postMessage({ type: "error", id: request.id, message: errorMessage(error) }),
      );
    return;
  }
  detect(request);
};
