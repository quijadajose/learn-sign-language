import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from '@jest/globals';
import {
  DYNAMIC_FEATURES_COUNT,
  FEATURES_COUNT,
  FEATURES_SCHEMA_DYNAMIC,
  FEATURES_SCHEMA_STATIC,
  FIXED_DYNAMIC_SEQUENCE_LENGTH,
  HAND_FEATURE_START,
  LEGACY_FEATURES_SCHEMA_DYNAMIC,
  LEGACY_FEATURES_SCHEMA_STATIC,
  MODEL_POSE_LANDMARKS,
  STATIC_FEATURES_COUNT,
  VELOCITY_POSE_LANDMARKS,
  assertValidLandmarkFrames,
  computeHandConfidence,
  featureMetadataForModelType,
  frameHasHandData,
  isRecordingValidated,
  isSupportedSchemaVersion,
  LandmarkValidationError,
} from './landmark-validation';

function makeFrame(withHands: boolean): number[] {
  const flat = new Array(FEATURES_COUNT).fill(0);
  if (withHands) {
    flat[HAND_FEATURE_START] = 0.5;
  }
  return flat;
}

describe('landmark-validation', () => {
  it('detects hand data only after pose block', () => {
    expect(frameHasHandData(makeFrame(false))).toBe(false);
    expect(frameHasHandData(makeFrame(true))).toBe(true);
    expect(frameHasHandData({ flat: makeFrame(true) })).toBe(true);
    expect(frameHasHandData([])).toBe(false);
  });

  it('computes hand confidence as frame ratio', () => {
    const landmarks = [
      makeFrame(true),
      makeFrame(true),
      makeFrame(false),
      makeFrame(true),
    ];
    expect(computeHandConfidence(landmarks)).toBeCloseTo(0.75);
    expect(computeHandConfidence([])).toBe(0);
  });

  it('validates recordings at 0.8 threshold', () => {
    const good = Array.from({ length: 10 }, () => makeFrame(true));
    const bad = [
      ...Array.from({ length: 7 }, () => makeFrame(true)),
      ...Array.from({ length: 3 }, () => makeFrame(false)),
    ];
    expect(isRecordingValidated(good)).toBe(true);
    expect(isRecordingValidated(bad)).toBe(false);
  });

  it('rejects frames that are not exactly FEATURES_COUNT', () => {
    expect(() => assertValidLandmarkFrames([])).toThrow(
      LandmarkValidationError,
    );
    try {
      assertValidLandmarkFrames([]);
    } catch (err) {
      expect(err).toMatchObject({
        i18nKey: 'errors.landmarks.empty',
        i18nParams: { count: FEATURES_COUNT },
      });
    }
    try {
      assertValidLandmarkFrames([[1, 2, 3]]);
    } catch (err) {
      expect(err).toMatchObject({
        i18nKey: 'errors.landmarks.invalidLength',
        i18nParams: {
          index: 0,
          expected: FEATURES_COUNT,
          received: 3,
        },
      });
    }
    expect(() => assertValidLandmarkFrames([makeFrame(true)])).not.toThrow();
  });

  it('stays in sync with schemas/ml-feature-contract.json', () => {
    const candidates = [
      path.resolve(process.cwd(), '../schemas/ml-feature-contract.json'),
      path.resolve(process.cwd(), 'schemas/ml-feature-contract.json'),
      path.resolve(
        __dirname,
        '../../../../../schemas/ml-feature-contract.json',
      ),
    ];
    const contractPath = candidates.find((p) => fs.existsSync(p));
    expect(contractPath).toBeDefined();
    const contract = JSON.parse(fs.readFileSync(contractPath!, 'utf8')) as {
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

  it('reports what the model consumes, not what is stored', () => {
    // El frame guardado sigue siendo de 258D; el estático entrena sobre el
    // recorte, así que anunciar FEATURES_COUNT haría fallar el gate del front.
    expect(STATIC_FEATURES_COUNT).not.toBe(FEATURES_COUNT);
    expect(featureMetadataForModelType('static')).toEqual({
      featuresCount: STATIC_FEATURES_COUNT,
      featuresSchemaVersion: FEATURES_SCHEMA_STATIC,
    });
    expect(featureMetadataForModelType('dynamic')).toEqual({
      featuresCount: DYNAMIC_FEATURES_COUNT,
      featuresSchemaVersion: FEATURES_SCHEMA_DYNAMIC,
    });
  });

  it('only accepts the current schema versions', () => {
    expect(isSupportedSchemaVersion(FEATURES_SCHEMA_STATIC)).toBe(true);
    expect(isSupportedSchemaVersion(FEATURES_SCHEMA_DYNAMIC)).toBe(true);
    for (const legacy of [
      ...LEGACY_FEATURES_SCHEMA_STATIC,
      ...LEGACY_FEATURES_SCHEMA_DYNAMIC,
    ]) {
      expect(isSupportedSchemaVersion(legacy)).toBe(false);
    }
    // Un modelo sin versión es anterior a la columna, o sea anterior al bump.
    expect(isSupportedSchemaVersion(null)).toBe(false);
    expect(isSupportedSchemaVersion(undefined)).toBe(false);
  });
});
