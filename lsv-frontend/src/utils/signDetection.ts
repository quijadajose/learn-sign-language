// Contrato de esquema, carga de modelos, pipeline de visión y lógica de gestos
// viven en módulos propios (FE-10); se reexportan para no cambiar los imports.
export * from "./signDetectionSchema";
export * from "./signDetectionModels";
export * from "./signDetectionForwardFill";
export * from "./signDetectionGesture";
export * from "./signDetectionFeatures";
export * from "./signDetectionInference";
export * from "./signDetectionVision";

import type { GesturePhase } from "./signDetectionGesture";

export const DETECTION_INTERVAL_MS = 33;
/** One-shot + 1 reintento explícito en examen dinámico */
export const MAX_DYNAMIC_EXAM_ATTEMPTS = 2;
/** Mínimo de frames reales antes de inferir (las muestras de entrenamiento suelen tener 10–16) */
export const MIN_CAPTURE_FRAMES = 10;
/** Cuántos frames reales capturar antes de inferir (alineado con muestras cortas + padding). */
export function minFramesBeforeInference(sequenceLength: number): number {
  return Math.min(14, Math.max(MIN_CAPTURE_FRAMES, Math.floor(sequenceLength * 0.5)));
}
/** Fases de UI compartidas entre Studio, Exam y Tester. */
export type UiCapturePhase =
  | "waiting"
  | "arming"
  | "stabilizing"
  | "collecting"
  | "closing"
  | "analyzing"
  | "complete";

export function mapGesturePhaseToUi(phase: GesturePhase): UiCapturePhase {
  switch (phase) {
    case "arming":
      return "arming";
    case "stabilizing":
      return "stabilizing";
    case "capturing":
      return "collecting";
    case "closing":
      return "closing";
    case "complete":
      return "complete";
    default:
      return "waiting";
  }
}
