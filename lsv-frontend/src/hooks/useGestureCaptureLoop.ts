import { useCallback, useEffect, useRef, type RefObject } from "react";
import type {
  HandLandmarker,
  NormalizedLandmark,
  PoseLandmarker,
} from "@mediapipe/tasks-vision";
import {
  DETECTION_INTERVAL_MS,
  GesturePhaseDetector,
  createForwardFillState,
  detectVisionFrame,
  mapGesturePhaseToUi,
  type RawHandFrame,
  type SignDetectionType,
  type UiCapturePhase,
} from "../utils/signDetection";

export type GestureCaptureStatus = {
  uiPhase: UiCapturePhase;
  handVisible: boolean;
  restFrameCount: number;
  captureCount: number;
};

export type GestureCaptureHandlers = {
  onStatus?: (status: GestureCaptureStatus) => void;
  onFillAborted?: () => void;
  onTooLong?: () => void;
  /** Cada frame en fase capturing (estáticas). */
  onStaticFrame?: (flat: number[], raw: RawHandFrame) => void;
  /** Cada frame nuevo de movimiento (dinámicas), para buffers de grabación. */
  onDynamicFrame?: (flat: number[], raw: RawHandFrame) => void;
  /** Gesto dinámico cerrado (flats del detector + raws acumulados en captura). */
  onDynamicGesture?: (
    gestureFlats: number[][],
    rawFrames: RawHandFrame[],
  ) => void;
  /** Landmarks crudos por frame (p. ej. overlay externo en Sign Studio). */
  onRawLandmarks?: (
    pose: NormalizedLandmark[] | null,
    leftHand: NormalizedLandmark[] | null,
    rightHand: NormalizedLandmark[] | null,
  ) => void;
  /** Primer frame MediaPipe válido. */
  onVisionReady?: () => void;
};

export type UseGestureCaptureLoopOptions = {
  enabled: boolean;
  /** Si true, el intervalo corre pero no procesa (p. ej. animación de éxito). */
  paused?: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef?: RefObject<HTMLCanvasElement | null>;
  poseLandmarkerRef: RefObject<PoseLandmarker | null>;
  handLandmarkerRef: RefObject<HandLandmarker | null>;
  detectionType: SignDetectionType;
  handlers: GestureCaptureHandlers;
};

/**
 * Loop compartido: MediaPipe → forward-fill → GesturePhaseDetector → callbacks.
 * Los handlers se leen desde un ref para no reiniciar el intervalo en cada render.
 */
export function useGestureCaptureLoop({
  enabled,
  paused = false,
  videoRef,
  canvasRef,
  poseLandmarkerRef,
  handLandmarkerRef,
  detectionType,
  handlers,
}: UseGestureCaptureLoopOptions) {
  const timestampRef = useRef(0);
  const forwardFillRef = useRef(createForwardFillState());
  const detectorRef = useRef(new GesturePhaseDetector(detectionType));
  const rawCaptureRef = useRef<RawHandFrame[]>([]);
  const handlersRef = useRef(handlers);
  const pausedRef = useRef(paused);
  const detectionTypeRef = useRef(detectionType);
  const visionReadyRef = useRef(false);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    detectionTypeRef.current = detectionType;
  }, [detectionType]);

  useEffect(() => {
    detectorRef.current.setDetectionType(detectionType);
    rawCaptureRef.current = [];
  }, [detectionType]);

  const resetCapture = useCallback(() => {
    timestampRef.current = 0;
    forwardFillRef.current = createForwardFillState();
    detectorRef.current.reset();
    rawCaptureRef.current = [];
  }, []);

  useEffect(() => {
    if (!enabled) {
      resetCapture();
      visionReadyRef.current = false;
      return;
    }

    let busy = false;
    const interval = setInterval(async () => {
      if (busy || pausedRef.current) return;
      const poseLandmarker = poseLandmarkerRef.current;
      const handLandmarker = handLandmarkerRef.current;
      if (!poseLandmarker || !handLandmarker) return;

      busy = true;
      try {
        const video = videoRef.current;
        if (!video) return;

        const frame = await detectVisionFrame({
          video,
          poseLandmarker,
          handLandmarker,
          timestampRef,
          forwardFillState: forwardFillRef.current,
          canvas: canvasRef?.current,
        });

        if (!frame) return;

        if (!visionReadyRef.current) {
          visionReadyRef.current = true;
          handlersRef.current.onVisionReady?.();
        }

        handlersRef.current.onRawLandmarks?.(
          frame.poseRaw,
          frame.leftHandRaw,
          frame.rightHandRaw,
        );

        forwardFillRef.current = frame.forwardFillState;

        if (frame.fillAborted) {
          detectorRef.current.reset();
          rawCaptureRef.current = [];
          handlersRef.current.onFillAborted?.();
          handlersRef.current.onStatus?.({
            uiPhase: "waiting",
            handVisible: false,
            restFrameCount: 0,
            captureCount: 0,
          });
          return;
        }

        const detector = detectorRef.current;
        const phaseResult = detector.tick(
          frame.handVisible ? frame.flat : null,
          frame.handVisible,
        );

        const uiPhase = mapGesturePhaseToUi(phaseResult.phase);
        const restFrameCount =
          phaseResult.phase === "arming" ||
          phaseResult.phase === "stabilizing" ||
          phaseResult.phase === "closing"
            ? detector.getRestFrameCount()
            : 0;

        handlersRef.current.onStatus?.({
          uiPhase,
          handVisible: frame.handVisible,
          restFrameCount,
          captureCount: phaseResult.captureCount,
        });

        if (!frame.handVisible || !frame.flat) {
          return;
        }

        if (phaseResult.abortedTooLong) {
          rawCaptureRef.current = [];
          handlersRef.current.onTooLong?.();
          return;
        }

        const isDynamic = detectionTypeRef.current === "dynamic";

        if (isDynamic) {
          if (
            phaseResult.phase === "capturing" &&
            frame.raw &&
            phaseResult.captureCount > rawCaptureRef.current.length
          ) {
            rawCaptureRef.current.push(frame.raw);
            handlersRef.current.onDynamicFrame?.(frame.flat, frame.raw);
          }

          if (phaseResult.completedGesture) {
            const rawFrames = [...rawCaptureRef.current];
            rawCaptureRef.current = [];
            handlersRef.current.onDynamicGesture?.(
              phaseResult.completedGesture,
              rawFrames,
            );
            detector.consumeCompletedGesture();
          }
          return;
        }

        if (phaseResult.phase === "capturing" && frame.raw) {
          handlersRef.current.onStaticFrame?.(frame.flat, frame.raw);
        }
      } finally {
        busy = false;
      }
    }, DETECTION_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [
    enabled,
    videoRef,
    canvasRef,
    poseLandmarkerRef,
    handLandmarkerRef,
    resetCapture,
  ]);

  return {
    resetCapture,
    detectorRef,
  };
}
