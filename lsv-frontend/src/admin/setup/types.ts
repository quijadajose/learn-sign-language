export type SetupStepId =
  | "language"
  | "stages"
  | "regions"
  | "moderators"
  | "lessons"
  | "done";

export interface LanguageSetupCounts {
  stageCount: number;
  regionCount: number;
  lessonCount: number;
  moderatorCount: number;
}

export interface SetupStep {
  id: Exclude<SetupStepId, "done">;
  label: string;
  description: string;
  path: string;
  done: boolean;
  current: boolean;
  locked: boolean;
  optional?: boolean;
}
