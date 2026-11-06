import { describe, expect, it } from "vitest";
import {
  MAX_FORWARD_FILL_FRAMES,
  createForwardFillState,
  forwardFillHandLandmarks,
  nextMediaPipeTimestamp,
  type RawHandFrame,
} from "./signDetectionForwardFill";

const point = (x: number) => ({ x, y: 0, z: 0 });

const frame: RawHandFrame = {
  pose: [point(1)],
  leftHand: [point(2)],
  rightHand: null,
};

describe("forwardFillHandLandmarks", () => {
  it("stores a visible frame as the last valid frame", () => {
    const result = forwardFillHandLandmarks(createForwardFillState(), frame, true);
    expect(result.filled).toBe(false);
    expect(result.aborted).toBe(false);
    expect(result.state.lastValid).toEqual(frame);
    expect(result.state.consecutiveMisses).toBe(0);
  });

  it("repeats the last valid frame on short gaps", () => {
    const seeded = forwardFillHandLandmarks(createForwardFillState(), frame, true);
    const result = forwardFillHandLandmarks(seeded.state, null, false);
    expect(result.filled).toBe(true);
    expect(result.frame).toEqual(frame);
    expect(result.state.consecutiveMisses).toBe(1);
  });

  it("does not share references with the input frame", () => {
    const result = forwardFillHandLandmarks(createForwardFillState(), frame, true);
    expect(result.frame).not.toBe(frame);
    expect(result.frame?.pose).not.toBe(frame.pose);
  });

  it("aborts once the gap exceeds the forward-fill limit", () => {
    let state = forwardFillHandLandmarks(createForwardFillState(), frame, true).state;
    for (let i = 0; i < MAX_FORWARD_FILL_FRAMES; i++) {
      state = forwardFillHandLandmarks(state, null, false).state;
    }
    const result = forwardFillHandLandmarks(state, null, false);
    expect(result.aborted).toBe(true);
    expect(result.frame).toBeNull();
    expect(result.state.lastValid).toBeNull();
  });

  it("returns no frame when nothing was ever detected", () => {
    const result = forwardFillHandLandmarks(createForwardFillState(), null, false);
    expect(result.frame).toBeNull();
    expect(result.aborted).toBe(false);
    expect(result.filled).toBe(false);
  });
});

describe("nextMediaPipeTimestamp", () => {
  it("returns strictly increasing timestamps", () => {
    const ref = { current: 1_000_000_000 };
    const first = nextMediaPipeTimestamp(ref);
    const second = nextMediaPipeTimestamp(ref);
    expect(second).toBeGreaterThan(first);
    expect(ref.current).toBe(second);
  });
});
