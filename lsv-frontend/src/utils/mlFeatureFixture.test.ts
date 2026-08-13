/**
 * Verifica el frontend contra la especificación compartida del contrato.
 *
 * El fixture lo genera scripts/generate-ml-feature-fixture.py con aritmética
 * independiente, y lsv-model-trainer/tests/test_golden_fixture.py comprueba el
 * mismo archivo. Si la normalización de pose o el layout de deltas se separan
 * entre TypeScript y Python, uno de los dos lados falla acá.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DYNAMIC_FEATURES_COUNT,
  FEATURES_COUNT,
  FEATURES_SCHEMA_DYNAMIC,
  FEATURES_SCHEMA_STATIC,
  MODEL_POSE_LANDMARKS,
  STATIC_FEATURES_COUNT,
  appendVelocityToSequence,
  buildDynamicInferenceSequence,
  normalizePoseScale,
  poseScaleFactor,
  selectPoseLandmarks,
} from "./signDetection";

const TOLERANCE = 1e-12;

type Fixture = {
  featuresSchemaStatic: string;
  featuresSchemaDynamic: string;
  featuresCount: number;
  staticFeaturesCount: number;
  dynamicFeaturesCount: number;
  modelPoseLandmarks: number[];
  velocityPoseLandmarks: number[];
  poseScaleFactors: number[];
  input258: number[][];
  expectedNormalized258: number[][];
  expectedStatic: number[][];
  expectedDynamic: number[][];
};

const fixture: Fixture = JSON.parse(
  readFileSync(
    resolve(process.cwd(), "../schemas/fixtures/dynamic-v3-golden.json"),
    "utf8",
  ),
) as Fixture;

/** Compara matrices con tolerancia, reportando la primera celda que difiere. */
function expectMatrixClose(actual: number[][], expected: number[][]) {
  expect(actual).toHaveLength(expected.length);
  for (let row = 0; row < expected.length; row++) {
    expect(actual[row]).toHaveLength(expected[row].length);
    for (let col = 0; col < expected[row].length; col++) {
      const diff = Math.abs(actual[row][col] - expected[row][col]);
      if (diff > TOLERANCE) {
        throw new Error(
          `frame ${row}, feature ${col}: ${actual[row][col]} != ${expected[row][col]}`,
        );
      }
    }
  }
}

describe("contrato de features contra el fixture compartido", () => {
  it("el fixture coincide con las constantes generadas", () => {
    expect(fixture.featuresCount).toBe(FEATURES_COUNT);
    expect(fixture.staticFeaturesCount).toBe(STATIC_FEATURES_COUNT);
    expect(fixture.dynamicFeaturesCount).toBe(DYNAMIC_FEATURES_COUNT);
    expect(fixture.featuresSchemaStatic).toBe(FEATURES_SCHEMA_STATIC);
    expect(fixture.featuresSchemaDynamic).toBe(FEATURES_SCHEMA_DYNAMIC);
    expect(fixture.modelPoseLandmarks).toEqual([...MODEL_POSE_LANDMARKS]);
  });

  it("poseScaleFactor reproduce las escalas esperadas", () => {
    const scales = fixture.input258.map(poseScaleFactor);
    scales.forEach((scale, index) => {
      expect(scale).toBeCloseTo(fixture.poseScaleFactors[index], 12);
    });
  });

  it("normalizePoseScale reproduce el pose esperado", () => {
    expectMatrixClose(
      fixture.input258.map(normalizePoseScale),
      fixture.expectedNormalized258,
    );
  });

  it("selectPoseLandmarks reproduce el recorte esperado", () => {
    expectMatrixClose(
      fixture.input258.map((frame) =>
        selectPoseLandmarks(normalizePoseScale(frame)),
      ),
      fixture.expectedStatic,
    );
  });

  it("la conversión a 340D reproduce el layout esperado", () => {
    expectMatrixClose(
      appendVelocityToSequence(
        fixture.input258.map((frame) =>
          selectPoseLandmarks(normalizePoseScale(frame)),
        ),
      ),
      fixture.expectedDynamic,
    );
  });

  it("buildDynamicInferenceSequence normaliza y recorta sin que el caller lo pida", () => {
    const out = buildDynamicInferenceSequence(
      fixture.input258,
      fixture.input258.length,
    );
    expect(out).not.toBeNull();
    expectMatrixClose(out!, fixture.expectedDynamic);
  });

  it("visibility no se escala: es una confianza en [0, 1]", () => {
    const normalized = fixture.input258.map(normalizePoseScale);
    for (let landmark = 0; landmark < 33; landmark++) {
      const index = landmark * 4 + 3;
      normalized.forEach((frame, row) => {
        expect(frame[index]).toBe(fixture.input258[row][index]);
      });
    }
  });
});
