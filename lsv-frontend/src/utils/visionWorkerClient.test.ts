import { describe, expect, it } from "vitest";
import { createVisionWorkerClient, type VisionWorkerLike } from "./visionWorkerClient";
import type { VisionWorkerRequest, VisionWorkerResponse } from "./visionWorkerProtocol";

type Responder = (request: VisionWorkerRequest) => VisionWorkerResponse | null;

function fakeWorker(respond: Responder) {
  const state = { terminated: false, sent: [] as VisionWorkerRequest[] };
  const worker: VisionWorkerLike = {
    onmessage: null,
    onerror: null,
    postMessage(request) {
      state.sent.push(request);
      const reply = respond(request);
      if (reply) queueMicrotask(() => worker.onmessage?.({ data: reply }));
    },
    terminate() {
      state.terminated = true;
    },
  };
  return { worker, state };
}

const readyOnInit: Responder = (request) =>
  request.type === "init" ? { type: "ready", id: request.id } : null;

const fakeBitmap = { close: () => undefined } as unknown as ImageBitmap;

describe("createVisionWorkerClient", () => {
  it("maps the worker result into detectVisionFrame's shape", async () => {
    const { worker, state } = fakeWorker((request) =>
      request.type === "init"
        ? { type: "ready", id: request.id }
        : {
            type: "result",
            id: request.id,
            poseLandmarks: [[{ x: 0.1, y: 0.2, z: 0, visibility: 1 }]],
            handLandmarks: [],
            handedness: [[{ categoryName: "Left" }]],
          },
    );
    const client = await createVisionWorkerClient({ createWorker: () => worker });

    const results = await client.detect(fakeBitmap, 33);

    expect(results.poseResults.landmarks).toEqual([[{ x: 0.1, y: 0.2, z: 0, visibility: 1 }]]);
    expect(results.handResults.handedness).toEqual([[{ categoryName: "Left" }]]);
    expect(state.sent[1]).toMatchObject({ type: "detect", timestampMs: 33 });

    client.close();
    expect(state.terminated).toBe(true);
  });

  it("rejects a detect when the worker reports an error", async () => {
    const { worker } = fakeWorker((request) =>
      request.type === "init"
        ? { type: "ready", id: request.id }
        : { type: "error", id: request.id, message: "boom" },
    );
    const client = await createVisionWorkerClient({ createWorker: () => worker });

    await expect(client.detect(fakeBitmap, 1)).rejects.toThrow("boom");
    client.close();
  });

  it("times out a detect that the worker never answers", async () => {
    const { worker } = fakeWorker(readyOnInit);
    const client = await createVisionWorkerClient({
      createWorker: () => worker,
      detectTimeoutMs: 20,
    });

    await expect(client.detect(fakeBitmap, 1)).rejects.toThrow(/timed out/);
    client.close();
  });

  it("terminates the worker and rejects when initialization fails", async () => {
    const { worker, state } = fakeWorker((request) =>
      request.type === "init"
        ? { type: "error", id: request.id, message: "model download failed" }
        : null,
    );

    await expect(
      createVisionWorkerClient({ createWorker: () => worker }),
    ).rejects.toThrow("model download failed");
    expect(state.terminated).toBe(true);
  });

  it("rejects in-flight detections when closed", async () => {
    const { worker } = fakeWorker(readyOnInit);
    const client = await createVisionWorkerClient({ createWorker: () => worker });

    const pending = client.detect(fakeBitmap, 1);
    client.close();

    await expect(pending).rejects.toThrow(/closed/);
  });
});
