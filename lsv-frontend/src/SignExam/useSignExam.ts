import { useRef, useState, useEffect, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import { PoseLandmarker, HandLandmarker } from "@mediapipe/tasks-vision";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import confetti from "canvas-confetti";
import { signRecordApi, lessonApi, unwrapApiData, unwrapApiList } from "../services/api";
import { BACKEND_BASE_URL } from "../config";
import { useGestureCaptureLoop } from "../hooks/useGestureCaptureLoop";
import { useToast } from "../components/ToastProvider";
import type { LessonModelsBundleDto } from "../types/signRecord";
import {
  CONFIDENCE_THRESHOLD,
  INFERENCE_VOTE_REQUIRED,
  MAX_DYNAMIC_EXAM_ATTEMPTS,
  buildDynamicInferenceSequence,
  minFramesBeforeInference,
  createVisionLandmarkers,
  loadLessonModelsFromApi,
  runStaticModelInference,
  runModelInference,
  applyPredictionToVotes,
  type SignDetectionType,
  type UiCapturePhase,
} from "../utils/signDetection";

export function useSignExam() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const addToast = useToast();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const confidenceVotesRef = useRef<number[]>([]);
  const isRecognizingRef = useRef(false);
  const recognizedCountRef = useRef(0);
  const staticModelRef = useRef<tf.LayersModel | null>(null);
  const dynamicModelRef = useRef<tf.LayersModel | null>(null);
  const staticLabelsRef = useRef<string[]>([]);
  const dynamicLabelsRef = useRef<string[]>([]);
  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const signsRef = useRef<{ id: string; name: string; detectionType?: SignDetectionType }[]>([]);
  const currentIndexRef = useRef(0);
  const dynamicSeqLengthRef = useRef(30);
  const dynamicAttemptRef = useRef(0);
  const pendingTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const resetCaptureRef = useRef<() => void>(() => {});

  const [signs, setSigns] = useState<{ id: string; name: string; detectionType?: SignDetectionType }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lessonName, setLessonName] = useState("");
  const [loadedModelName, setLoadedModelName] = useState("");
  const [dynamicSeqLength, setDynamicSeqLength] = useState(30);
  const [bufferFill, setBufferFill] = useState(0);
  const [capturePhase, setCapturePhase] = useState<UiCapturePhase>("waiting");
  const [stableFramesCount, setStableFramesCount] = useState(0);
  const [gestureRetryHint, setGestureRetryHint] = useState(false);
  const [dynamicAttempt, setDynamicAttempt] = useState(0);
  const [gestureTooLongHint, setGestureTooLongHint] = useState(false);
  const [prediction, setPrediction] = useState<{ label: string; confidence: number } | null>(null);
  const [modelGuess, setModelGuess] = useState<{ label: string; confidence: number } | null>(null);
  const [recognitionProgress, setRecognitionProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [allRecognized, setAllRecognized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMediaPipeReady, setIsMediaPipeReady] = useState(false);

  const regionId =
    (location.state as { regionId?: string } | null)?.regionId ||
    searchParams.get("regionId") ||
    undefined;

  const clearPendingTimeouts = useCallback(() => {
    pendingTimeoutsRef.current.forEach((id) => clearTimeout(id));
    pendingTimeoutsRef.current = [];
  }, []);

  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter((t) => t !== id);
      fn();
    }, ms);
    pendingTimeoutsRef.current.push(id);
    return id;
  }, []);

  const resetDetectionState = useCallback(() => {
    confidenceVotesRef.current = [];
    resetCaptureRef.current();
    isRecognizingRef.current = false;
    setBufferFill(0);
    setCapturePhase("waiting");
    setStableFramesCount(0);
    setGestureRetryHint(false);
    setGestureTooLongHint(false);
    setRecognitionProgress(0);
    setPrediction(null);
    setModelGuess(null);
  }, []);

  const resetForNextSign = useCallback(() => {
    clearPendingTimeouts();
    dynamicAttemptRef.current = 0;
    setDynamicAttempt(0);
    resetDetectionState();
  }, [clearPendingTimeouts, resetDetectionState]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const disposeResources = useCallback(() => {
    clearPendingTimeouts();
    stopCamera();
    staticModelRef.current?.dispose();
    staticModelRef.current = null;
    dynamicModelRef.current?.dispose();
    dynamicModelRef.current = null;
    poseLandmarkerRef.current?.close();
    poseLandmarkerRef.current = null;
    handLandmarkerRef.current?.close();
    handLandmarkerRef.current = null;
  }, [clearPendingTimeouts, stopCamera]);

  const startCamera = useCallback(async () => {
    if (streamRef.current) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      setError("No se pudo acceder a la cámara. Por favor, verifica los permisos.");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        setIsLoading(true);
        setError(null);
        resetDetectionState();
        recognizedCountRef.current = 0;

        const lessonRes = await lessonApi.getUserLesson(lessonId!);
        if (!lessonRes.success) {
          throw new Error("No se pudo cargar la información de la lección");
        }
        if (controller.signal.aborted) return;
        const lessonInfo = unwrapApiData<{ name?: string }>(lessonRes.data);
        setLessonName(lessonInfo?.name ?? "");

        const signsRes = await signRecordApi.getLessonSigns(lessonId!, regionId);
        if (!signsRes.success) {
          throw new Error("No se pudieron cargar las señas de la lección");
        }

        const signsData = unwrapApiList<{
          id: string;
          name: string;
          detectionType?: SignDetectionType;
        }>(signsRes.data);
        if (!signsData?.length) {
          throw new Error("Esta lección no tiene señas configuradas para práctica");
        }
        if (controller.signal.aborted) return;
        setSigns(signsData);
        signsRef.current = signsData;

        const needsStatic = signsData.some(
          (sign: { detectionType?: SignDetectionType }) =>
            (sign.detectionType ?? "static") === "static",
        );
        const needsDynamic = signsData.some(
          (sign: { detectionType?: SignDetectionType }) =>
            sign.detectionType === "dynamic",
        );

        const modelRes = await signRecordApi.getLessonModel(lessonId!, regionId);
        if (!modelRes.success || !modelRes.data) {
          throw new Error(
            "No se encontró un modelo entrenado para esta lección. Por favor, asegúrate de que el modelo esté entrenado y listo.",
          );
        }
        if (controller.signal.aborted) return;

        const lessonModels = unwrapApiData<LessonModelsBundleDto>(modelRes.data);
        if (needsStatic && !lessonModels.static) {
          throw new Error(
            "Esta lección requiere un modelo estático que aún no está entrenado.",
          );
        }
        if (needsDynamic && !lessonModels.dynamic) {
          throw new Error(
            "Esta lección requiere un modelo dinámico (LSTM) que aún no está entrenado.",
          );
        }

        const loadedModels = await loadLessonModelsFromApi(
          {
            static: lessonModels.static?.modelJsonUrl
              ? {
                  id: lessonModels.static.id,
                  name: lessonModels.static.name,
                  modelJsonUrl: lessonModels.static.modelJsonUrl,
                  labels: lessonModels.static.labels ?? undefined,
                  modelType: lessonModels.static.modelType,
                  featuresCount: lessonModels.static.featuresCount,
                  featuresSchemaVersion:
                    lessonModels.static.featuresSchemaVersion,
                }
              : null,
            dynamic: lessonModels.dynamic?.modelJsonUrl
              ? {
                  id: lessonModels.dynamic.id,
                  name: lessonModels.dynamic.name,
                  modelJsonUrl: lessonModels.dynamic.modelJsonUrl,
                  labels: lessonModels.dynamic.labels ?? undefined,
                  modelType: lessonModels.dynamic.modelType,
                  featuresCount: lessonModels.dynamic.featuresCount,
                  featuresSchemaVersion:
                    lessonModels.dynamic.featuresSchemaVersion,
                }
              : null,
          },
          BACKEND_BASE_URL,
        );
        if (controller.signal.aborted) {
          loadedModels.static?.model.dispose();
          loadedModels.dynamic?.model.dispose();
          return;
        }

        staticModelRef.current = loadedModels.static?.model ?? null;
        dynamicModelRef.current = loadedModels.dynamic?.model ?? null;
        staticLabelsRef.current = loadedModels.static?.labels ?? [];
        dynamicLabelsRef.current = loadedModels.dynamic?.labels ?? [];
        dynamicSeqLengthRef.current = loadedModels.dynamic?.sequenceLength ?? 30;
        setDynamicSeqLength(loadedModels.dynamic?.sequenceLength ?? 30);

        const modelNames = [
          lessonModels.static?.name,
          lessonModels.dynamic?.name,
        ].filter(Boolean);
        setLoadedModelName(modelNames.join(" + ") || "Modelo de lección");

        const { pose, hands } = await createVisionLandmarkers();
        if (controller.signal.aborted) {
          pose.close();
          hands.close();
          loadedModels.static?.model.dispose();
          loadedModels.dynamic?.model.dispose();
          return;
        }
        poseLandmarkerRef.current = pose;
        handLandmarkerRef.current = hands;
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          console.error(err);
          const message =
            err instanceof Error ? err.message : "Error al inicializar la práctica";
          // loadLessonModelsFromApi already returns Spanish schema/feature errors.
          setError(message);
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => {
      controller.abort();
      disposeResources();
    };
  }, [lessonId, regionId, disposeResources, resetDetectionState]);

  useEffect(() => {
    if (!isLoading && !isFinished && !error) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isLoading, isFinished, error, startCamera, stopCamera]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
    resetForNextSign();
  }, [currentIndex, resetForNextSign]);

  const currentDetectionType: SignDetectionType =
    signs[currentIndex]?.detectionType ?? "static";

  const handleGoBack = () => {
    disposeResources();
    const navState = location.state as { from?: string; returnState?: unknown } | null;
    if (navState?.from) {
      navigate(
        navState.from,
        navState.returnState ? { state: navState.returnState } : undefined,
      );
    } else if (lessonId) {
      navigate(`/lesson/${lessonId}`);
    } else {
      navigate(-1);
    }
  };

  const handleFinish = useCallback(async () => {
    setIsFinished(true);
    setIsSuccess(false);
    const fullyRecognized = recognizedCountRef.current === signsRef.current.length;
    setAllRecognized(fullyRecognized);

    confetti({
      particleCount: 200,
      spread: 160,
      origin: { y: 0.4 },
    });

    if (fullyRecognized) {
      try {
        const res = await lessonApi.setLessonCompletion(lessonId!, true);
        if (!res.success) {
          addToast(
            "error",
            res.message ||
              "No se pudo marcar la lección como completada. Intenta de nuevo más tarde.",
          );
        }
      } catch (err) {
        console.error("Error al marcar lección como completada", err);
        addToast(
          "error",
          "No se pudo marcar la lección como completada. Intenta de nuevo más tarde.",
        );
      }
    }
  }, [lessonId, addToast]);

  const handleCorrect = useCallback(() => {
    if (isRecognizingRef.current) return;
    isRecognizingRef.current = true;
    recognizedCountRef.current += 1;

    setIsSuccess(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    scheduleTimeout(() => {
      const idx = currentIndexRef.current;
      if (idx < signsRef.current.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setIsSuccess(false);
      } else {
        handleFinish();
      }
    }, 2500);
  }, [handleFinish, scheduleTimeout]);

  const handleSkip = useCallback(() => {
    if (isRecognizingRef.current || isSuccess) return;
    isRecognizingRef.current = true;

    if (currentIndexRef.current < signsRef.current.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      isRecognizingRef.current = false;
    } else {
      handleFinish();
    }
  }, [handleFinish, isSuccess]);

  const runStaticInference = (frame: number[]) => {
    const tfModel = staticModelRef.current;
    const currentSign = signsRef.current[currentIndexRef.current];
    if (!tfModel || !currentSign || isRecognizingRef.current) return;

    const prediction = runStaticModelInference(
      tfModel,
      frame,
      staticLabelsRef.current,
      currentSign.name,
    );

    setPrediction({ label: currentSign.name, confidence: prediction.targetScore });
    setModelGuess({
      label: prediction.topLabel,
      confidence: prediction.topScore,
    });

    const hitCount = applyPredictionToVotes(
      prediction,
      confidenceVotesRef,
      handleCorrect,
    );
    setRecognitionProgress(
      Math.min(100, (hitCount / INFERENCE_VOTE_REQUIRED) * 100),
    );
  };

  const runDynamicInference = (gesture: number[][]) => {
    const tfModel = dynamicModelRef.current;
    const currentSign = signsRef.current[currentIndexRef.current];
    if (!tfModel || !currentSign || isRecognizingRef.current) return;

    const inputSequence = buildDynamicInferenceSequence(
      gesture,
      dynamicSeqLengthRef.current,
    );
    if (!inputSequence) return;

    const prediction = runModelInference(
      tfModel,
      inputSequence,
      dynamicLabelsRef.current,
      currentSign.name,
    );

    setPrediction({
      label: currentSign.name,
      confidence: prediction.targetScore,
    });
    setModelGuess({
      label: prediction.topLabel,
      confidence: prediction.topScore,
    });

    setBufferFill(0);
    setCapturePhase("waiting");

    if (prediction.targetScore >= CONFIDENCE_THRESHOLD) {
      handleCorrect();
      return;
    }

    dynamicAttemptRef.current += 1;
    setDynamicAttempt(dynamicAttemptRef.current);
    setGestureRetryHint(true);
    setRecognitionProgress(0);
    resetCaptureRef.current();

    if (dynamicAttemptRef.current >= MAX_DYNAMIC_EXAM_ATTEMPTS) {
      scheduleTimeout(() => {
        if (isRecognizingRef.current) return;
        handleSkip();
      }, 1800);
    }
  };

  const { resetCapture } = useGestureCaptureLoop({
    enabled: !isLoading && !isFinished && !error,
    paused: isSuccess,
    videoRef,
    canvasRef,
    poseLandmarkerRef,
    handLandmarkerRef,
    detectionType: currentDetectionType,
    handlers: {
      onVisionReady: () => setIsMediaPipeReady(true),
      onStatus: ({ uiPhase, handVisible, restFrameCount, captureCount }) => {
        if (isRecognizingRef.current) return;

        const isDynamic = currentDetectionType === "dynamic";
        setCapturePhase(
          uiPhase === "collecting" && !isDynamic ? "analyzing" : uiPhase,
        );
        setStableFramesCount(restFrameCount);
        if (isDynamic) {
          setBufferFill(captureCount);
          setGestureTooLongHint(false);
        }
        if (handVisible) {
          setGestureRetryHint(false);
        } else if (!isDynamic && uiPhase === "waiting") {
          confidenceVotesRef.current = [];
          setBufferFill(0);
          setRecognitionProgress(0);
          setPrediction(null);
          setModelGuess(null);
        } else if (!handVisible) {
          setPrediction(null);
          setModelGuess(null);
        }
      },
      onFillAborted: () => {
        confidenceVotesRef.current = [];
        setBufferFill(0);
        setRecognitionProgress(0);
        setPrediction(null);
        setModelGuess(null);
        setCapturePhase("waiting");
      },
      onTooLong: () => {
        setGestureTooLongHint(true);
        setBufferFill(0);
        setCapturePhase("waiting");
        dynamicAttemptRef.current += 1;
        setDynamicAttempt(dynamicAttemptRef.current);
        setGestureRetryHint(true);
        resetCaptureRef.current();
        if (dynamicAttemptRef.current >= MAX_DYNAMIC_EXAM_ATTEMPTS) {
          scheduleTimeout(() => {
            if (isRecognizingRef.current) return;
            handleSkip();
          }, 1800);
        }
      },
      onStaticFrame: (flat) => {
        if (isRecognizingRef.current) return;
        runStaticInference(flat);
      },
      onDynamicGesture: (gesture) => {
        if (isRecognizingRef.current) return;
        setCapturePhase("analyzing");
        runDynamicInference(gesture);
      },
    },
  });

  useEffect(() => {
    resetCaptureRef.current = resetCapture;
  }, [resetCapture]);

  useEffect(() => {
    return () => clearPendingTimeouts();
  }, [clearPendingTimeouts]);

  const minCaptureFrames = minFramesBeforeInference(dynamicSeqLength);

  return {
    videoRef,
    canvasRef,
    signs,
    currentIndex,
    lessonName,
    loadedModelName,
    bufferFill,
    capturePhase,
    stableFramesCount,
    gestureRetryHint,
    dynamicAttempt,
    gestureTooLongHint,
    prediction,
    modelGuess,
    recognitionProgress,
    isLoading,
    isSuccess,
    isFinished,
    allRecognized,
    error,
    isMediaPipeReady,
    minCaptureFrames,
    handleGoBack,
    handleSkip,
  };
}
