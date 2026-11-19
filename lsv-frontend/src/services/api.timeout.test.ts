import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18next from "i18next";
import ApiService, {
  DEFAULT_REQUEST_TIMEOUT_MS,
  HEAVY_REQUEST_TIMEOUT_MS,
  signRecordApi,
} from "./api";

// FE-03: timeouts por petición en ApiService.

/** fetch que nunca responde y rechaza con AbortError cuando se aborta la señal. */
function hangingFetch() {
  return vi.fn(
    (_url: string, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          reject(new DOMException("aborted", "AbortError"));
        });
      }),
  );
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Permite consultar si una promesa ya se resolvió sin esperarla. */
function track<T>(promise: Promise<T>) {
  const state: { settled: boolean; value?: T } = { settled: false };
  void promise.then((value) => {
    state.settled = true;
    state.value = value;
  });
  return state;
}

const TIMEOUT_MSG = () => i18next.t("common:network.timeout");
const TIMEOUT_MAYBE_APPLIED_MSG = () =>
  i18next.t("common:network.timeoutMaybeApplied");

describe("ApiService timeouts (FE-03)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("aplica el límite por defecto de 10 s y no reintenta un GET abortado", async () => {
    const fetchMock = hangingFetch();
    vi.stubGlobal("fetch", fetchMock);

    const result = track(ApiService.get("/lessons"));

    await vi.advanceTimersByTimeAsync(DEFAULT_REQUEST_TIMEOUT_MS - 1);
    expect(result.settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(result.settled).toBe(true);
    expect(result.value).toEqual({ success: false, message: TIMEOUT_MSG() });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("respeta un timeout por petición más largo que el por defecto", async () => {
    vi.stubGlobal("fetch", hangingFetch());

    const result = track(
      ApiService.post("/heavy", { a: 1 }, { timeout: 30_000 }),
    );

    await vi.advanceTimersByTimeAsync(DEFAULT_REQUEST_TIMEOUT_MS + 1);
    expect(result.settled).toBe(false);

    await vi.advanceTimersByTimeAsync(30_000);
    expect(result.settled).toBe(true);
    // En un POST se avisa de que el servidor puede haberlo completado.
    expect(result.value).toEqual({
      success: false,
      message: TIMEOUT_MAYBE_APPLIED_MSG(),
    });
  });

  it("aborta si el cuerpo de la respuesta se queda atascado tras los headers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init?: RequestInit) => {
        const body = new ReadableStream<Uint8Array>({
          start(controller) {
            init?.signal?.addEventListener("abort", () => {
              controller.error(new DOMException("aborted", "AbortError"));
            });
          },
        });
        return Promise.resolve(
          new Response(body, {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
        );
      }),
    );

    const result = track(ApiService.get("/slow-body"));

    await vi.advanceTimersByTimeAsync(DEFAULT_REQUEST_TIMEOUT_MS);
    expect(result.settled).toBe(true);
    expect(result.value).toEqual({ success: false, message: TIMEOUT_MSG() });
  });

  it("limpia el temporizador cuando la respuesta llega a tiempo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(jsonResponse({ data: { ok: true } }))),
    );

    const res = await ApiService.get("/ok");

    expect(res.success).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("saveLandmarks usa el timeout largo y no falla a los 10 s", async () => {
    let resolveFetch: (r: Response) => void = () => {};
    const fetchMock = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          resolveFetch = resolve;
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = track(
      signRecordApi.saveLandmarks({
        signId: "s1",
        landmarks: [],
      } as unknown as Parameters<typeof signRecordApi.saveLandmarks>[0]),
    );

    // Con el límite global de 10 s esto ya habría sido un error.
    await vi.advanceTimersByTimeAsync(DEFAULT_REQUEST_TIMEOUT_MS * 3);
    expect(result.settled).toBe(false);

    resolveFetch(jsonResponse({ data: { id: "rec-1" } }, 201));
    await vi.advanceTimersByTimeAsync(0);

    expect(result.settled).toBe(true);
    expect(result.value?.success).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("triggerCustomTraining corta a los 60 s con un error claro y sin reintentar", async () => {
    const fetchMock = hangingFetch();
    vi.stubGlobal("fetch", fetchMock);

    const result = track(
      signRecordApi.triggerCustomTraining(
        {} as Parameters<typeof signRecordApi.triggerCustomTraining>[0],
      ),
    );

    await vi.advanceTimersByTimeAsync(HEAVY_REQUEST_TIMEOUT_MS - 1);
    expect(result.settled).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(result.value).toEqual({
      success: false,
      message: TIMEOUT_MAYBE_APPLIED_MSG(),
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("upload usa el timeout largo salvo que se indique otro", async () => {
    vi.stubGlobal("fetch", hangingFetch());
    const file = new File(["x"], "a.png", { type: "image/png" });

    const result = track(ApiService.upload("/images/upload/user", file));

    await vi.advanceTimersByTimeAsync(HEAVY_REQUEST_TIMEOUT_MS - 1);
    expect(result.settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(result.settled).toBe(true);

    const custom = track(
      ApiService.upload("/images/upload/user", file, {}, { timeout: 5_000 }),
    );
    await vi.advanceTimersByTimeAsync(5_000);
    expect(custom.settled).toBe(true);
  });
});
