import { describe, expect, it } from "vitest";
import { CEFR_LEVELS } from "./cefrPresets";

describe("cefrPresets", () => {
  it("includes A1 through C2", () => {
    expect(CEFR_LEVELS.map((level) => level.code)).toEqual([
      "A1",
      "A2",
      "B1",
      "B2",
      "C1",
      "C2",
    ]);
  });
});
