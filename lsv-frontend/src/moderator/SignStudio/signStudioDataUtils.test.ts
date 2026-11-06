import { describe, expect, it } from "vitest";
import {
  buildTrainingFilters,
  nextSortState,
  type TrainingFilterInput,
} from "./signStudioDataUtils";

const input: TrainingFilterInput = {
  signs: [{ id: "s1" }, { id: "s2" }],
  selectedLessonId: "lesson-1",
  selectedStageId: "stage-1",
  selectedLanguageId: "lang-1",
  selectedRegionId: "region-1",
  selectedTrainingSignIds: ["s2"],
};

describe("nextSortState", () => {
  it("activates a new column in ascending order", () => {
    expect(nextSortState({ key: "name", direction: "desc" }, "createdAt")).toEqual({
      key: "createdAt",
      direction: "asc",
    });
  });

  it("flips the direction when the same column is clicked again", () => {
    expect(nextSortState({ key: "name", direction: "asc" }, "name")).toEqual({
      key: "name",
      direction: "desc",
    });
    expect(nextSortState({ key: "name", direction: "desc" }, "name")).toEqual({
      key: "name",
      direction: "asc",
    });
  });
});

describe("buildTrainingFilters", () => {
  it("lesson mode uses every sign of the lesson plus lesson, stage and language", () => {
    expect(buildTrainingFilters("lesson", input)).toEqual({
      signIds: ["s1", "s2"],
      lessonId: "lesson-1",
      stageId: "stage-1",
      languageId: "lang-1",
    });
  });

  it("stage mode filters by the selected stage", () => {
    expect(buildTrainingFilters("stage", input)).toEqual({
      stageIds: ["stage-1"],
      stageId: "stage-1",
      languageId: "lang-1",
    });
  });

  it("language mode filters by language and region", () => {
    expect(buildTrainingFilters("language", input)).toEqual({
      languageId: "lang-1",
      regionId: "region-1",
    });
  });

  it("selection mode uses only the chosen signs", () => {
    expect(buildTrainingFilters("selection", input)).toEqual({
      signIds: ["s2"],
      languageId: "lang-1",
    });
  });

  it("selection mode without chosen signs returns null", () => {
    expect(
      buildTrainingFilters("selection", { ...input, selectedTrainingSignIds: [] }),
    ).toBeNull();
  });
});
