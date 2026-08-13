import type { SignDetectionType, UiCapturePhase } from "../../utils/signDetection";
import type {
  LandmarkFrame,
  LandmarkPoint,
  LessonModelDto,
  LessonModelsBundleDto,
  ModelStatus,
  PaginatedSignsDto,
  SignDto,
  SignRecordingDto,
  TrainingLogs,
} from "../../types/signRecord";

export type {
  LandmarkFrame,
  LandmarkPoint,
  ModelStatus,
  TrainingLogs,
};

export type Sign = SignDto;
export type StudioModel = LessonModelDto;
export type SignRecording = SignRecordingDto;
export type LessonModelsBundle = LessonModelsBundleDto;
export type PaginatedSigns = PaginatedSignsDto;

export interface Lesson {
  id: string;
  name: string;
}

export interface ConfirmConfig {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  color?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface SampleTestResult {
  topLabel: string;
  topScore: number;
  targetScore: number;
  handRatio: number;
  sequenceLength: number;
}

export type TrainingMode = "lesson" | "stage" | "language" | "selection";

export type RecordCapturePhase = "idle" | UiCapturePhase;

export type { SignDetectionType };
