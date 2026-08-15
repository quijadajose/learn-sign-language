import { afterEach, describe, expect, it } from "vitest";
import {
  clearAllStageSelections,
  clearStageSelectionForLanguage,
  stageSelectionStorageKeys,
} from "./learningStorage";

describe("learningStorage", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("builds per-language stage keys", () => {
    expect(stageSelectionStorageKeys("lang-1")).toEqual({
      stageId: "selectedStageId_lang-1",
      explicit: "selectedStageExplicit_lang-1",
    });
  });

  it("clears only the unenrolled language", () => {
    localStorage.setItem("selectedStageId_lang-1", "stage-a");
    localStorage.setItem("selectedStageExplicit_lang-1", "true");
    localStorage.setItem("selectedStageId_lang-2", "stage-b");
    localStorage.setItem("selectedLanguageId", "lang-2");

    clearStageSelectionForLanguage("lang-1");

    expect(localStorage.getItem("selectedStageId_lang-1")).toBeNull();
    expect(localStorage.getItem("selectedStageExplicit_lang-1")).toBeNull();
    expect(localStorage.getItem("selectedStageId_lang-2")).toBe("stage-b");
    expect(localStorage.getItem("selectedLanguageId")).toBe("lang-2");
  });

  it("clears every stage selection without touching UI prefs", () => {
    localStorage.setItem("selectedStageId_lang-1", "stage-a");
    localStorage.setItem("selectedStageId_lang-2", "stage-b");
    localStorage.setItem("selectedStageExplicit_lang-1", "true");
    localStorage.setItem("lsv.uiLocale", "es");
    localStorage.setItem("flowbite-theme-mode", "dark");
    localStorage.setItem("selectedLanguageId", "lang-1");

    clearAllStageSelections();

    expect(localStorage.getItem("selectedStageId_lang-1")).toBeNull();
    expect(localStorage.getItem("selectedStageId_lang-2")).toBeNull();
    expect(localStorage.getItem("selectedStageExplicit_lang-1")).toBeNull();
    expect(localStorage.getItem("lsv.uiLocale")).toBe("es");
    expect(localStorage.getItem("flowbite-theme-mode")).toBe("dark");
    expect(localStorage.getItem("selectedLanguageId")).toBe("lang-1");
  });
});
