import { describe, expect, it } from "vitest";
import { BACKEND_BASE_URL, getSocketIoClientOptions } from "./config";

describe("getSocketIoClientOptions", () => {
  it("matches the API base used by the SPA", () => {
    const options = getSocketIoClientOptions();
    if (/^https?:\/\//i.test(BACKEND_BASE_URL)) {
      expect(options.path).toBe("/socket.io");
    } else {
      expect(options.path).toBe("/api/socket.io");
      expect(options.url).toBe(window.location.origin);
    }
  });
});
