import React from "react";
import { Button, Card, Badge } from "flowbite-react";
import { HiVideoCamera } from "react-icons/hi";
import {
  TARGET_CAPTURE_FRAMES,
  REST_FRAMES_TO_START,
  type UiCapturePhase,
} from "../../utils/signDetection";
import { RecordingHistoryGrid } from "./RecordingHistoryGrid";
import { RecorderCaptureActions } from "./RecorderCaptureActions";
import { DominantHandSelector } from "./DominantHandSelector";
import { getRecordCaptureCue } from "./signStudioUtils";
import {
  getCaptureProgress,
  getCaptureStatusMessage,
} from "./recorderCaptureStatus";
import type { LandmarkFrame, Sign, SignRecording } from "./types";

export interface RecorderPanelProps {
  selectedSignId: string;
  allSigns: Sign[];
  signs: Sign[];
  globalSigns: Sign[];
  dominantHand: "right" | "left";
  onDominantHandChange: (hand: "right" | "left") => void;
  isCameraActive: boolean;
  onIsCameraActiveChange: (active: boolean) => void;
  isRecording: boolean;
  onIsRecordingChange: (recording: boolean) => void;
  isReviewing: boolean;
  onIsReviewingChange: (reviewing: boolean) => void;
  previewFrame: number;
  landmarksBuffer: LandmarkFrame[];
  onLandmarksBufferChange: React.Dispatch<React.SetStateAction<LandmarkFrame[]>>;
  recordCapturePhase: "idle" | UiCapturePhase;
  onRecordCapturePhaseChange: React.Dispatch<
    React.SetStateAction<"idle" | UiCapturePhase>
  >;
  recordStableCount: number;
  recordCaptureCount: number;
  recordHandVisible: boolean;
  isSaving: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  enterReviewMode: () => void;
  resetRecordingCapture: () => void;
  handleSave: () => void;
  signRecordings: SignRecording[];
  onOpenPlayback: (rec: SignRecording) => void;
  onDeleteRecording: (id: string) => void;
}

export function RecorderPanel({
  selectedSignId,
  allSigns,
  signs,
  globalSigns,
  dominantHand,
  onDominantHandChange,
  isCameraActive,
  onIsCameraActiveChange,
  isRecording,
  onIsRecordingChange,
  isReviewing,
  onIsReviewingChange,
  previewFrame,
  landmarksBuffer,
  onLandmarksBufferChange,
  recordCapturePhase,
  onRecordCapturePhaseChange,
  recordStableCount,
  recordCaptureCount,
  recordHandVisible,
  isSaving,
  videoRef,
  canvasRef,
  enterReviewMode,
  resetRecordingCapture,
  handleSave,
  signRecordings,
  onOpenPlayback,
  onDeleteRecording,
}: RecorderPanelProps) {
  const selectedSign = [...signs, ...globalSigns].find((s) => s.id === selectedSignId);
  const isDynamicSign = (selectedSign?.detectionType ?? "static") === "dynamic";
  const armedReady =
    isDynamicSign &&
    recordCapturePhase === "arming" &&
    recordStableCount >= REST_FRAMES_TO_START;
  const captureCue = getRecordCaptureCue(
    recordCapturePhase,
    recordHandVisible,
    armedReady,
  );

  const captureStatusMessage = getCaptureStatusMessage(
    isRecording,
    recordHandVisible,
    recordCapturePhase,
    isDynamicSign,
    recordStableCount,
    recordCaptureCount,
    landmarksBuffer.length,
    armedReady,
  );

  const captureProgress = getCaptureProgress(
    isRecording,
    recordHandVisible,
    recordCapturePhase,
    isDynamicSign,
    recordStableCount,
    landmarksBuffer.length,
  );

  return (
    <div className="h-full">
      <Card className="h-full">
        {!selectedSignId ? (
          <div className="flex h-full flex-col items-center justify-center p-10 text-center text-gray-400">
            <HiVideoCamera className="mb-4 size-20 opacity-20" />
            <p className="text-xl font-medium text-gray-600 dark:text-gray-300">
              {signs.length + globalSigns.length === 0
                ? "Crea una seña para empezar a grabar"
                : "Elige una seña arriba para grabar"}
            </p>
            <p className="mt-1 max-w-sm text-sm">
              {signs.length + globalSigns.length === 0
                ? "Cuando exista al menos una seña, aquí aparecerá la cámara."
                : "Las muestras quedan asociadas a esa seña."}
            </p>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-semibold">
                Grabando para:{" "}
                <span className="text-blue-600">
                  {allSigns.find((s) => s.id === selectedSignId)?.name}
                </span>
              </h3>
              <DominantHandSelector
                dominantHand={dominantHand}
                onChange={onDominantHandChange}
              />

              {captureStatusMessage && (
                <div
                  className={`min-w-0 max-w-md flex-1 rounded-md px-3 py-2 text-xs font-medium text-white shadow-sm transition-colors ${captureCue.panel}`}
                >
                  <div className="truncate">{captureStatusMessage}</div>
                  {captureProgress && (
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/30">
                      <div
                        className="h-full rounded-full bg-white transition-[width] duration-150"
                        style={{
                          width: `${Math.min(
                            100,
                            (captureProgress.current / captureProgress.total) * 100,
                          )}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  color={isCameraActive ? "failure" : "success"}
                  onClick={() => onIsCameraActiveChange(!isCameraActive)}
                >
                  {isCameraActive ? "Apagar Cámara" : "Encender Cámara"}
                </Button>
                {(() => {
                  if (isReviewing) {
                    return (
                      <Badge color={landmarksBuffer.length > 0 ? "success" : "failure"}>
                        Replay {previewFrame + 1}/{landmarksBuffer.length || 0} frames
                      </Badge>
                    );
                  }
                  if (isDynamicSign) {
                    return (
                      <Badge color={recordCaptureCount > 0 ? "success" : "warning"}>
                        {recordCaptureCount || landmarksBuffer.length} frames mov.
                      </Badge>
                    );
                  }
                  return (
                    <Badge
                      color={
                        landmarksBuffer.length >= TARGET_CAPTURE_FRAMES ? "success" : "warning"
                      }
                    >
                      {landmarksBuffer.length}/{TARGET_CAPTURE_FRAMES} frames
                    </Badge>
                  );
                })()}
              </div>
            </div>

            <div className="relative flex min-h-120 flex-1 items-center justify-center overflow-hidden rounded-lg border-4 border-gray-200 bg-black shadow-inner dark:border-gray-700">
              {isCameraActive || (isReviewing && landmarksBuffer.length > 0) ? (
                <>
                  <video
                    ref={videoRef as React.RefObject<HTMLVideoElement>}
                    autoPlay
                    playsInline
                    muted
                    className={`mirror size-full object-contain ${
                      isReviewing && landmarksBuffer.length > 0 ? "invisible" : ""
                    }`}
                  />
                  <canvas
                    ref={canvasRef as React.RefObject<HTMLCanvasElement>}
                    className="mirror pointer-events-none absolute inset-0 size-full object-contain"
                  />
                  {isRecording && (
                    <div className="absolute right-3 top-3">
                      <div
                        className={`flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm transition-colors ${captureCue.badge}`}
                      >
                        <div className="size-1.5 rounded-full bg-white" />
                        {captureCue.label}
                      </div>
                    </div>
                  )}
                  {isReviewing && landmarksBuffer.length > 0 && (
                    <div className="absolute inset-x-4 top-4 flex justify-end">
                      <div className="rounded-full bg-blue-600 px-3 py-1 text-sm font-bold text-white">
                        REPRODUCIENDO CAPTURA
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500">
                  <HiVideoCamera className="mx-auto mb-2 size-16 opacity-20" />
                  <p>Cámara inactiva</p>
                  <Button className="mt-4" size="sm" onClick={() => onIsCameraActiveChange(true)}>
                    Activar Cámara
                  </Button>
                </div>
              )}
            </div>

            <RecorderCaptureActions
              isRecording={isRecording}
              isReviewing={isReviewing}
              isSaving={isSaving}
              isCameraActive={isCameraActive}
              landmarksBufferLength={landmarksBuffer.length}
              onEnterReviewMode={enterReviewMode}
              onSave={handleSave}
              onDiscard={() => {
                onIsReviewingChange(false);
                onLandmarksBufferChange([]);
                resetRecordingCapture();
              }}
              onStartCapture={() => {
                onLandmarksBufferChange([]);
                resetRecordingCapture();
                onRecordCapturePhaseChange("waiting");
                onIsRecordingChange(true);
              }}
            />

            {selectedSignId && signRecordings.length > 0 && (
              <RecordingHistoryGrid
                signRecordings={signRecordings}
                onOpenPlayback={onOpenPlayback}
                onDeleteRecording={onDeleteRecording}
              />
            )}          </div>
        )}
      </Card>
    </div>
  );
}
