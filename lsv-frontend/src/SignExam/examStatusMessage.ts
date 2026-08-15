import {
  CONFIDENCE_THRESHOLD,
  MAX_DYNAMIC_CAPTURE_FRAMES,
  MAX_DYNAMIC_EXAM_ATTEMPTS,
  type SignDetectionType,
  type UiCapturePhase,
} from "../utils/signDetection";

export type ExamTranslator = (
  key: string,
  options?: Record<string, unknown>,
) => string;

type ExamStatusInput = {
  signs: { name: string; detectionType?: SignDetectionType }[];
  currentIndex: number;
  prediction: { label: string; confidence: number } | null;
  modelGuess: { label: string; confidence: number } | null;
  capturePhase: UiCapturePhase;
  bufferFill: number;
  gestureRetryHint: boolean;
  gestureTooLongHint: boolean;
  dynamicAttempt: number;
  minCaptureFrames: number;
  isLoading: boolean;
  isFinished: boolean;
  allRecognized: boolean;
  isMediaPipeReady?: boolean;
};

export function examStatusMessage(
  input: ExamStatusInput,
  t: ExamTranslator,
): string {
  if (input.isLoading) {
    return t("practice.status.loadingAi");
  }
  if (input.isMediaPipeReady === false) {
    return t("practice.status.startingVision");
  }
  if (input.isFinished) {
    return input.allRecognized
      ? t("practice.status.completedAll")
      : t("practice.status.completedPartial");
  }

  const signName =
    input.signs[input.currentIndex]?.name || t("practice.signFallback");
  const detectionType =
    input.signs[input.currentIndex]?.detectionType ?? "static";

  if (input.gestureTooLongHint) {
    return t("practice.status.gestureTooLong", {
      max: MAX_DYNAMIC_CAPTURE_FRAMES,
    });
  }
  if (input.capturePhase === "arming") {
    return t("practice.status.arming", { signName });
  }
  if (input.capturePhase === "stabilizing") {
    return t("practice.status.stabilizing", { signName });
  }
  if (input.capturePhase === "collecting") {
    return detectionType === "dynamic"
      ? t("practice.status.collectingDynamic", { fill: input.bufferFill })
      : t("practice.status.collectingStatic", {
          signName,
          fill: input.bufferFill,
          min: input.minCaptureFrames,
        });
  }
  if (input.capturePhase === "closing") {
    return t("practice.status.closing");
  }
  if (input.capturePhase === "analyzing") {
    return t("practice.status.analyzing");
  }
  if (input.gestureRetryHint) {
    return input.dynamicAttempt >= MAX_DYNAMIC_EXAM_ATTEMPTS
      ? t("practice.status.retryGiveUp")
      : t("practice.status.retry", {
          attempt: input.dynamicAttempt,
          max: MAX_DYNAMIC_EXAM_ATTEMPTS,
        });
  }
  if (input.modelGuess) {
    const match =
      input.modelGuess.label.toLowerCase() === signName.toLowerCase();
    const confidence = Math.round(input.modelGuess.confidence * 100);
    return match
      ? t("practice.status.modelMatch", {
          label: input.modelGuess.label,
          confidence,
        })
      : t("practice.status.modelMismatch", {
          label: input.modelGuess.label,
          confidence,
          signName,
        });
  }
  if (input.prediction) {
    const confidence = Math.round(input.prediction.confidence * 100);
    const ready =
      input.prediction.confidence >= CONFIDENCE_THRESHOLD
        ? t("practice.status.thresholdMet")
        : t("practice.status.thresholdLow");
    return t("practice.status.confidence", { signName, confidence, ready });
  }
  if (input.capturePhase === "waiting") {
    return detectionType === "dynamic"
      ? t("practice.status.waitingDynamic", { signName })
      : t("practice.status.waitingStatic", { signName });
  }
  return t("practice.status.performSign", { signName });
}
