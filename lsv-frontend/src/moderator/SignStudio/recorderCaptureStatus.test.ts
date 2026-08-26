import { describe, expect, it } from "vitest";
import {
  STABLE_FRAMES_TO_START,
  TARGET_CAPTURE_FRAMES,
} from "../../utils/signDetection";
import { getCaptureStatusMessage } from "./recorderCaptureStatus";

describe("getCaptureStatusMessage", () => {
  it("si ya hay frames estáticos, muestra captura aunque la fase siga en stabilizing", () => {
    expect(
      getCaptureStatusMessage(
        true,
        true,
        "stabilizing",
        false,
        0,
        0,
        4,
        false,
      ),
    ).toBe(`Capturando: 4/${TARGET_CAPTURE_FRAMES}`);
  });

  it("en stabilizing pide mantener la pose con el contador", () => {
    expect(
      getCaptureStatusMessage(
        true,
        true,
        "stabilizing",
        false,
        3,
        0,
        0,
        false,
      ),
    ).toBe(`Mano OK — mantén la pose (3/${STABLE_FRAMES_TO_START})`);
  });
});
