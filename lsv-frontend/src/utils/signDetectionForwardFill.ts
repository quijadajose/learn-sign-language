/**
 * Forward fill de landmarks de mano y timestamps para MediaPipe (FE-10).
 * Lógica pura, sin dependencias de TensorFlow ni de MediaPipe.
 */

/** Máximo de frames sin detección de mano antes de abortar (forward fill) */
export const MAX_FORWARD_FILL_FRAMES = 5;

export type RawLandmark = { x: number; y: number; z: number };

export type RawHandFrame = {
  pose: RawLandmark[] | null;
  leftHand: RawLandmark[] | null;
  rightHand: RawLandmark[] | null;
};

export type TimestampRef = { current: number };

/** Timestamp monótono para MediaPipe detectForVideo (unificado en todo el frontend). */
export function nextMediaPipeTimestamp(ref: TimestampRef): number {
  let ts = performance.now();
  if (ts <= ref.current) {
    ts = ref.current + 1;
  }
  ref.current = ts;
  return ts;
}

export type ForwardFillState = {
  lastValid: RawHandFrame | null;
  consecutiveMisses: number;
};

export function createForwardFillState(): ForwardFillState {
  return { lastValid: null, consecutiveMisses: 0 };
}

function cloneRawHandFrame(frame: RawHandFrame): RawHandFrame {
  return {
    pose: frame.pose?.map((p) => ({ ...p })) ?? null,
    leftHand: frame.leftHand?.map((p) => ({ ...p })) ?? null,
    rightHand: frame.rightHand?.map((p) => ({ ...p })) ?? null,
  };
}

/**
 * Repite la última pose válida cuando MediaPipe pierde la mano brevemente.
 * Si el gap supera MAX_FORWARD_FILL_FRAMES, aborted=true y el gesto debe reiniciarse.
 */
export function forwardFillHandLandmarks(
  state: ForwardFillState,
  detected: RawHandFrame | null,
  handVisible: boolean,
): {
  frame: RawHandFrame | null;
  state: ForwardFillState;
  aborted: boolean;
  filled: boolean;
} {
  if (handVisible && detected) {
    const frame = cloneRawHandFrame(detected);
    return {
      frame,
      state: { lastValid: frame, consecutiveMisses: 0 },
      aborted: false,
      filled: false,
    };
  }

  if (!state.lastValid) {
    return {
      frame: null,
      state: { ...state, consecutiveMisses: state.consecutiveMisses + 1 },
      aborted: false,
      filled: false,
    };
  }

  const nextMisses = state.consecutiveMisses + 1;
  if (nextMisses > MAX_FORWARD_FILL_FRAMES) {
    return {
      frame: null,
      state: createForwardFillState(),
      aborted: true,
      filled: false,
    };
  }

  return {
    frame: cloneRawHandFrame(state.lastValid),
    state: { ...state, consecutiveMisses: nextMisses },
    aborted: false,
    filled: true,
  };
}
