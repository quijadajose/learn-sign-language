import {
  PoseLandmarker,
  HandLandmarker,
  DrawingUtils,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import {
  DYNAMIC_FEATURES_COUNT,
  STATIC_FEATURES_COUNT,
} from "../../utils/signDetection";
import type { LandmarkPoint } from "./types";

/**
 * Helpers puros de la captura de Sign Studio, separados del hook para poder
 * probarlos sin cámara ni MediaPipe real (FE-10).
 */

export function drawOverlayLandmarks(
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
export function featuresCountMismatch(
  modelType: "static" | "dynamic",
  featuresCount: number,
): string | null {
  const expected =
    modelType === "dynamic" ? DYNAMIC_FEATURES_COUNT : STATIC_FEATURES_COUNT;
  if (featuresCount === expected) return null;
  return `Modelo ${modelType} incompatible: se esperaban ${expected} features, hay ${featuresCount}.`;
}
