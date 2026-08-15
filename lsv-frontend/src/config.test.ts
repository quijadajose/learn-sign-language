import { describe, expect, it } from "vitest";
import {
  BACKEND_BASE_URL,
  getSocketIoClientOptions,
  resolveSpaApiBase,
} from "./config";

describe("resolveSpaApiBase", () => {
  it("defaults to same-origin /api", () => {
    expect(resolveSpaApiBase(undefined)).toBe("/api");
    expect(resolveSpaApiBase("")).toBe("/api");
  });

  it("does not send the browser to localhost:3000", () => {
    expect(resolveSpaApiBase("http://localhost:3000")).toBe("/api");
    expect(resolveSpaApiBase("http://127.0.0.1:3000/")).toBe("/api");
  });

  it("keeps an explicit remote API URL", () => {
    expect(resolveSpaApiBase("https://api.example.com")).toBe(
      "https://api.example.com",
    );
  });
});

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
