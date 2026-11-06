import { describe, expect, it } from "vitest";
import { DYNAMIC_FEATURES_COUNT, STATIC_FEATURES_COUNT } from "../../utils/signDetection";
import { featuresCountMismatch } from "./signStudioCaptureUtils";

describe("featuresCountMismatch", () => {
  it("returns null when a static model matches the static feature count", () => {
    expect(featuresCountMismatch("static", STATIC_FEATURES_COUNT)).toBeNull();
  });

  it("returns null when a dynamic model matches the dynamic feature count", () => {
    expect(featuresCountMismatch("dynamic", DYNAMIC_FEATURES_COUNT)).toBeNull();
  });

  it("reports a static model that expects the dynamic count", () => {
    const message = featuresCountMismatch("static", DYNAMIC_FEATURES_COUNT + 1);
    expect(message).toContain("Modelo static incompatible");
    expect(message).toContain(`se esperaban ${STATIC_FEATURES_COUNT} features`);
    expect(message).toContain(`hay ${DYNAMIC_FEATURES_COUNT + 1}`);
  });

  it("reports a dynamic model with a stale feature count", () => {
    const message = featuresCountMismatch("dynamic", STATIC_FEATURES_COUNT);
    expect(message).toContain("Modelo dynamic incompatible");
    expect(message).toContain(`se esperaban ${DYNAMIC_FEATURES_COUNT} features`);
  });
});
