import React from "react";
import { Button, Card, Progress, Spinner } from "flowbite-react";
import { HiCheckCircle } from "react-icons/hi";
import { m } from "motion/react";
import {
  CONFIDENCE_THRESHOLD,
  REST_FRAMES_TO_START,
  STABLE_FRAMES_TO_START,
  MAX_DYNAMIC_CAPTURE_FRAMES,
  MAX_DYNAMIC_EXAM_ATTEMPTS,
  type SignDetectionType,
  type UiCapturePhase,
} from "../utils/signDetection";

type SignExamCameraViewProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isLoading: boolean;
  isFinished: boolean;
  isSuccess: boolean;
  isMediaPipeReady: boolean;
  allRecognized: boolean;
  signs: { id: string; name: string; detectionType?: SignDetectionType }[];
  currentIndex: number;
  prediction: { label: string; confidence: number } | null;
  modelGuess: { label: string; confidence: number } | null;
  capturePhase: UiCapturePhase;
  bufferFill: number;
  stableFramesCount: number;
  gestureRetryHint: boolean;
  gestureTooLongHint: boolean;
  dynamicAttempt: number;
  recognitionProgress: number;
  minCaptureFrames: number;
  onGoBack: () => void;
};

const SignExamCameraView: React.FC<SignExamCameraViewProps> = ({
  videoRef,
  canvasRef,
  isLoading,
  isFinished,
  isSuccess,
  isMediaPipeReady,
  allRecognized,
  signs,
  currentIndex,
  prediction,
  modelGuess,
  capturePhase,
  bufferFill,
  stableFramesCount,
  gestureRetryHint,
  gestureTooLongHint,
  dynamicAttempt,
  recognitionProgress,
  minCaptureFrames,
  onGoBack,
}) => {
  return (
    <Card className="overflow-hidden border-none bg-white shadow-2xl dark:bg-gray-900">
      {isLoading ? (
        <div className="flex h-[480px] flex-col items-center justify-center space-y-4">
          <Spinner size="xl" color="info" />
          <p className="animate-pulse font-medium text-gray-400">
            Cargando inteligencia artificial...
          </p>
        </div>
      ) : isFinished ? (
        <m.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex h-[480px] flex-col items-center justify-center p-8 text-center text-white"
        >
          <div className="rounded-full bg-green-500 p-6 shadow-[0_0_50px_rgba(34,197,94,0.5)]">
            <HiCheckCircle className="size-20" />
          </div>
          <h2 className="mt-8 text-5xl font-black">¡Práctica Completada!</h2>
          <p className="mt-4 text-xl text-gray-400">
            {allRecognized
              ? "Has dominado todas las señas de esta lección."
              : "Has recorrido todas las señas. Repite la práctica para reconocerlas sin omitir."}
          </p>
          <div className="mt-10 flex space-x-4">
            <Button size="xl" color="info" onClick={onGoBack}>
              Volver al Menú
            </Button>
            <Button size="xl" color="gray" onClick={() => window.location.reload()}>
              Repetir Práctica
            </Button>
          </div>
        </m.div>
      ) : (
        <div className="relative aspect-video w-full bg-gray-100 dark:bg-black">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="mirror size-full object-cover"
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="mirror pointer-events-none absolute inset-0 size-full object-cover"
          />

          {!isMediaPipeReady && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm">
              <Spinner size="xl" color="info" />
              <p className="mt-4 animate-pulse text-sm font-medium uppercase tracking-widest text-white">
                Iniciando Visión Artificial...
              </p>
            </div>
          )}

          {isSuccess ? (
            <m.div
              key="success-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-green-500/30"
            >
              <m.div
                initial={{ scale: 0.95, rotate: -20, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                className="text-center text-white"
              >
                <HiCheckCircle className="mx-auto size-32 drop-shadow-2xl" />
                <h3 className="mt-4 text-5xl font-black tracking-tight">¡Excelente!</h3>
              </m.div>
            </m.div>
          ) : null}

          <div className="absolute inset-x-6 bottom-6 space-y-2">
            <div className="rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-xl">
              <div className="mb-2 flex justify-between text-xs font-black uppercase tracking-widest text-white">
                <span>
                  Confianza para {signs[currentIndex]?.name || "seña"}
                </span>
                <span
                  className={
                    prediction && prediction.confidence >= CONFIDENCE_THRESHOLD
                      ? "text-green-400"
                      : "text-yellow-400"
                  }
                >
                  {prediction ? `${(prediction.confidence * 100).toFixed(0)}%` : "0%"}
                </span>
              </div>
              <Progress
                progress={prediction ? prediction.confidence * 100 : 0}
                color={
                  prediction && prediction.confidence >= CONFIDENCE_THRESHOLD
                    ? "green"
                    : "yellow"
                }
                size="sm"
              />
              {modelGuess ? (
                <p className="mt-2 text-[10px] text-white/70">
                  El modelo detecta:{" "}
                  <span className="font-bold text-white">
                    {modelGuess.label} ({(modelGuess.confidence * 100).toFixed(0)}%)
                  </span>
                  {modelGuess.label.toLowerCase() !==
                    signs[currentIndex]?.name?.toLowerCase() && (
                    <span className="block text-yellow-300/90">
                      No coincide con la seña pedida — mantén la pose firme
                    </span>
                  )}
                </p>
              ) : gestureTooLongHint ? (
                <p className="mt-2 text-[10px] text-red-300">
                  Gesto demasiado largo (&gt;{MAX_DYNAMIC_CAPTURE_FRAMES} frames). Reposa e inténtalo otra vez.
                </p>
              ) : capturePhase === "arming" ? (
                <p className="mt-2 text-[10px] text-amber-200">
                  1/3 Reposo: mantén las manos quietas en el encuadre
                </p>
              ) : capturePhase === "stabilizing" ? (
                <p className="mt-2 text-[10px] text-amber-200">
                  Forma la seña y manténla quieta para empezar a analizar
                </p>
              ) : capturePhase === "collecting" ? (
                <p className="mt-2 text-[10px] text-white/60">
                  {(signs[currentIndex]?.detectionType ?? "static") === "dynamic"
                    ? `2/3 Movimiento: ${bufferFill} frames — luego vuelve a reposo`
                    : `Capturando seña: ${bufferFill}/${minCaptureFrames} frames`}
                </p>
              ) : capturePhase === "closing" ? (
                <p className="mt-2 text-[10px] text-blue-200">
                  3/3 Reposo final: quédate quieto para cerrar el gesto
                </p>
              ) : capturePhase === "analyzing" ? (
                <p className="mt-2 text-[10px] text-green-200">
                  Analizando el gesto completo...
                </p>
              ) : gestureRetryHint ? (
                <p className="mt-2 text-[10px] text-red-300">
                  {dynamicAttempt >= MAX_DYNAMIC_EXAM_ATTEMPTS
                    ? "No reconocido tras 2 intentos — reposa y vuelve a intentar, u omite la seña"
                    : `No reconocido (intento ${dynamicAttempt}/${MAX_DYNAMIC_EXAM_ATTEMPTS}) — 1/3 reposo → 2/3 seña → 3/3 reposo`}
                </p>
              ) : capturePhase === "waiting" ? (
                <p className="mt-2 text-[10px] text-white/60">
                  {(signs[currentIndex]?.detectionType ?? "static") === "dynamic"
                    ? "Protocolo: reposo → movimiento → reposo"
                    : "Levanta la mano frente a la cámara"}
                </p>
              ) : null}
            </div>
            {capturePhase === "arming" && (
              <div className="rounded-2xl border border-amber-500/30 bg-black/60 p-3 backdrop-blur-xl">
                <div className="mb-1 flex justify-between text-[10px] font-black uppercase tracking-widest text-amber-200">
                  <span>Armar gesto</span>
                  <span>
                    {stableFramesCount}/{REST_FRAMES_TO_START}
                  </span>
                </div>
                <Progress
                  progress={Math.min(
                    100,
                    (stableFramesCount / REST_FRAMES_TO_START) * 100,
                  )}
                  color="warning"
                  size="sm"
                />
              </div>
            )}
            {capturePhase === "stabilizing" && (
              <div className="rounded-2xl border border-amber-500/30 bg-black/60 p-3 backdrop-blur-xl">
                <div className="mb-1 flex justify-between text-[10px] font-black uppercase tracking-widest text-amber-200">
                  <span>Mantén la pose</span>
                  <span>
                    {Math.min(
                      100,
                      Math.round(
                        (stableFramesCount / STABLE_FRAMES_TO_START) * 100,
                      ),
                    )}
                    %
                  </span>
                </div>
                <Progress
                  progress={Math.min(
                    100,
                    (stableFramesCount / STABLE_FRAMES_TO_START) * 100,
                  )}
                  color="warning"
                  size="sm"
                />
              </div>
            )}
            {capturePhase === "collecting" && bufferFill < minCaptureFrames && (
              <div className="rounded-2xl border border-blue-500/30 bg-black/60 p-3 backdrop-blur-xl">
                <div className="mb-1 flex justify-between text-[10px] font-black uppercase tracking-widest text-blue-300">
                  <span>Preparando análisis</span>
                  <span>{Math.round((bufferFill / minCaptureFrames) * 100)}%</span>
                </div>
                <Progress
                  progress={(bufferFill / minCaptureFrames) * 100}
                  color="blue"
                  size="sm"
                />
              </div>
            )}
            {recognitionProgress > 0 && (
              <div className="rounded-2xl border border-green-500/30 bg-black/60 p-3 backdrop-blur-xl">
                <div className="mb-1 flex justify-between text-[10px] font-black uppercase tracking-widest text-green-300">
                  <span>Reconociendo movimiento</span>
                  <span>{Math.round(recognitionProgress)}%</span>
                </div>
                <Progress progress={recognitionProgress} color="green" size="sm" />
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default SignExamCameraView;
