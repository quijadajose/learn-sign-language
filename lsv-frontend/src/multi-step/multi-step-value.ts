import type { Next, Back, GetState, SetState } from "@formity/react";

export interface MultiStepValue {
  next: Next<Record<string, unknown>>;
  back: Back<Record<string, unknown>>;
  getState: GetState<Record<string, unknown>>;
  setState: SetState;
}
