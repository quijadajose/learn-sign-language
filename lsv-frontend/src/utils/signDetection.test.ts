import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resampleSequence } from "./resampling";
import {
  DYNAMIC_FEATURES_COUNT,
  FEATURES_COUNT,
  FEATURES_SCHEMA_DYNAMIC,
  FEATURES_SCHEMA_STATIC,
  FIXED_DYNAMIC_SEQUENCE_LENGTH,
  GesturePhaseDetector,
  HAND_FEATURE_START,
  HAND_MODEL,
  HAND_MOTION_THRESHOLD,
  LEGACY_FEATURES_SCHEMA_DYNAMIC,
  LEGACY_FEATURES_SCHEMA_STATIC,
  MIN_GESTURE_FRAMES,
  MODEL_HAND_FEATURE_START,
  MODEL_POSE_LANDMARKS,
  POSE_MODEL,
  REST_FRAMES_TO_END,
  REST_FRAMES_TO_START,
  STABLE_FRAMES_TO_START,
  STATIC_FEATURES_COUNT,
  VELOCITY_POSE_LANDMARKS,
  VISION_WASM,
  appendVelocityToSequence,
  buildDynamicInferenceSequence,
  frameHasHandData,
  isSupportedDynamicSchema,
  isSupportedStaticSchema,
  isSupportedSchemaVersion,
  measureHandMotion,
  minFramesBeforeInference,
  normalizeTrainingFrame,
  selectPoseLandmarks,
  resolveTrustedModelUrl,
} from "./signDetection";

function makeFlat(handValue = 0.5): number[] {
  const flat = new Array(FEATURES_COUNT).fill(0);
  for (let i = HAND_FEATURE_START; i < FEATURES_COUNT; i++) {
    flat[i] = handValue;
  }
  return flat;
}

/** Cambia manos lo bastante para superar HAND_MOTION_THRESHOLD. */
function makeMovingFlat(base: number, step: number): number[] {
  const handDims = FEATURES_COUNT - HAND_FEATURE_START;
  const perDim = (HAND_MOTION_THRESHOLD + 1) / handDims;
  return makeFlat(base + step * perDim);
}

describe("resampleSequence", () => {
  it("devuelve vacío si la fuente está vacía", () => {
    expect(resampleSequence([], 30)).toEqual([]);
  });

  it("repite el único frame hasta la longitud objetivo", () => {
    const frame = [1, 2, 3];
    const out = resampleSequence([frame], 4);
    expect(out).toHaveLength(4);
    expect(out.every((f) => f[0] === 1 && f[1] === 2 && f[2] === 3)).toBe(true);
  });

  it("escala N→S con extremos exactos", () => {
    const seq = [
      [0, 0],
      [10, 10],
    ];
    const out = resampleSequence(seq, 5);
    expect(out).toHaveLength(5);
    expect(out[0]).toEqual([0, 0]);
    expect(out[4]).toEqual([10, 10]);
    expect(out[2][0]).toBeCloseTo(5);
  });
});

describe("selectPoseLandmarks", () => {
  it("recorta al conteo estático declarado", () => {
    expect(selectPoseLandmarks(makeFlat(0.4))).toHaveLength(
      STATIC_FEATURES_COUNT,
    );
  });

  it("conserva los landmarks del contrato en orden", () => {
    const frame = Array.from({ length: FEATURES_COUNT }, (_, i) => i);
    const out = selectPoseLandmarks(frame);
    MODEL_POSE_LANDMARKS.forEach((landmark, slot) => {
      for (let offset = 0; offset < 4; offset++) {
        expect(out[slot * 4 + offset]).toBe(landmark * 4 + offset);
      }
    });
  });

  it("deja pasar los bloques de mano intactos", () => {
    const frame = Array.from({ length: FEATURES_COUNT }, (_, i) => i);
    expect(selectPoseLandmarks(frame).slice(MODEL_HAND_FEATURE_START)).toEqual(
      frame.slice(HAND_FEATURE_START),
    );
  });

  it("descarta piernas y los puntos de mano gruesos del pose", () => {
    const kept = new Set<number>(MODEL_POSE_LANDMARKS);
    const dropped = Array.from({ length: 33 }, (_, i) => i).filter(
      (landmark) => !kept.has(landmark),
    );
    expect(dropped).toEqual([
      17, 18, 19, 20, 21, 22, 25, 26, 27, 28, 29, 30, 31, 32,
    ]);
  });
});

describe("buildDynamicInferenceSequence (dynamic-v3)", () => {
  it("produce secuencias 340D con longitud fija", () => {
    const frames = Array.from({ length: 12 }, (_, i) => makeMovingFlat(0.2, i));
    const out = buildDynamicInferenceSequence(frames, 30);
    expect(out).not.toBeNull();
    expect(out!).toHaveLength(30);
    expect(out![0]).toHaveLength(DYNAMIC_FEATURES_COUNT);
  });

  it("aplica deltas antes del resample (primer frame de velocidad ~0)", () => {
    const a = selectPoseLandmarks(makeFlat(0.3));
    const b = selectPoseLandmarks(makeMovingFlat(0.3, 1));
    const withVelocity = appendVelocityToSequence([a, b]);
    expect(
      withVelocity[0].slice(STATIC_FEATURES_COUNT).every((v) => v === 0),
    ).toBe(true);
    expect(
      withVelocity[1].some((v, i) => i >= STATIC_FEATURES_COUNT && v !== 0),
    ).toBe(true);
  });

  it("ignora frames sin longitud 258", () => {
    expect(buildDynamicInferenceSequence([[1, 2, 3]], 30)).toBeNull();
  });

  it("registra velocidad cuando el brazo se traslada con la mano en forma fija", () => {
    // El motivo del bump: las manos llegan relativas a la muñeca, así que este
    // gesto no mueve un solo valor del bloque de mano ni de sus deltas. Sin los
    // deltas de pose, el vector no distinguiría este frame de uno en reposo.
    const still = makeFlat(0.4);
    const moved = makeFlat(0.4);
    for (const landmark of VELOCITY_POSE_LANDMARKS) {
      moved[landmark * 4] += 0.2;
    }

    const [, second] = appendVelocityToSequence(
      [still, moved].map(selectPoseLandmarks),
    );
    const handDeltas = second.slice(
      STATIC_FEATURES_COUNT,
      STATIC_FEATURES_COUNT + 126,
    );
    const poseDeltas = second.slice(STATIC_FEATURES_COUNT + 126);

    expect(handDeltas.every((value) => value === 0)).toBe(true);
    expect(poseDeltas).toHaveLength(VELOCITY_POSE_LANDMARKS.length * 3);
    expect(poseDeltas.some((value) => value !== 0)).toBe(true);
  });

  it("mover una pierna no cambia el vector que ve el modelo", () => {
    const still = makeFlat(0.4);
    const legMoved = makeFlat(0.4);
    for (let landmark = 25; landmark < 33; landmark++) {
      for (let offset = 0; offset < 4; offset++) {
        legMoved[landmark * 4 + offset] += 0.5;
      }
    }
    expect(buildDynamicInferenceSequence([still, legMoved], 2)).toEqual(
      buildDynamicInferenceSequence([still, still], 2),
    );
  });
});

describe("gate de schemas", () => {
  it("acepta solo las versiones vigentes", () => {
    expect(
      isSupportedDynamicSchema(
        FEATURES_SCHEMA_DYNAMIC,
        DYNAMIC_FEATURES_COUNT,
      ),
    ).toBe(true);
    expect(
      isSupportedStaticSchema(FEATURES_SCHEMA_STATIC, STATIC_FEATURES_COUNT),
    ).toBe(true);
    expect(isSupportedSchemaVersion(FEATURES_SCHEMA_STATIC)).toBe(true);
    expect(isSupportedSchemaVersion(FEATURES_SCHEMA_DYNAMIC)).toBe(true);
  });

  it("rechaza todas las versiones legacy", () => {
    for (const legacy of LEGACY_FEATURES_SCHEMA_DYNAMIC) {
      expect(isSupportedDynamicSchema(legacy, 384)).toBe(false);
      expect(isSupportedSchemaVersion(legacy)).toBe(false);
    }
    for (const legacy of LEGACY_FEATURES_SCHEMA_STATIC) {
      expect(isSupportedStaticSchema(legacy, 258)).toBe(false);
      expect(isSupportedSchemaVersion(legacy)).toBe(false);
    }
  });

  it("sin versión explícita no hay fallback: el modelo es anterior al bump", () => {
    expect(isSupportedDynamicSchema(null, DYNAMIC_FEATURES_COUNT)).toBe(false);
    expect(isSupportedStaticSchema(null, STATIC_FEATURES_COUNT)).toBe(false);
    expect(isSupportedSchemaVersion(undefined)).toBe(false);
  });

  it("no confunde estático con dinámico", () => {
    expect(isSupportedDynamicSchema(FEATURES_SCHEMA_STATIC, 258)).toBe(false);
    expect(
      isSupportedStaticSchema(FEATURES_SCHEMA_DYNAMIC, DYNAMIC_FEATURES_COUNT),
    ).toBe(false);
  });

  it("rechaza un vigente con featuresCount incompatible", () => {
    expect(isSupportedDynamicSchema(FEATURES_SCHEMA_DYNAMIC, 384)).toBe(false);
    // 258 era el conteo del estático antes del recorte de landmarks.
    expect(isSupportedStaticSchema(FEATURES_SCHEMA_STATIC, 258)).toBe(false);
  });
});

describe("ml-feature-contract sync", () => {
  it("mantiene constantes alineadas con schemas/ml-feature-contract.json", () => {
    const contractPath = resolve(
      process.cwd(),
      "../schemas/ml-feature-contract.json",
    );
    const contract = JSON.parse(readFileSync(contractPath, "utf8")) as {
      properties: {
        featuresCount: { const: number };
        staticFeaturesCount: { const: number };
        dynamicFeaturesCount: { const: number };
        fixedDynamicSequenceLength: { const: number };
        featuresSchemaStatic: { const: string };
        featuresSchemaDynamic: { const: string };
        legacyFeaturesSchemaStatic: { const: string[] };
        legacyFeaturesSchemaDynamic: { const: string[] };
        modelPoseLandmarks: { const: number[] };
        velocityPoseLandmarks: { const: number[] };
      };
    };
    const p = contract.properties;
    expect(FEATURES_COUNT).toBe(p.featuresCount.const);
    expect(STATIC_FEATURES_COUNT).toBe(p.staticFeaturesCount.const);
    expect(DYNAMIC_FEATURES_COUNT).toBe(p.dynamicFeaturesCount.const);
    expect(FIXED_DYNAMIC_SEQUENCE_LENGTH).toBe(
      p.fixedDynamicSequenceLength.const,
    );
    expect(FEATURES_SCHEMA_STATIC).toBe(p.featuresSchemaStatic.const);
    expect(FEATURES_SCHEMA_DYNAMIC).toBe(p.featuresSchemaDynamic.const);
    expect([...LEGACY_FEATURES_SCHEMA_STATIC]).toEqual(
      p.legacyFeaturesSchemaStatic.const,
    );
    expect([...LEGACY_FEATURES_SCHEMA_DYNAMIC]).toEqual(
      p.legacyFeaturesSchemaDynamic.const,
    );
    expect([...MODEL_POSE_LANDMARKS]).toEqual(p.modelPoseLandmarks.const);
    expect([...VELOCITY_POSE_LANDMARKS]).toEqual(p.velocityPoseLandmarks.const);
  });

  it("el layout 340D cuadra con el conteo declarado", () => {
    const handFeatures = FEATURES_COUNT - HAND_FEATURE_START;
    const poseVelocity = VELOCITY_POSE_LANDMARKS.length * 3;
    expect(MODEL_POSE_LANDMARKS.length * 4 + handFeatures).toBe(
      STATIC_FEATURES_COUNT,
    );
    expect(STATIC_FEATURES_COUNT + handFeatures + poseVelocity).toBe(
      DYNAMIC_FEATURES_COUNT,
    );
  });

  it("los landmarks de velocidad sobreviven al recorte", () => {
    // Si uno quedara fuera, su índice compacto no existiría y los deltas de
    // brazo apuntarían a otro landmark sin que nada lo notara.
    const kept = new Set<number>(MODEL_POSE_LANDMARKS);
    for (const landmark of VELOCITY_POSE_LANDMARKS) {
      expect(kept.has(landmark)).toBe(true);
    }
  });
});

describe("normalizeTrainingFrame / frameHasHandData", () => {
  it("normaliza flat y objetos { flat }", () => {
    const flat = makeFlat(0.8);
    expect(normalizeTrainingFrame(flat)).toEqual(flat);
    expect(normalizeTrainingFrame({ flat })).toEqual(flat);
    expect(normalizeTrainingFrame(null)).toEqual([]);
  });

  it("sobrevive a un flat presente pero nulo (grabaciones viejas)", () => {
    // recordingHandFrameRatio corre dentro del render, así que devolver algo
    // sin .length acá es una pantalla blanca, no un toast.
    expect(normalizeTrainingFrame({ flat: null })).toEqual([]);
    expect(normalizeTrainingFrame({ flat: undefined })).toEqual([]);
    expect(normalizeTrainingFrame({ flat: "nope" })).toEqual([]);
    expect(frameHasHandData({ flat: null })).toBe(false);
  });

  it("detecta manos no nulas", () => {
    expect(frameHasHandData(makeFlat(0))).toBe(false);
    expect(frameHasHandData(makeFlat(0.4))).toBe(true);
  });
});

describe("measureHandMotion", () => {
  it("no ve movimiento entre dos frames idénticos", () => {
    const flat = makeFlat(0.4);
    expect(measureHandMotion(flat, flat)).toBe(0);
  });

  it("detecta una seña hecha solo desplazando el brazo", () => {
    // El bug: las manos llegan relativas a la muñeca, así que este gesto no
    // mueve un solo valor del bloque de mano y la captura dinámica se quedaba
    // esperando movimiento para siempre.
    const still = makeFlat(0.4);
    const armMoved = makeFlat(0.4);
    for (const landmark of VELOCITY_POSE_LANDMARKS) {
      armMoved[landmark * 4] += 0.2;
    }

    const handOnly = armMoved
      .slice(HAND_FEATURE_START)
      .reduce((sum, value, i) => sum + Math.abs(value - still[HAND_FEATURE_START + i]), 0);
    expect(handOnly).toBe(0);

    expect(measureHandMotion(still, armMoved)).toBeGreaterThan(
      HAND_MOTION_THRESHOLD,
    );
  });

  it("mide el brazo en unidades de ancho de hombros", () => {
    // El mismo gesto visto de cerca y de lejos debe dar la misma moción, o el
    // umbral dependería de la distancia a la cámara.
    const withShoulders = (halfWidth: number, armOffset: number) => {
      const flat = makeFlat(0.4);
      flat[11 * 4] = halfWidth;
      flat[12 * 4] = -halfWidth;
      for (const landmark of VELOCITY_POSE_LANDMARKS) {
        flat[landmark * 4] = armOffset;
      }
      return flat;
    };

    const near = measureHandMotion(
      withShoulders(0.25, 0),
      withShoulders(0.25, 0.05),
    );
    const far = measureHandMotion(
      withShoulders(0.125, 0),
      withShoulders(0.125, 0.025),
    );
    expect(near).toBeCloseTo(far, 10);
  });

  it("el brazo quieto no aporta moción aunque la persona esté a otra distancia", () => {
    const flat = makeFlat(0.4);
    flat[11 * 4] = 0.25;
    flat[12 * 4] = -0.25;
    expect(measureHandMotion(flat, flat)).toBe(0);
  });
});

describe("minFramesBeforeInference", () => {
  it("acota entre MIN_CAPTURE_FRAMES y 14", () => {
    expect(minFramesBeforeInference(30)).toBe(14);
    expect(minFramesBeforeInference(10)).toBe(10);
  });
});

describe("GesturePhaseDetector", () => {
  it("estática: estabiliza y pasa a capturing", () => {
    const detector = new GesturePhaseDetector("static");
    let result = detector.tick(makeFlat(0.4), true);
    expect(result.phase).toBe("stabilizing");

    for (let i = 0; i < STABLE_FRAMES_TO_START; i++) {
      result = detector.tick(makeFlat(0.4), true);
    }
    expect(result.phase).toBe("capturing");
  });

  it("dinámica: reposo → movimiento → reposo completa el gesto", () => {
    const detector = new GesturePhaseDetector("dynamic");
    const rest = makeFlat(0.4);

    for (let i = 0; i < REST_FRAMES_TO_START + 1; i++) {
      detector.tick(rest, true);
    }
    expect(detector.isArmedForGesture()).toBe(true);
    expect(detector.getRestFrameCount()).toBe(REST_FRAMES_TO_START);
    expect(detector.getPhase()).toBe("arming");

    // Más reposo no debe seguir contando ni salir de arming (espera moción).
    for (let i = 0; i < 20; i++) {
      detector.tick(rest, true);
    }
    expect(detector.getRestFrameCount()).toBe(REST_FRAMES_TO_START);
    expect(detector.getPhase()).toBe("arming");

    for (let i = 0; i < MIN_GESTURE_FRAMES; i++) {
      detector.tick(makeMovingFlat(0.4, i + 1), true);
    }
    expect(detector.getPhase()).toBe("capturing");

    const lastMoving = makeMovingFlat(0.4, MIN_GESTURE_FRAMES);
    let completed: number[][] | null = null;
    for (let i = 0; i < REST_FRAMES_TO_END + 2; i++) {
      const result = detector.tick(lastMoving, true);
      if (result.completedGesture) {
        completed = result.completedGesture;
        expect(result.phase).toBe("complete");
        break;
      }
    }

    expect(completed).not.toBeNull();
    expect(completed!.length).toBeGreaterThanOrEqual(MIN_GESTURE_FRAMES);
  });

  it("sin mano reinicia a waiting", () => {
    const detector = new GesturePhaseDetector("static");
    detector.tick(makeFlat(0.4), true);
    const result = detector.tick(null, false);
    expect(result.phase).toBe("waiting");
  });
});

describe("MediaPipe asset URLs", () => {
  it("loads WASM and landmark models from same-origin paths", () => {
    expect(VISION_WASM).toBe("/mediapipe/wasm");
    expect(POSE_MODEL.startsWith("/mediapipe/models/")).toBe(true);
    expect(HAND_MODEL.startsWith("/mediapipe/models/")).toBe(true);
  });
});

describe("resolveTrustedModelUrl", () => {
  const backend = "https://api.lsv.test";
  const page = "https://app.lsv.test";

  it("resolves relative paths against the backend origin", () => {
    expect(
      resolveTrustedModelUrl("/shared/models/m/model.json", backend, page),
    ).toBe("https://api.lsv.test/shared/models/m/model.json");
  });

  it("allows the backend origin", () => {
    expect(
      resolveTrustedModelUrl(
        "https://api.lsv.test/shared/models/m/model.json",
        backend,
        page,
      ),
    ).toBe("https://api.lsv.test/shared/models/m/model.json");
  });

  it("allows the page origin", () => {
    expect(
      resolveTrustedModelUrl(
        "https://app.lsv.test/models/m/model.json",
        backend,
        page,
      ),
    ).toBe("https://app.lsv.test/models/m/model.json");
  });

  it("rejects a third-party origin", () => {
    expect(() =>
      resolveTrustedModelUrl(
        "https://evil.example/model.json",
        backend,
        page,
      ),
    ).toThrow("Untrusted model URL");
  });
});
