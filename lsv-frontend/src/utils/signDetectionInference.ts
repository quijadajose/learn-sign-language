/**
 * Inferencia de los modelos y votación temporal para validar señas (FE-10).
 */
import * as tf from "@tensorflow/tfjs";
import { selectPoseLandmarks } from "./signDetectionFeatures";
import { normalizePoseScale } from "./signDetectionGesture";

export const CONFIDENCE_THRESHOLD = 0.75;

/** Ventana de inferencias recientes (~330 ms @ 30 fps) */
export const INFERENCE_VOTE_WINDOW = 10;

/** Cuántas inferencias en esa ventana deben superar el umbral (permite pausas en señas con movimiento) */
export const INFERENCE_VOTE_REQUIRED = 6;

export type ModelPrediction = {
  scores: number[];
  topLabel: string;
  topScore: number;
  targetLabel?: string;
  targetScore: number;
};

/** Convierte los scores crudos en la predicción con la clase top y la objetivo. */
export function summarizePrediction(
  scores: number[],
  labels: string[],
  targetLabel?: string,
): ModelPrediction {
  const topIdx = scores.indexOf(Math.max(...scores));
  const targetIdx = targetLabel
    ? labels.findIndex((l) => l.toLowerCase() === targetLabel.toLowerCase())
    : -1;

  return {
    scores,
    topLabel: labels[topIdx] ?? `Clase ${topIdx}`,
    topScore: scores[topIdx] ?? 0,
    targetLabel,
    targetScore: targetIdx !== -1 ? scores[targetIdx] : 0,
  };
}

/**
 * La escala de pose y el recorte de landmarks van acá dentro para que ningún
 * caller pueda olvidarlos: recibe el frame capturado de 258D.
 */
export function runStaticModelInference(
  model: tf.LayersModel,
  frame: number[],
  labels: string[],
  targetLabel?: string,
): ModelPrediction {
  return tf.tidy(() => {
    const input = tf.tensor2d([selectPoseLandmarks(normalizePoseScale(frame))]);
    const predictionTensor = model.predict(input) as tf.Tensor;
    const scores = Array.from(predictionTensor.dataSync() as Float32Array);

    return summarizePrediction(scores, labels, targetLabel);
  });
}

export function runModelInference(
  model: tf.LayersModel,
  buffer: number[][],
  labels: string[],
  targetLabel?: string,
): ModelPrediction {
  return tf.tidy(() => {
    const input = tf.tensor3d([buffer]);
    const predictionTensor = model.predict(input) as tf.Tensor;
    const scores = Array.from(predictionTensor.dataSync() as Float32Array);

    return summarizePrediction(scores, labels, targetLabel);
  });
}

export function applyPredictionToVotes(
  prediction: ModelPrediction,
  votesRef: { current: number[] },
  onSuccess: () => void,
): number {
  const votes = votesRef.current;
  votes.push(prediction.targetScore >= CONFIDENCE_THRESHOLD ? 1 : 0);
  if (votes.length > INFERENCE_VOTE_WINDOW) {
    votes.shift();
  }
  const hitCount = votes.reduce((sum, v) => sum + v, 0);
  if (hitCount >= INFERENCE_VOTE_REQUIRED) {
    onSuccess();
  }
  return hitCount;
}
