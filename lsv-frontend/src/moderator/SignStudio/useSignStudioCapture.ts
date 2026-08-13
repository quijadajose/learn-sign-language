import { useRef, useState, useEffect, useCallback } from "react";
import {
  PoseLandmarker,
  HandLandmarker,
  DrawingUtils,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import { signRecordApi } from "../../services/api";
import { BACKEND_BASE_URL } from "../../config";
import { useGestureCaptureLoop } from "../../hooks/useGestureCaptureLoop";
import {
  createVisionLandmarkers,
  closeVisionLandmarkers,
  recordingHandFrameRatio,
  buildDynamicInferenceSequence,
  runModelInference,
  runStaticModelInference,
  normalizeTrainingFrame,
  loadTfModelFromUrl,
  isSupportedSchemaVersion,
  UNSUPPORTED_SCHEMA_MESSAGE,
  DYNAMIC_FEATURES_COUNT,
  STATIC_FEATURES_COUNT,
  MIN_CAPTURE_FRAMES,
  MIN_GESTURE_FRAMES,
  TARGET_CAPTURE_FRAMES,
  MAX_DYNAMIC_CAPTURE_FRAMES,
  nextMediaPipeTimestamp,
  pickHandLandmarks,
  type SignDetectionType,
  type UiCapturePhase,
} from "../../utils/signDetection";
import { toast } from "./signStudioUtils";
import type {
  LandmarkFrame,
  LandmarkPoint,
  Sign,
  SampleTestResult,
  SignRecording,
  StudioModel,
} from "./types";

function drawOverlayLandmarks(
  ctx: CanvasRenderingContext2D,
  pose: LandmarkPoint[] | null | undefined,
  leftHand: LandmarkPoint[] | null | undefined,
  rightHand: LandmarkPoint[] | null | undefined,
  poseAlpha = "0.4",
) {
  const drawingUtils = new DrawingUtils(ctx);
  const poseNorm = pose as NormalizedLandmark[] | null | undefined;
  const leftNorm = leftHand as NormalizedLandmark[] | null | undefined;
  const rightNorm = rightHand as NormalizedLandmark[] | null | undefined;
  if (poseNorm) {
    const filteredConnections = PoseLandmarker.POSE_CONNECTIONS.filter(
      (conn) => conn.start < 17 && conn.end < 17,
    );
    drawingUtils.drawConnectors(poseNorm, filteredConnections, {
      color: `rgba(226, 232, 240, ${poseAlpha})`,
      lineWidth: 1,
    });
  }
  if (leftNorm) {
    drawingUtils.drawConnectors(leftNorm, HandLandmarker.HAND_CONNECTIONS, {
      color: "#F87171",
      lineWidth: 2,
    });
    drawingUtils.drawLandmarks(leftNorm, {
      color: "#F87171",
      lineWidth: 1,
      radius: 1,
    });
  }
  if (rightNorm) {
    drawingUtils.drawConnectors(rightNorm, HandLandmarker.HAND_CONNECTIONS, {
      color: "#4ADE80",
      lineWidth: 2,
    });
    drawingUtils.drawLandmarks(rightNorm, {
      color: "#4ADE80",
      lineWidth: 1,
      radius: 1,
    });
  }
}

/**
 * El artefacto declara cuántas features espera y los dos tipos esperan
 * distinto, así que un desajuste acá es un modelo de antes del recorte de
 * landmarks: sin este aviso reventaría dentro de TFJS con un error de shape.
 */
function featuresCountMismatch(
  modelType: "static" | "dynamic",
  featuresCount: number,
): string | null {
  const expected =
    modelType === "dynamic" ? DYNAMIC_FEATURES_COUNT : STATIC_FEATURES_COUNT;
  if (featuresCount === expected) return null;
  return `Modelo ${modelType} incompatible: se esperaban ${expected} features, hay ${featuresCount}.`;
}

export interface UseSignStudioCaptureParams {
  selectedSignId: string;
  signs: Sign[];
  globalSigns: Sign[];
  selectedRegionId: string;
  dominantHand: "right" | "left";
  models: StudioModel[];
  selectedPlaybackRecording: SignRecording | null;
  fetchSigns: () => Promise<void> | void;
  fetchSignRecordings: () => Promise<void> | void;
  fetchGlobalSigns: () => Promise<void> | void;
}

export function useSignStudioCapture({
  selectedSignId,
  signs,
  globalSigns,
  selectedRegionId,
  dominantHand,
  models,
  selectedPlaybackRecording,
  fetchSigns,
  fetchSignRecordings,
  fetchGlobalSigns,
}: UseSignStudioCaptureParams) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaPipeTimestampRef = useRef(0);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const resetCaptureRef = useRef<() => void>(() => {});
  const dynamicSegmentBufferRef = useRef<LandmarkFrame[]>([]);
  const enterReviewModeRef = useRef<(framesOverride?: LandmarkFrame[]) => void>(
    () => {},
  );
  const latestOverlayRef = useRef<{
    pose: LandmarkPoint[] | null;
    leftHand: LandmarkPoint[] | null;
    rightHand: LandmarkPoint[] | null;
  } | null>(null);
  const isRecordingRef = useRef(false);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);
  const [handLandmarker, setHandLandmarker] = useState<HandLandmarker | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [previewFrame, setPreviewFrame] = useState(0);
  const [landmarksBuffer, setLandmarksBuffer] = useState<LandmarkFrame[]>([]);
  const [recordCapturePhase, setRecordCapturePhase] = useState<
    "idle" | UiCapturePhase
  >("idle");
  const [recordStableCount, setRecordStableCount] = useState(0);
  const [recordCaptureCount, setRecordCaptureCount] = useState(0);
  const [recordHandVisible, setRecordHandVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [sampleTestModelId, setSampleTestModelId] = useState("");
  const [sampleTestResult, setSampleTestResult] = useState<SampleTestResult | null>(null);
  const [sampleTestLoading, setSampleTestLoading] = useState(false);
  const fetchGlobalSignsRef = useRef(fetchGlobalSigns);

  useEffect(() => {
    fetchGlobalSignsRef.current = fetchGlobalSigns;
  }, [fetchGlobalSigns]);

  // Initialize MediaPipe
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const { pose, hands } = await createVisionLandmarkers();
        if (cancelled) {
          closeVisionLandmarkers(pose, hands);
          return;
        }
        poseLandmarkerRef.current = pose;
        handLandmarkerRef.current = hands;
        setPoseLandmarker(pose);
        setHandLandmarker(hands);

        void fetchGlobalSignsRef.current();
      } catch (error) {
        console.error("Initialization error:", error);
        toast.error("Error inicializando componentes");
      } finally {
        setIsLoading(false);
      }
    }
    void init();

    return () => {
      cancelled = true;
      closeVisionLandmarkers(poseLandmarkerRef.current, handLandmarkerRef.current);
      poseLandmarkerRef.current = null;
      handLandmarkerRef.current = null;
      latestOverlayRef.current = null;
    };
  }, []);

  const startCamera = async () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        toast.error("No se pudo acceder a la cámara");
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (selectedSignId && !isLoading && isCameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [selectedSignId, isLoading, isCameraActive]);

  // Visual feedback: Draw landmarks on canvas
  useEffect(() => {
    let requestRef: number;
    let frameIndex = 0;
    let alive = true;

    const draw = async () => {
      if (!alive) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas) {
        requestRef = requestAnimationFrame(draw);
        return;
      }

      if (isReviewing && landmarksBuffer.length > 0) {
        // PLAYBACK LOOP MODE - Dark background for clarity
        if (video?.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        } else if (!canvas.width || !canvas.height) {
          canvas.width = 640;
          canvas.height = 480;
        }
        ctx.fillStyle = "#020617"; // Slate 950
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const currentFrame = landmarksBuffer[frameIndex];

        if (currentFrame) {
          drawOverlayLandmarks(
            ctx,
            currentFrame.pose,
            currentFrame.leftHand,
            currentFrame.rightHand,
            "0.2",
          );
        }

        frameIndex = (frameIndex + 1) % landmarksBuffer.length;
        setPreviewFrame(frameIndex);
        // Playback is faster than 100ms interval, around 10fps for review
        requestRef = setTimeout(() => {
          requestRef = requestAnimationFrame(draw);
        }, 100) as unknown as number;
        return;
      }

      if (isCameraActive && video && poseLandmarker && handLandmarker) {
        if (video.readyState >= 2) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // While recording, only the capture interval may call detectForVideo.
          // The draw loop reuses the last overlay frame to keep timestamps monotonic.
          if (isRecordingRef.current) {
            const overlay = latestOverlayRef.current;
            if (overlay) {
              drawOverlayLandmarks(
                ctx,
                overlay.pose,
                overlay.leftHand,
                overlay.rightHand,
              );
            }
          } else {
            try {
              const startTimeMs = nextMediaPipeTimestamp(mediaPipeTimestampRef);
              const poseResults = await poseLandmarker.detectForVideo(
                video,
                startTimeMs,
              );
              const handResults = await handLandmarker.detectForVideo(
                video,
                startTimeMs,
              );

              const poseRaw = poseResults.landmarks?.[0] || null;
              const { leftHandRaw, rightHandRaw } =
                pickHandLandmarks(handResults);

              latestOverlayRef.current = {
                pose: poseRaw,
                leftHand: leftHandRaw,
                rightHand: rightHandRaw,
              };
              drawOverlayLandmarks(ctx, poseRaw, leftHandRaw, rightHandRaw);
            } catch (error) {
              console.error("MediaPipe preview error:", error);
            }
          }
        }
      }
      requestRef = requestAnimationFrame(draw);
    };

    requestRef = requestAnimationFrame(draw);
    return () => {
      alive = false;
      cancelAnimationFrame(requestRef);
      clearTimeout(requestRef);
    };
  }, [isCameraActive, isReviewing, poseLandmarker, handLandmarker, landmarksBuffer]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const selectedSignDetectionType: SignDetectionType =
    [...signs, ...globalSigns].find((s) => s.id === selectedSignId)
      ?.detectionType ?? "static";

  const resetRecordingCapture = () => {
    resetCaptureRef.current();
    dynamicSegmentBufferRef.current = [];
    latestOverlayRef.current = null;
    setRecordStableCount(0);
    setRecordCaptureCount(0);
    setRecordHandVisible(false);
    setRecordCapturePhase("idle");
  };

  /** Pasa a revisión con replay. En dinámicas los frames viven en el ref hasta el cierre. */
  const enterReviewMode = useCallback(
    (framesOverride?: LandmarkFrame[]) => {
      const selectedSign = [...signs, ...globalSigns].find(
        (s) => s.id === selectedSignId,
      );
      const isDynamic = (selectedSign?.detectionType ?? "static") === "dynamic";

      let frames = framesOverride;
      if (!frames) {
        if (isDynamic && dynamicSegmentBufferRef.current.length > 0) {
          frames = [...dynamicSegmentBufferRef.current];
          dynamicSegmentBufferRef.current = [];
        } else {
          frames = landmarksBuffer;
        }
      }

      setIsRecording(false);
      setRecordCaptureCount(0);
      setRecordCapturePhase("idle");

      if (!frames || frames.length === 0) {
        setLandmarksBuffer([]);
        setIsReviewing(false);
        resetCaptureRef.current();
        dynamicSegmentBufferRef.current = [];
        latestOverlayRef.current = null;
        setRecordStableCount(0);
        setRecordCaptureCount(0);
        setRecordHandVisible(false);
        setRecordCapturePhase("idle");
        toast.error(
          isDynamic
            ? "No se capturó movimiento. Reposo → haz la seña → vuelve a reposo."
            : "No se capturaron frames. Mantén la seña estable frente a la cámara.",
        );
        return;
      }

      setLandmarksBuffer(frames);
      setIsReviewing(true);
    },
    [signs, globalSigns, selectedSignId, landmarksBuffer],
  );

  useEffect(() => {
    enterReviewModeRef.current = enterReviewMode;
  }, [enterReviewMode]);

  const { resetCapture } = useGestureCaptureLoop({
    enabled: isRecording,
    videoRef,
    poseLandmarkerRef,
    handLandmarkerRef,
    detectionType: selectedSignDetectionType,
    handlers: {
      onRawLandmarks: (pose, leftHand, rightHand) => {
        latestOverlayRef.current = { pose, leftHand, rightHand };
      },
      onStatus: ({ uiPhase, handVisible, restFrameCount, captureCount }) => {
        setRecordCapturePhase(uiPhase);
        setRecordHandVisible(handVisible);
        setRecordStableCount(restFrameCount);
        if (selectedSignDetectionType === "dynamic") {
          setRecordCaptureCount(captureCount);
        }
      },
      onFillAborted: () => {
        dynamicSegmentBufferRef.current = [];
        setRecordCapturePhase("waiting");
        setRecordStableCount(0);
        setRecordHandVisible(false);
        setLandmarksBuffer([]);
        setRecordCaptureCount(0);
      },
      onTooLong: () => {
        dynamicSegmentBufferRef.current = [];
        setRecordCaptureCount(0);
        setRecordCapturePhase("waiting");
        toast.error(
          `Gesto demasiado largo (>${MAX_DYNAMIC_CAPTURE_FRAMES} frames). Vuelve a reposo e inténtalo de nuevo.`,
        );
      },
      onStaticFrame: (flat, raw) => {
        const kp = {
          pose: raw.pose,
          leftHand: raw.leftHand,
          rightHand: raw.rightHand,
          flat,
        };
        setLandmarksBuffer((prev) => {
          if (prev.length >= TARGET_CAPTURE_FRAMES) return prev;
          return [...prev, kp];
        });
      },
      onDynamicFrame: (flat, raw) => {
        dynamicSegmentBufferRef.current.push({
          pose: raw.pose,
          leftHand: raw.leftHand,
          rightHand: raw.rightHand,
          flat,
        });
      },
      onDynamicGesture: () => {
        const segment = [...dynamicSegmentBufferRef.current];
        dynamicSegmentBufferRef.current = [];
        setRecordCaptureCount(0);
        queueMicrotask(() => enterReviewModeRef.current(segment));
      },
    },
  });

  useEffect(() => {
    resetCaptureRef.current = resetCapture;
  }, [resetCapture]);

  useEffect(() => {
    if (!isRecording || isReviewing) return;
    if (selectedSignDetectionType !== "static") return;
    if (landmarksBuffer.length < TARGET_CAPTURE_FRAMES) return;
    queueMicrotask(() => enterReviewModeRef.current(landmarksBuffer));
  }, [
    landmarksBuffer,
    isRecording,
    isReviewing,
    selectedSignDetectionType,
  ]);

  const handleSave = async () => {
    if (!selectedSignId) return;

    const selectedSign = [...signs, ...globalSigns].find(
      (s) => s.id === selectedSignId,
    );
    const isDynamic = (selectedSign?.detectionType ?? "static") === "dynamic";
    // No borrar frames intermedios (saltos temporales). Validar por ratio de manos.
    const frames = landmarksBuffer;
    const minFrames = isDynamic ? MIN_GESTURE_FRAMES : MIN_CAPTURE_FRAMES;
    const handRatio = recordingHandFrameRatio(frames);

    if (frames.length < minFrames) {
      toast.error(
        `Necesitas al menos ${minFrames} frames${isDynamic ? " de movimiento" : " con la seña en cámara"} (tienes ${frames.length})`,
      );
      return;
    }

    if (handRatio < 0.8) {
      toast.error(
        `Grabación con poca detección de manos (${Math.round(handRatio * 100)}%). Repite la captura.`,
      );
      return;
    }

    try {
      setIsSaving(true);
      const res = await signRecordApi.saveLandmarks({
        signId: selectedSignId,
        regionId: selectedRegionId || undefined,
        landmarks: frames,
        dominantHand: dominantHand
      });
      if (res.success) {
        toast.success("Landmarks guardados con éxito");
        setLandmarksBuffer([]);
        setIsReviewing(false);
        resetRecordingCapture();
        fetchSigns();
        fetchSignRecordings();
      } else {
        toast.error(res.message || "Error al guardar landmarks");
      }
    } catch (error) {
      toast.error("Error al guardar");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestRecordingWithModel = async () => {
    if (!selectedPlaybackRecording?.landmarks?.length) return;

    const model = models.find(
      (m) => m.id === sampleTestModelId && m.status === "READY",
    );
    if (!model?.modelJsonUrl) {
      toast.error("Selecciona un modelo listo para probar");
      return;
    }
    if (!isSupportedSchemaVersion(model.featuresSchemaVersion)) {
      toast.error(UNSUPPORTED_SCHEMA_MESSAGE);
      return;
    }

    const signName =
      signs.find((s) => s.id === selectedSignId)?.name ||
      globalSigns.find((s) => s.id === selectedSignId)?.name;

    setSampleTestLoading(true);
    setSampleTestResult(null);

    let tfModel: Awaited<ReturnType<typeof loadTfModelFromUrl>>["model"] | null =
      null;
    try {
      const loaded = await loadTfModelFromUrl(
        model.modelJsonUrl,
        BACKEND_BASE_URL,
      );
      tfModel = loaded.model;
      const { sequenceLength, featuresCount, modelType } = loaded;

      const labels = model.labels || [];
      let prediction;

      const featuresMismatch = featuresCountMismatch(modelType, featuresCount);
      if (featuresMismatch) {
        toast.error(featuresMismatch);
        return;
      }

      if (modelType === "static") {
        const frames = selectedPlaybackRecording.landmarks;
        const flat = normalizeTrainingFrame(frames[Math.floor(frames.length / 2)]);
        if (flat.length === 0) {
          toast.error("La muestra no tiene vectores flat válidos");
          return;
        }
        prediction = runStaticModelInference(tfModel, flat, labels, signName);
      } else {
        const buffer = buildDynamicInferenceSequence(
          selectedPlaybackRecording.landmarks,
          sequenceLength,
        );
        if (!buffer) {
          toast.error("La muestra no tiene vectores flat válidos");
          return;
        }
        prediction = runModelInference(tfModel, buffer, labels, signName);
      }
      const handRatio = recordingHandFrameRatio(
        selectedPlaybackRecording.landmarks,
      );

      setSampleTestResult({
        topLabel: prediction.topLabel,
        topScore: prediction.topScore,
        targetScore: prediction.targetScore,
        handRatio,
        sequenceLength,
      });
    } catch (err) {
      console.error(err);
      toast.error("Error al probar la muestra con el modelo");
    } finally {
      setSampleTestLoading(false);
      tfModel?.dispose();
    }
  };

  return {
    videoRef,
    canvasRef,
    isLoading,
    isRecording,
    setIsRecording,
    isReviewing,
    setIsReviewing,
    previewFrame,
    landmarksBuffer,
    setLandmarksBuffer,
    recordCapturePhase,
    setRecordCapturePhase,
    recordStableCount,
    recordCaptureCount,
    recordHandVisible,
    isSaving,
    isCameraActive,
    setIsCameraActive,
    sampleTestModelId,
    setSampleTestModelId,
    sampleTestResult,
    setSampleTestResult,
    sampleTestLoading,
    enterReviewMode,
    resetRecordingCapture,
    handleSave,
    handleTestRecordingWithModel,
  };
}
