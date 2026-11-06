import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLocalStorage } from "./useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns the initial value when nothing is stored", () => {
    const { result } = renderHook(() => useLocalStorage("k", "init"));
    expect(result.current[0]).toBe("init");
  });

  it("writes the stored value once per update and keeps state in sync", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(() => useLocalStorage<number>("n", 0));

    act(() => result.current[1](5));
    expect(result.current[0]).toBe(5);
    expect(window.localStorage.getItem("n")).toBe("5");
    expect(setItem).toHaveBeenCalledTimes(1);

    act(() => result.current[1]((prev) => prev + 1));
    expect(result.current[0]).toBe(6);
    expect(setItem).toHaveBeenCalledTimes(2);
    setItem.mockRestore();
  });

  it("does not write again when the value is unchanged", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(() => useLocalStorage<string>("s", "same"));
    act(() => result.current[1]("same"));
    expect(setItem).not.toHaveBeenCalled();
    setItem.mockRestore();
  });

  it("removes the key when set to null and falls back to the initial value", () => {
    const { result } = renderHook(() => useLocalStorage<string | null>("r", "x"));
    act(() => result.current[1]("saved"));
    act(() => result.current[1](null));
    expect(window.localStorage.getItem("r")).toBeNull();
    expect(result.current[0]).toBe("x");
  });
});
