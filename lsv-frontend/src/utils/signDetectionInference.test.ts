import { describe, expect, it, vi } from "vitest";
import {
  CONFIDENCE_THRESHOLD,
  INFERENCE_VOTE_REQUIRED,
  applyPredictionToVotes,
  summarizePrediction,
  type ModelPrediction,
} from "./signDetectionInference";

const prediction = (targetScore: number): ModelPrediction => ({
  scores: [targetScore],
  topLabel: "x",
  topScore: targetScore,
  targetLabel: "x",
  targetScore,
});

describe("summarizePrediction", () => {
  it("picks the top label and the target score", () => {
    const result = summarizePrediction([0.1, 0.7, 0.2], ["a", "b", "c"], "C");
    expect(result.topLabel).toBe("b");
    expect(result.topScore).toBeCloseTo(0.7);
    expect(result.targetLabel).toBe("C");
    expect(result.targetScore).toBeCloseTo(0.2);
  });

  it("falls back to a generic label when the labels list is short", () => {
    const result = summarizePrediction([0.1, 0.9], ["a"]);
    expect(result.topLabel).toBe("Clase 1");
    expect(result.targetScore).toBe(0);
  });
});

describe("applyPredictionToVotes", () => {
  it("counts only predictions above the confidence threshold", () => {
    const votes = { current: [] as number[] };
    const onSuccess = vi.fn();
    const hits = applyPredictionToVotes(prediction(CONFIDENCE_THRESHOLD), votes, onSuccess);
    expect(hits).toBe(1);
    applyPredictionToVotes(prediction(0.1), votes, onSuccess);
    expect(votes.current).toEqual([1, 0]);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it("fires onSuccess once enough votes are reached", () => {
    const votes = { current: [] as number[] };
    const onSuccess = vi.fn();
    for (let i = 0; i < INFERENCE_VOTE_REQUIRED; i++) {
      applyPredictionToVotes(prediction(1), votes, onSuccess);
    }
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });
});
