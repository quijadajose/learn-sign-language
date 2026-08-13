import { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import {
  PoseLandmarker,
  HandLandmarker,
} from "@mediapipe/tasks-vision";
import { BACKEND_BASE_URL } from "../../config";
import { useGestureCaptureLoop } from "../../hooks/useGestureCaptureLoop";
import {
  closeVisionLandmarkers,
  createVisionLandmarkers,
  buildDynamicInferenceSequence,
  loadTfModelFromUrl,
  runStaticModelInference,
  runModelInference,
  isSupportedSchemaVersion,
  UNSUPPORTED_SCHEMA_MESSAGE,
  DYNAMIC_FEATURES_COUNT,
  STATIC_FEATURES_COUNT,
  type SignDetectionType,
  type UiCapturePhase,
} from "../../utils/signDetection";

export interface SignTesterModel {
  id: string;
  name: string;
  modelJsonUrl: string;
  labels?: string[];
  featuresSchemaVersion?: string | null;
}

export function useSignTester(
  show: boolean,
  model: SignTesterModel | null,
  onClose: () => void,
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tfModelRef = useRef<tf.LayersModel | null>(null);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<{
    label: string;
    confidence: number;
  } | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [dynamicSeqLength, setDynamicSeqLength] = useState(30);
  const [modelType, setModelType] = useState<SignDetectionType>("dynamic");
  const [isMediaPipeReady, setIsMediaPipeReady] = useState(false);
  const [capturePhase, setCapturePhase] = useState<UiCapturePhase>("waiting");
  const [restFrameCount, setRestFrameCount] = useState(0);
  const [movementFrameCount, setMovementFrameCount] = useState(0);
  const [handVisible, setHandVisible] = useState(false);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsMediaPipeReady(false);
    setPrediction(null);
    setHandVisible(false);
    setCapturePhase("waiting");
    setRestFrameCount(0);
    setMovementFrameCount(0);
  };

  const disposeServices = () => {
    stopCamera();
    tfModelRef.current?.dispose();
    tfModelRef.current = null;
    closeVisionLandmarkers(
      poseLandmarkerRef.current,
      handLandmarkerRef.current,
    );
    poseLandmarkerRef.current = null;
    handLandmarkerRef.current = null;
  };

  useEffect(() => {
    const controller = new AbortController();

    const initServices = async () => {
      if (!model) return;

      disposeServices();
      try {
        setIsLoading(true);
        setError(null);

        // Antes de bajar los pesos: si el schema es viejo no hay nada que probar.
        if (!isSupportedSchemaVersion(model.featuresSchemaVersion)) {
          throw new Error(UNSUPPORTED_SCHEMA_MESSAGE);
        }

        const loadedModel = await loadTfModelFromUrl(
          model.modelJsonUrl,
          BACKEND_BASE_URL,
        );
        if (controller.signal.aborted) {
          loadedModel.model.dispose();
          return;
        }

        const expectedFeatures =
          loadedModel.modelType === "dynamic"
            ? DYNAMIC_FEATURES_COUNT
            : STATIC_FEATURES_COUNT;
        if (loadedModel.featuresCount !== expectedFeatures) {
          loadedModel.model.dispose();
          throw new Error(
            `Modelo ${loadedModel.modelType} incompatible: se esperaban ${expectedFeatures} features, hay ${loadedModel.featuresCount}.`,
          );
        }

        setDynamicSeqLength(loadedModel.sequenceLength);
        setModelType(loadedModel.modelType);
        tfModelRef.current = loadedModel.model;

        const { pose, hands } = await createVisionLandmarkers();
        if (controller.signal.aborted) {
          closeVisionLandmarkers(pose, hands);
          loadedModel.model.dispose();
          tfModelRef.current = null;
          return;
        }

        poseLandmarkerRef.current = pose;
        handLandmarkerRef.current = hands;
        setIsCameraActive(true);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        if (controller.signal.aborted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          console.error(err);
          const message =
            err instanceof Error ? err.message : "Error desconocido";
          setError(
            "Error al cargar el modelo o servicios de visión: " + message,
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (show && model) {
      void initServices();
    } else {
      disposeServices();
    }

    return () => {
      controller.abort();
      disposeServices();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-init only when modal opens or model changes
  }, [show, model?.id]);

  const runInference = (gesture: number[][], currentFlat?: number[]) => {
    const tfModel = tfModelRef.current;
    if (!tfModel || !model?.labels) return;

    if (modelType === "static" && currentFlat) {
      const result = runStaticModelInference(
        tfModel,
        currentFlat,
        model.labels,
      );
      setPrediction({ label: result.topLabel, confidence: result.topScore });
      return;
    }

    const buffer = buildDynamicInferenceSequence(gesture, dynamicSeqLength);
    if (!buffer) return;

    const result = runModelInference(tfModel, buffer, model.labels);
    setPrediction({ label: result.topLabel, confidence: result.topScore });
  };

  useGestureCaptureLoop({
    enabled: show && isCameraActive && !isLoading && !error,
    videoRef,
    canvasRef,
    poseLandmarkerRef,
    handLandmarkerRef,
    detectionType: modelType,
    handlers: {
      onVisionReady: () => setIsMediaPipeReady(true),
      onStatus: ({ uiPhase, handVisible: visible, restFrameCount: rest, captureCount }) => {
        setCapturePhase(uiPhase);
        setHandVisible(visible);
        setRestFrameCount(rest);
        setMovementFrameCount(captureCount);
      },
      onFillAborted: () => {
        setCapturePhase("waiting");
        setRestFrameCount(0);
        setMovementFrameCount(0);
        setPrediction(null);
      },
      onTooLong: () => {
        setCapturePhase("waiting");
        setMovementFrameCount(0);
        setPrediction(null);
      },
      onStaticFrame: (flat) => {
        runInference([flat], flat);
      },
      onDynamicGesture: (gesture) => {
        setCapturePhase("analyzing");
        runInference(gesture);
        setMovementFrameCount(0);
      },
    },
  });

  const handleClose = () => {
    disposeServices();
    onClose();
  };

  return {
    videoRef,
    canvasRef,
    isLoading,
    error,
    prediction,
    capturePhase,
    restFrameCount,
    movementFrameCount,
    handVisible,
    modelType,
    isMediaPipeReady,
    handleClose,
  };
}
