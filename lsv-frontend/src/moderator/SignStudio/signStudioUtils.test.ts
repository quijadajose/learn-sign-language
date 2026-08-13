import { describe, expect, it } from "vitest";
import {
  buildTrainingModelName,
  filterAndSortSigns,
  getRecordCaptureCue,
} from "./signStudioUtils";
import type { Sign } from "./types";

const signs: Sign[] = [
  { id: "1", name: "Zebra", isGlobal: false, createdAt: "2026-01-02" },
  { id: "2", name: "Alpha", isGlobal: true, createdAt: "2026-01-01" },
  { id: "3", name: "beta", isGlobal: false, createdAt: "2026-01-03" },
];

describe("filterAndSortSigns", () => {
  it("pone globales primero y ordena por nombre", () => {
    const result = filterAndSortSigns(signs, "", "name", "asc");
    expect(result.map((s) => s.id)).toEqual(["2", "3", "1"]);
  });

  it("filtra por searchTerm case-insensitive", () => {
    const result = filterAndSortSigns(signs, "al", "name", "asc");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Alpha");
  });

  it("ordena por createdAt descendente entre no-globales", () => {
    const result = filterAndSortSigns(
      signs.filter((s) => !s.isGlobal),
      "",
      "createdAt",
      "desc",
    );
    expect(result.map((s) => s.id)).toEqual(["3", "1"]);
  });
});

describe("buildTrainingModelName", () => {
  it("arma nombre de lección", () => {
    expect(
      buildTrainingModelName({
        mode: "lesson",
        langName: "LSV",
        rgnName: "Caracas",
        stgName: "N1",
        lsnName: "Saludos",
        selectedCount: 0,
      }),
    ).toBe("LSV (Caracas): N1 - Saludos");
  });

  it("usa selección por conteo", () => {
    expect(
      buildTrainingModelName({
        mode: "selection",
        selectedCount: 4,
      }),
    ).toBe("Selección: 4 señas");
  });
});

describe("getRecordCaptureCue", () => {
  it("ámbar sin mano", () => {
    expect(getRecordCaptureCue("waiting", false).badge).toContain("red");
  });

  it("verde fuerte al capturar", () => {
    expect(getRecordCaptureCue("collecting", true).label).toBe("Capturando");
  });

  it("Listo cuando el reposo dinámico ya armó la captura", () => {
    expect(getRecordCaptureCue("arming", true, true).label).toBe("Listo");
  });
});
