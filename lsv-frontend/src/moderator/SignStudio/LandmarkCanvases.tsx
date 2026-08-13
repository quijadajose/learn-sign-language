import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  PoseLandmarker,
  HandLandmarker,
  DrawingUtils,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";
import type { LandmarkFrame, LandmarkPoint, SignRecording } from "./types";

const asNormalized = (
  points: LandmarkPoint[] | null | undefined,
): NormalizedLandmark[] | undefined =>
  points as NormalizedLandmark[] | undefined;

export const ThumbnailCanvas: React.FC<{ landmarks: LandmarkFrame[] }> = ({ landmarks }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!landmarks || landmarks.length === 0 || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const drawingUtils = new DrawingUtils(ctx);
    const firstFrame = landmarks[0];
    if (firstFrame) {
      const pose = asNormalized(firstFrame.pose);
      const leftHand = asNormalized(firstFrame.leftHand);
      const rightHand = asNormalized(firstFrame.rightHand);
      if (pose) {
        drawingUtils.drawConnectors(pose, PoseLandmarker.POSE_CONNECTIONS, { color: 'rgba(255,255,255,0.2)', lineWidth: 1 });
        drawingUtils.drawLandmarks(pose, { color: '#6366F1', lineWidth: 0.5, radius: 1.5 });
      }
      if (leftHand) {
        drawingUtils.drawConnectors(leftHand, HandLandmarker.HAND_CONNECTIONS, { color: '#22C55E', lineWidth: 1.5 });
        drawingUtils.drawLandmarks(leftHand, { color: '#22C55E', lineWidth: 0.5, radius: 1.5 });
      }
      if (rightHand) {
        drawingUtils.drawConnectors(rightHand, HandLandmarker.HAND_CONNECTIONS, { color: '#22C55E', lineWidth: 1.5 });
        drawingUtils.drawLandmarks(rightHand, { color: '#22C55E', lineWidth: 0.5, radius: 1.5 });
      }
    }
  }, [landmarks]);
  return <canvas ref={canvasRef} width={300} height={220} className="mirror size-full object-contain" />;
};

export const PlaybackCanvas: React.FC<{ recording: SignRecording }> = ({ recording }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIndexRef = useRef(0);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const totalFrames = recording?.landmarks?.length ?? 0;

  const drawFrame = useCallback(
    (index: number) => {
      const canvas = canvasRef.current;
      if (!canvas || !recording?.landmarks?.length) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const drawingUtils = new DrawingUtils(ctx);
      const currentFrame = recording.landmarks[index];

      if (currentFrame) {
        const pose = asNormalized(currentFrame.pose);
        const leftHand = asNormalized(currentFrame.leftHand);
        const rightHand = asNormalized(currentFrame.rightHand);
        if (pose) {
          drawingUtils.drawConnectors(pose, PoseLandmarker.POSE_CONNECTIONS, {
            color: "rgba(255,255,255,0.3)",
            lineWidth: 2,
          });
          drawingUtils.drawLandmarks(pose, {
            color: "#6366F1",
            lineWidth: 1,
            radius: 3,
          });
        }
        if (leftHand) {
          drawingUtils.drawConnectors(leftHand, HandLandmarker.HAND_CONNECTIONS, {
            color: "#22C55E",
            lineWidth: 3,
          });
          drawingUtils.drawLandmarks(leftHand, {
            color: "#22C55E",
            lineWidth: 1,
            radius: 4,
          });
        }
        if (rightHand) {
          drawingUtils.drawConnectors(rightHand, HandLandmarker.HAND_CONNECTIONS, {
            color: "#22C55E",
            lineWidth: 3,
          });
          drawingUtils.drawLandmarks(rightHand, {
            color: "#22C55E",
            lineWidth: 1,
            radius: 4,
          });
        }
      }
    },
    [recording],
  );

  const drawFrameRef = useRef(drawFrame);

  useEffect(() => {
    drawFrameRef.current = drawFrame;
  }, [drawFrame]);

  useEffect(() => {
    if (!recording?.landmarks?.length) return;
    drawFrameRef.current(frameIndexRef.current);
  }, [recording]);

  useEffect(() => {
    if (!recording?.landmarks?.length || !isPlaying) {
      drawFrameRef.current(frameIndexRef.current);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    let rafId = 0;
    const tick = () => {
      const next = (frameIndexRef.current + 1) % recording.landmarks.length;
      frameIndexRef.current = next;
      setFrameIndex(next);
      drawFrameRef.current(next);
      timeoutId = setTimeout(() => {
        rafId = requestAnimationFrame(tick);
      }, 80);
    };

    timeoutId = setTimeout(() => {
      rafId = requestAnimationFrame(tick);
    }, 80);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
    };
  }, [recording, isPlaying]);

  const seekTo = (index: number) => {
    const clamped = Math.max(0, Math.min(index, Math.max(totalFrames - 1, 0)));
    frameIndexRef.current = clamped;
    setFrameIndex(clamped);
    drawFrame(clamped);
  };

  return (
    <div className="flex w-full flex-col">
      <div className="relative aspect-video w-full bg-black">
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="mirror absolute inset-0 size-full object-contain"
        />
      </div>
      {totalFrames > 0 && (
        <div className="flex items-center gap-3 border-t border-gray-800 bg-gray-950 px-3 py-2">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="rounded-md bg-gray-800 px-2.5 py-1 text-xs font-semibold text-white hover:bg-gray-700"
            title={isPlaying ? "Pausar" : "Reproducir"}
          >
            {isPlaying ? "Pausa" : "Play"}
          </button>
          <input
            type="range"
            min={0}
            max={Math.max(totalFrames - 1, 0)}
            value={frameIndex}
            onChange={(e) => {
              setIsPlaying(false);
              seekTo(Number(e.target.value));
            }}
            className="h-1.5 flex-1 cursor-pointer accent-blue-500"
            aria-label="Posición del replay"
          />
          <span className="min-w-18 text-right text-[11px] tabular-nums text-gray-400">
            {frameIndex + 1} / {totalFrames}
          </span>
        </div>
      )}
    </div>
  );
};
