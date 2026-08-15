import React from "react";
import { Button, Card, Progress, Spinner } from "flowbite-react";
import { HiCheckCircle } from "react-icons/hi";
import { m } from "motion/react";
import { useTranslation } from "react-i18next";
import {
  CONFIDENCE_THRESHOLD,
  REST_FRAMES_TO_START,
  STABLE_FRAMES_TO_START,
  type SignDetectionType,
  type UiCapturePhase,
} from "../utils/signDetection";
import { examStatusMessage } from "./examStatusMessage";

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
  const { t } = useTranslation(["learn", "common"]);
  const status = examStatusMessage(
    {
      signs,
      currentIndex,
      prediction,
      modelGuess,
      capturePhase,
      bufferFill,
      gestureRetryHint,
      gestureTooLongHint,
      dynamicAttempt,
      minCaptureFrames,
      isLoading,
      isFinished,
      allRecognized,
      isMediaPipeReady,
    },
    t,
  );
  const signName = signs[currentIndex]?.name || t("practice.signFallback");

  return (
    <Card className="overflow-hidden border-none bg-white shadow-2xl dark:bg-gray-900">
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {status}
      </p>
      {isLoading ? (
        <div className="flex h-120 flex-col items-center justify-center space-y-4">
          <Spinner size="xl" color="info" aria-label={t("practice.loadingAi")} />
          <p aria-hidden="true" className="animate-pulse font-medium text-gray-400">
            {t("practice.loadingAi")}
          </p>
        </div>
      ) : isFinished ? (
        <m.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex h-120 flex-col items-center justify-center p-8 text-center text-white"
        >
          <div className="rounded-full bg-green-500 p-6 shadow-[0_0_50px_rgba(34,197,94,0.5)]">
            <HiCheckCircle className="size-20" aria-hidden />
          </div>
          <h2 className="mt-8 text-5xl font-black">{t("practice.done.title")}</h2>
          <p className="mt-4 text-xl text-gray-400">
            {allRecognized ? t("practice.done.all") : t("practice.done.partial")}
          </p>
          <div className="mt-10 flex space-x-4">
            <Button size="xl" color="info" onClick={onGoBack}>
              {t("practice.done.back")}
            </Button>
            <Button size="xl" color="gray" onClick={() => window.location.reload()}>
              {t("practice.done.retry")}
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
            tabIndex={0}
            aria-label={t("a11y.camera", { ns: "common" })}
            className="mirror size-full object-cover"
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            aria-hidden="true"
            className="mirror pointer-events-none absolute inset-0 size-full object-cover"
          />

          {!isMediaPipeReady && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-900/90 backdrop-blur-sm">
              <Spinner
                size="xl"
                color="info"
                aria-label={t("practice.startingVision")}
              />
              <p
                aria-hidden="true"
                className="mt-4 animate-pulse text-base font-medium uppercase tracking-widest text-white"
              >
                {t("practice.startingVision")}
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
                <HiCheckCircle className="mx-auto size-32 drop-shadow-2xl" aria-hidden />
                <h3 className="mt-4 text-5xl font-black tracking-tight">
                  {t("practice.success")}
                </h3>
              </m.div>
            </m.div>
          ) : null}

          <div className="absolute inset-x-4 bottom-4 max-h-[55%] space-y-2 overflow-y-auto">
            <div className="rounded-2xl border border-white/10 bg-black/70 p-4 backdrop-blur-xl">
              <div className="mb-2 flex justify-between gap-3 text-sm font-black uppercase tracking-wide text-white">
                <span>
                  {t("practice.overlay.confidence", { signName })}
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
                aria-label={t("practice.overlay.confidence", { signName })}
              />
              <p className="mt-3 text-base leading-snug text-white">{status}</p>
            </div>
            {capturePhase === "arming" && (
              <div className="rounded-2xl border border-amber-500/30 bg-black/70 p-3 backdrop-blur-xl">
                <div className="mb-1 flex justify-between text-sm font-black uppercase tracking-wide text-amber-200">
                  <span>{t("practice.overlay.armGesture")}</span>
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
                  aria-label={t("practice.overlay.armGesture")}
                />
              </div>
            )}
            {capturePhase === "stabilizing" && (
              <div className="rounded-2xl border border-amber-500/30 bg-black/70 p-3 backdrop-blur-xl">
                <div className="mb-1 flex justify-between text-sm font-black uppercase tracking-wide text-amber-200">
                  <span>{t("practice.overlay.holdPose")}</span>
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
                  aria-label={t("practice.overlay.holdPose")}
                />
              </div>
            )}
            {capturePhase === "collecting" && bufferFill < minCaptureFrames && (
              <div className="rounded-2xl border border-blue-500/30 bg-black/70 p-3 backdrop-blur-xl">
                <div className="mb-1 flex justify-between text-sm font-black uppercase tracking-wide text-blue-300">
                  <span>{t("practice.overlay.preparing")}</span>
                  <span>{Math.round((bufferFill / minCaptureFrames) * 100)}%</span>
                </div>
                <Progress
                  progress={(bufferFill / minCaptureFrames) * 100}
                  color="blue"
                  size="sm"
                  aria-label={t("practice.overlay.preparing")}
                />
              </div>
            )}
            {recognitionProgress > 0 && (
              <div className="rounded-2xl border border-green-500/30 bg-black/70 p-3 backdrop-blur-xl">
                <div className="mb-1 flex justify-between text-sm font-black uppercase tracking-wide text-green-300">
                  <span>{t("practice.overlay.recognizing")}</span>
                  <span>{Math.round(recognitionProgress)}%</span>
                </div>
                <Progress
                  progress={recognitionProgress}
                  color="green"
                  size="sm"
                  aria-label={t("practice.overlay.recognizing")}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default SignExamCameraView;
