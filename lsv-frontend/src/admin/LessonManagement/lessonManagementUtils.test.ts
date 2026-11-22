import { describe, expect, it } from "vitest";
import {
  isUuid,
  isVariantFormComplete,
  pickInitialLanguageId,
} from "./lessonManagementUtils";

const ID_A = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";
const ID_B = "7c9e6679-7425-40de-944b-e07fc1f90ae7";

describe("isUuid", () => {
  it("accepts a valid uuid", () => {
    expect(isUuid(ID_A)).toBe(true);
  });

  it("rejects empty, null and malformed values", () => {
    expect(isUuid("")).toBe(false);
    expect(isUuid(null)).toBe(false);
    expect(isUuid(undefined)).toBe(false);
    expect(isUuid("not-a-uuid")).toBe(false);
  });
});

describe("pickInitialLanguageId", () => {
  it("keeps the stored id when it is a valid uuid", () => {
    expect(pickInitialLanguageId(ID_A, [ID_B])).toBe(ID_A);
  });

  it("falls back to the first available language when the stored id is invalid", () => {
    expect(pickInitialLanguageId("bogus", [ID_B, ID_A])).toBe(ID_B);
    expect(pickInitialLanguageId(null, [ID_B])).toBe(ID_B);
  });

  it("returns null when there is nothing valid to select", () => {
    expect(pickInitialLanguageId(null, [])).toBeNull();
    expect(pickInitialLanguageId("bogus", [])).toBeNull();
  });
});

describe("isVariantFormComplete", () => {
  const complete = {
    name: "Variante",
    description: "Desc",
    content: "Contenido",
    regionId: ID_A,
  };

  it("accepts a fully filled form", () => {
    expect(isVariantFormComplete(complete)).toBe(true);
  });

  it("rejects blank text fields, ignoring surrounding spaces", () => {
    expect(isVariantFormComplete({ ...complete, name: "   " })).toBe(false);
    expect(isVariantFormComplete({ ...complete, description: "" })).toBe(false);
    expect(isVariantFormComplete({ ...complete, content: "\n " })).toBe(false);
  });

  it("requires a region", () => {
    expect(isVariantFormComplete({ ...complete, regionId: "" })).toBe(false);
  });
});
