import { createRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "../i18n";
import SignExamCameraView from "./SignExamCameraView";

const baseProps = {
  videoRef: createRef<HTMLVideoElement>(),
  canvasRef: createRef<HTMLCanvasElement>(),
  isLoading: false,
  isFinished: false,
  isSuccess: false,
  isMediaPipeReady: true,
  allRecognized: false,
  signs: [{ id: "s1", name: "Hola", detectionType: "static" as const }],
  currentIndex: 0,
  prediction: null,
  modelGuess: null,
  capturePhase: "waiting" as const,
  bufferFill: 0,
  stableFramesCount: 0,
  gestureRetryHint: false,
  gestureTooLongHint: false,
  dynamicAttempt: 0,
  recognitionProgress: 0,
  minCaptureFrames: 10,
  onGoBack: vi.fn(),
};

describe("SignExamCameraView", () => {
  afterEach(() => {
    cleanup();
  });
  it("labels the camera, hides the overlay canvas, and exposes a live status", () => {
    render(<SignExamCameraView {...baseProps} />);

    expect(
      screen.getByLabelText("Cámara para reconocer señas").tagName,
    ).toBe("VIDEO");
    expect(document.querySelector("canvas")?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(screen.getByRole("status").textContent).toMatch(/Hola/);
  });

  it("announces the AI loading state", () => {
    render(<SignExamCameraView {...baseProps} isLoading />);
    expect(screen.getByText("Cargando inteligencia artificial")).toBeTruthy();
  });

  it("shows overlay status at body size so zoom does not depend on tiny captions", () => {
    const { container } = render(<SignExamCameraView {...baseProps} />);
    const overlay = container.querySelector(".text-base.leading-snug");
    expect(overlay?.textContent).toMatch(/Hola/);
  });
});
