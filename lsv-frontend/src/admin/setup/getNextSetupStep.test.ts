import { describe, expect, it } from "vitest";
import {
  buildSetupSteps,
  getNextSetupStep,
} from "./getNextSetupStep";

describe("getNextSetupStep", () => {
  it("starts with language when none exist", () => {
    expect(getNextSetupStep(false)).toBe("language");
  });

  it("asks for stages after language", () => {
    expect(
      getNextSetupStep(true, {
        stageCount: 0,
        regionCount: 0,
        lessonCount: 0,
        moderatorCount: 0,
      }),
    ).toBe("stages");
  });

  it("asks for regions after stages", () => {
    expect(
      getNextSetupStep(true, {
        stageCount: 2,
        regionCount: 0,
        lessonCount: 0,
        moderatorCount: 0,
      }),
    ).toBe("regions");
  });

  it("asks for lessons after regions even without moderators", () => {
    expect(
      getNextSetupStep(true, {
        stageCount: 1,
        regionCount: 1,
        lessonCount: 0,
        moderatorCount: 0,
      }),
    ).toBe("lessons");
  });

  it("marks setup done when required content exists", () => {
    expect(
      getNextSetupStep(true, {
        stageCount: 1,
        regionCount: 1,
        lessonCount: 1,
        moderatorCount: 0,
      }),
    ).toBe("done");
  });
});

describe("buildSetupSteps", () => {
  it("locks lessons until stages exist", () => {
    const steps = buildSetupSteps(true, {
      stageCount: 0,
      regionCount: 1,
      lessonCount: 0,
      moderatorCount: 0,
    });
    expect(steps.find((step) => step.id === "lessons")?.locked).toBe(true);
    expect(steps.find((step) => step.id === "stages")?.current).toBe(true);
  });

  it("includes optional moderators after regions", () => {
    const steps = buildSetupSteps(true, {
      stageCount: 1,
      regionCount: 1,
      lessonCount: 0,
      moderatorCount: 0,
    });
    const moderators = steps.find((step) => step.id === "moderators");
    expect(moderators?.optional).toBe(true);
    expect(moderators?.locked).toBe(false);
    expect(moderators?.done).toBe(false);
  });
});
