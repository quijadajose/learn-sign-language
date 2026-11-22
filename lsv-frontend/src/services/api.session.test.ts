import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import i18next from "i18next";
import ApiService, { markSessionActive } from "./api";

// AF-F6-02: solo un 401 cierra la sesión. Un fallo de red o un timeout no la cierra.

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("ApiService session handling (AF-F6-02)", () => {
  const sessionExpired = vi.fn<() => void>();
  const onSessionExpired = () => sessionExpired();

  beforeEach(() => {
    sessionExpired.mockReset();
    window.addEventListener("session-expired", onSessionExpired);
    markSessionActive(true);
  });

  afterEach(() => {
    window.removeEventListener("session-expired", onSessionExpired);
    markSessionActive(false);
    vi.unstubAllGlobals();
  });

  it("no cierra la sesión ante un fallo de red y avisa con el mensaje de conexión", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))),
    );

    const response = await ApiService.get("/users/me", { retries: 0 });

    expect(sessionExpired).not.toHaveBeenCalled();
    expect(response.success).toBe(false);
    expect(response.message).toBe(i18next.t("common:network.connection"));
  });

  it("no cierra la sesión ante un timeout de lectura", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(new DOMException("aborted", "AbortError"));
            });
          }),
      ),
    );

    const pending = ApiService.get("/users/me", { timeout: 1000 });
    await vi.advanceTimersByTimeAsync(1100);
    const response = await pending;

    expect(sessionExpired).not.toHaveBeenCalled();
    expect(response.message).toBe(i18next.t("common:network.timeout"));
    vi.useRealTimers();
  });

  it("cierra la sesión con un 401 de una petición autenticada", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve(jsonResponse({ message: "Unauthorized" }, 401)),
      ),
    );

    const response = await ApiService.get("/users/me", { retries: 0 });

    expect(sessionExpired).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(401);
  });
});
