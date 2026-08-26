import { describe, expect, it } from "vitest";
import {
  buildTrainingModelName,
  filterAndSortSigns,
  getRecordCaptureCue,
  pickReviewFrames,
  resolveInitialStudioRegionId,
} from "./signStudioUtils";
import type { LandmarkFrame, Sign } from "./types";

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

describe("resolveInitialStudioRegionId", () => {
  const regions = [
    { id: "ne", name: "Nueva Esparta", isDefault: false },
    { id: "ccs", name: "Caracas", isDefault: true },
  ];

  it("elige la región isDefault al cargar el lenguaje por primera vez", () => {
    expect(resolveInitialStudioRegionId(regions, "", false)).toBe("ccs");
  });

  it("usa la primera región si ninguna es isDefault", () => {
    expect(
      resolveInitialStudioRegionId(
        [{ id: "ne", isDefault: false }],
        "",
        false,
      ),
    ).toBe("ne");
  });

  it("no pisa Global / Principal después de que el usuario ya eligió región", () => {
    expect(resolveInitialStudioRegionId(regions, "", true)).toBeNull();
  });

  it("no cambia una región ya seleccionada", () => {
    expect(resolveInitialStudioRegionId(regions, "ne", false)).toBeNull();
  });
});

describe("getRecordCaptureCue", () => {
  it("ámbar sin mano", () => {
    const cue = getRecordCaptureCue("waiting", false);
    expect(cue.badge).toContain("red");
    expect(cue.label).toBe("Buscando");
  });

  it("verde fuerte al capturar", () => {
    expect(getRecordCaptureCue("collecting", true).label).toBe("Capturando");
  });

  it("Listo cuando el reposo dinámico ya armó la captura", () => {
    expect(getRecordCaptureCue("arming", true, true).label).toBe("Listo");
  });
});

describe("pickReviewFrames", () => {
  const dynamicFrames: LandmarkFrame[] = [{ flat: [1, 2] }];
  const staticFrames: LandmarkFrame[] = [{ flat: [3] }];

  it("ignora un evento de click y usa el buffer dinámico", () => {
    const clickEvent = { type: "click", isTrusted: true };
    expect(pickReviewFrames(clickEvent, true, dynamicFrames, [])).toEqual(
      dynamicFrames,
    );
  });

  it("usa el override si es un array de frames", () => {
    const override: LandmarkFrame[] = [{ flat: [9] }];
    expect(pickReviewFrames(override, true, dynamicFrames, [])).toEqual(
      override,
    );
  });

  it("respeta un array vacío (gesto inválido)", () => {
    expect(pickReviewFrames([], true, dynamicFrames, staticFrames)).toEqual([]);
  });

  it("cae al buffer estático si no hay override ni frames dinámicos", () => {
    expect(pickReviewFrames(undefined, false, dynamicFrames, staticFrames)).toEqual(
      staticFrames,
    );
  });
});
