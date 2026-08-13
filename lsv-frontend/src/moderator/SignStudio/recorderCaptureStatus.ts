import {
  STABLE_FRAMES_TO_START,
  TARGET_CAPTURE_FRAMES,
  REST_FRAMES_TO_START,
  REST_FRAMES_TO_END,
  type UiCapturePhase,
} from "../../utils/signDetection";

export function getCaptureStatusMessage(
  isRecording: boolean,
  recordHandVisible: boolean,
  recordCapturePhase: "idle" | UiCapturePhase,
  isDynamicSign: boolean,
  recordStableCount: number,
  recordCaptureCount: number,
  landmarksBufferLength: number,
  armedReady: boolean,
): string | null {
  if (!isRecording) return null;
  if (!recordHandVisible) return "Buscando mano… súbela a cámara";
  if (recordCapturePhase === "waiting") {
    return isDynamicSign
      ? "1/3 Mano detectada — quédate en reposo"
      : "Mano detectada — forma la seña y manténla";
  }
  if (recordCapturePhase === "arming") {
    if (armedReady) return "Modo captura listo — haz el movimiento ahora";
    return `1/3 Reposo (${recordStableCount}/${REST_FRAMES_TO_START}) — al llegar a ${REST_FRAMES_TO_START}, haz el movimiento`;
  }
  if (recordCapturePhase === "stabilizing") {
    return `Mano OK — mantén la pose (${recordStableCount}/${STABLE_FRAMES_TO_START})`;
  }
  if (recordCapturePhase === "collecting") {
    return isDynamicSign
      ? `2/3 Movimiento: ${recordCaptureCount || landmarksBufferLength} frames`
      : `Capturando: ${landmarksBufferLength}/${TARGET_CAPTURE_FRAMES}`;
  }
  if (recordCapturePhase === "closing") {
    return `3/3 Vuelve a reposo (${REST_FRAMES_TO_END} frames)`;
  }
  return null;
}

export function getCaptureProgress(
  isRecording: boolean,
  recordHandVisible: boolean,
  recordCapturePhase: "idle" | UiCapturePhase,
  isDynamicSign: boolean,
  recordStableCount: number,
  landmarksBufferLength: number,
): { current: number; total: number } | null {
  if (!isRecording || !recordHandVisible) return null;
  if (recordCapturePhase === "arming") {
    return { current: recordStableCount, total: REST_FRAMES_TO_START };
  }
  if (recordCapturePhase === "stabilizing") {
    return { current: recordStableCount, total: STABLE_FRAMES_TO_START };
  }
  if (recordCapturePhase === "collecting" && !isDynamicSign) {
    return { current: landmarksBufferLength, total: TARGET_CAPTURE_FRAMES };
  }
  return null;
}
