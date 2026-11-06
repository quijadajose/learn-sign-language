import { describe, expect, it } from "vitest";
import type { Region } from "./types";
import { hasBaseRegionForLanguage, toggleSetItem } from "./utils";

const region = (id: string, languageId: string, isDefault: boolean) =>
  ({
    id,
    name: id,
    code: id,
    description: "",
    isDefault,
    language: { id: languageId },
  }) as unknown as Region;

describe("hasBaseRegionForLanguage", () => {
  const regions = [region("r1", "es", false), region("r2", "en", true)];

  it("detects a base region for the language", () => {
    expect(hasBaseRegionForLanguage(regions, "en")).toBe(true);
  });

  it("returns false when the language only has non-base regions", () => {
    expect(hasBaseRegionForLanguage(regions, "es")).toBe(false);
  });

  it("returns false for missing or unknown language ids", () => {
    expect(hasBaseRegionForLanguage(regions, null)).toBe(false);
    expect(hasBaseRegionForLanguage(regions, undefined)).toBe(false);
    expect(hasBaseRegionForLanguage(regions, "fr")).toBe(false);
  });
});

describe("toggleSetItem", () => {
  it("adds an item that is not in the set", () => {
    const result = toggleSetItem(new Set(["a"]), "b");
    expect([...result].sort()).toEqual(["a", "b"]);
  });

  it("removes an item that is already in the set", () => {
    const result = toggleSetItem(new Set(["a", "b"]), "a");
    expect([...result]).toEqual(["b"]);
  });

  it("does not mutate the original set", () => {
    const original = new Set(["a"]);
    toggleSetItem(original, "a");
    expect([...original]).toEqual(["a"]);
  });
});
