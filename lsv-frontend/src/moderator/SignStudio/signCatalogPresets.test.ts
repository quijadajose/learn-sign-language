import { describe, expect, it } from "vitest";
import {
  formatBulkSignLines,
  LSV_ALPHABET_SIGNS,
  parseBulkSignLines,
  summarizeBulkDrafts,
} from "./signCatalogPresets";

describe("signCatalogPresets", () => {
  it("alphabet has 30 entries with expected dynamics", () => {
    expect(LSV_ALPHABET_SIGNS).toHaveLength(30);
    const dynamics = LSV_ALPHABET_SIGNS.filter(
      (s) => s.detectionType === "dynamic",
    ).map((s) => s.name);
    expect(dynamics).toEqual(["CH", "J", "LL", "Ñ", "RR", "Z"]);
  });

  it("round-trips alphabet through format/parse", () => {
    const text = formatBulkSignLines(LSV_ALPHABET_SIGNS);
    const parsed = parseBulkSignLines(text, "static");
    expect(parsed).toEqual(LSV_ALPHABET_SIGNS);
  });

  it("parses plain lines with default type", () => {
    expect(parseBulkSignLines("Hola\nCasa\n", "dynamic")).toEqual([
      { name: "Hola", detectionType: "dynamic" },
      { name: "Casa", detectionType: "dynamic" },
    ]);
  });

  it("parses spaces and commas as separators", () => {
    expect(
      parseBulkSignLines("Hola, Casa Gracias;A B", "static"),
    ).toEqual([
      { name: "Hola", detectionType: "static" },
      { name: "Casa", detectionType: "static" },
      { name: "Gracias", detectionType: "static" },
      { name: "A", detectionType: "static" },
      { name: "B", detectionType: "static" },
    ]);
  });

  it("summarizes counts", () => {
    expect(summarizeBulkDrafts(LSV_ALPHABET_SIGNS)).toEqual({
      total: 30,
      staticCount: 24,
      dynamicCount: 6,
    });
  });
});
