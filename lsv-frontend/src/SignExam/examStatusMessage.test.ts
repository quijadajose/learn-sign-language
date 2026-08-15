import { describe, expect, it } from "vitest";
import { examStatusMessage } from "./examStatusMessage";
import i18n from "../i18n";

const t = (key: string, opts?: Record<string, unknown>) =>
  String(i18n.t(key, { ns: "learn", ...(opts ?? {}) }));

const base = {
  signs: [{ name: "Hola", detectionType: "static" as const }],
  currentIndex: 0,
  prediction: null,
  modelGuess: null,
  capturePhase: "waiting" as const,
  bufferFill: 0,
  gestureRetryHint: false,
  gestureTooLongHint: false,
  dynamicAttempt: 0,
  minCaptureFrames: 10,
  isLoading: false,
  isFinished: false,
  allRecognized: false,
};

describe("examStatusMessage", () => {
  it("announces loading and completion", () => {
    expect(examStatusMessage({ ...base, isLoading: true }, t)).toMatch(
      /Cargando/,
    );
    expect(
      examStatusMessage({ ...base, isMediaPipeReady: false }, t),
    ).toMatch(/visión artificial/i);
    expect(
      examStatusMessage({ ...base, isFinished: true, allRecognized: true }, t),
    ).toMatch(/dominado todas las señas/);
  });

  it("describes waiting and capture phases without relying on color", () => {
    expect(examStatusMessage(base, t)).toMatch(/Hola/);
    expect(examStatusMessage({ ...base, capturePhase: "arming" }, t)).toMatch(
      /Reposo/,
    );
    expect(
      examStatusMessage(
        {
          ...base,
          capturePhase: "collecting",
          bufferFill: 4,
        },
        t,
      ),
    ).toMatch(/4 de 10/);
  });

  it("says when the model guess does not match the requested sign", () => {
    expect(
      examStatusMessage(
        {
          ...base,
          modelGuess: { label: "Adiós", confidence: 0.9 },
        },
        t,
      ),
    ).toMatch(/No coincide con Hola/);
  });
});
