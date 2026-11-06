import { HAND_MODEL, POSE_MODEL, VISION_WASM } from "./signDetection";
import {
  toVisionFrameResults,
  type VisionFrameResults,
  type VisionWorkerRequest,
  type VisionWorkerResponse,
} from "./visionWorkerProtocol";

export type VisionWorkerClient = {
  detect(bitmap: ImageBitmap, timestampMs: number): Promise<VisionFrameResults>;
  close(): void;
};

/** Subconjunto de Worker que usa el cliente; inyectable en tests. */
export type VisionWorkerLike = {
  postMessage(message: VisionWorkerRequest, transfer?: Transferable[]): void;
  terminate(): void;
  onmessage: ((event: { data: VisionWorkerResponse }) => void) | null;
  onerror: ((event: unknown) => void) | null;
};

export type VisionWorkerClientOptions = {
  /** Límite por frame. Pasado, el frame se descarta y el llamador decide. */
  detectTimeoutMs?: number;
  /** Descarga de modelos y WASM; si falla, el llamador usa el hilo principal. */
  initTimeoutMs?: number;
  createWorker?: () => VisionWorkerLike;
};

const DEFAULT_DETECT_TIMEOUT_MS = 1000;
const DEFAULT_INIT_TIMEOUT_MS = 30_000;

export function isVisionWorkerSupported(): boolean {
  return typeof Worker !== "undefined" && typeof createImageBitmap === "function";
}

type Pending = {
  resolve: (response: VisionWorkerResponse) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};

/**
 * Cliente de `vision.worker.ts`. Cualquier fallo al iniciar (sin Worker, modelo
 * que no baja, timeout) rechaza la promesa para que el llamador use MediaPipe en
 * el hilo principal, como hoy.
 */
export async function createVisionWorkerClient(
  options: VisionWorkerClientOptions = {},
): Promise<VisionWorkerClient> {
  const worker: VisionWorkerLike = options.createWorker
    ? options.createWorker()
    : (new Worker(new URL("../workers/vision.worker.ts", import.meta.url), {
        type: "module",
      }) as unknown as VisionWorkerLike);

  const pending = new Map<number, Pending>();
  let nextId = 1;
  let closed = false;

  const settle = (id: number, outcome: (entry: Pending) => void) => {
    const entry = pending.get(id);
    if (!entry) return;
    pending.delete(id);
    clearTimeout(entry.timer);
    outcome(entry);
  };

  worker.onmessage = (event) => {
    const response = event.data;
    settle(response.id, (entry) => {
      if (response.type === "error") {
        entry.reject(new Error(response.message));
      } else {
        entry.resolve(response);
      }
    });
  };

  worker.onerror = () => {
    for (const id of [...pending.keys()]) {
      settle(id, (entry) => entry.reject(new Error("vision worker crashed")));
    }
  };

  const send = (
    message: VisionWorkerRequest,
    timeoutMs: number,
    transfer: Transferable[] = [],
  ): Promise<VisionWorkerResponse> =>
    new Promise((resolve, reject) => {
      if (closed) {
        reject(new Error("vision worker closed"));
        return;
      }
      const timer = setTimeout(() => {
        settle(message.id, (entry) =>
          entry.reject(new Error(`vision worker timed out (${message.type})`)),
        );
      }, timeoutMs);
      pending.set(message.id, { resolve, reject, timer });
      worker.postMessage(message, transfer);
    });

  const close = () => {
    if (closed) return;
    closed = true;
    for (const id of [...pending.keys()]) {
      settle(id, (entry) => entry.reject(new Error("vision worker closed")));
    }
    worker.terminate();
  };

  try {
    const ready = await send(
      {
        type: "init",
        id: nextId++,
        wasmPath: VISION_WASM,
        poseModelPath: POSE_MODEL,
        handModelPath: HAND_MODEL,
      },
      options.initTimeoutMs ?? DEFAULT_INIT_TIMEOUT_MS,
    );
    if (ready.type !== "ready") {
      throw new Error("vision worker failed to initialize");
    }
  } catch (error) {
    close();
    throw error;
  }

  const detectTimeoutMs = options.detectTimeoutMs ?? DEFAULT_DETECT_TIMEOUT_MS;
  return {
    async detect(bitmap, timestampMs) {
      const response = await send(
        { type: "detect", id: nextId++, bitmap, timestampMs },
        detectTimeoutMs,
        [bitmap],
      );
      if (response.type !== "result") {
        throw new Error("unexpected vision worker response");
      }
      return toVisionFrameResults(response);
    },
    close,
  };
}
