import type { SignDetectionType } from "../utils/signDetection";

export type ModelStatus = "PENDING" | "TRAINING" | "READY" | "FAILED";

export type LandmarkPoint = {
  x: number;
  y: number;
  z: number;
  visibility?: number;
};

export type LandmarkFrame = {
  pose?: LandmarkPoint[] | null;
  leftHand?: LandmarkPoint[] | null;
  rightHand?: LandmarkPoint[] | null;
  flat?: number[];
};

export type ClassMetric = {
  precision: number;
  recall: number;
  support: number;
};

export type TrainingLogs = {
  error?: string;
  stdout?: string;
  stderr?: string;
  lines?: string[];
  warnings?: string[];
  loss?: number[];
  val_loss?: number[];
  categorical_accuracy?: number[];
  val_categorical_accuracy?: number[];
  classMetrics?: Record<string, ClassMetric>;
};

export interface SignDto {
  id: string;
  name: string;
  landmarks?: unknown;
  recordingsCount?: number;
  isGlobal?: boolean;
  detectionType?: SignDetectionType;
  createdAt?: string;
}

export type BulkCreateSkippedReason =
  | "duplicate_in_request"
  | "already_in_lesson";

export interface BulkCreateSignsResultDto {
  created: SignDto[];
  skipped: { name: string; reason: BulkCreateSkippedReason }[];
}

export interface SignRecordingDto {
  id: string;
  landmarks: LandmarkFrame[];
  dominantHand?: string | null;
  isValidated?: boolean;
  handConfidence?: number | null;
  createdAt?: string;
  signId?: string;
  regionId?: string | null;
}

export interface LessonModelDto {
  id: string;
  name?: string;
  status: ModelStatus;
  progress?: number;
  accuracy?: number | null;
  modelJsonUrl?: string | null;
  binUrls?: string[] | null;
  labels?: string[] | null;
  modelType?: SignDetectionType;
  featuresCount?: number;
  featuresSchemaVersion?: string | null;
  trainingJobId?: string | null;
  lessonId?: string | null;
  lesson?: { id?: string; name?: string } | null;
  createdAt?: string;
  warnings?: string[];
  trainingLogs?: TrainingLogs | null;
}

export type LessonModelsBundleDto = {
  static: LessonModelDto | null;
  dynamic: LessonModelDto | null;
};

export type PaginatedSignsDto = {
  data: SignDto[];
  total?: number;
};

export type SaveLandmarksPayload = {
  signId: string;
  regionId?: string;
  landmarks: LandmarkFrame[];
  dominantHand: string;
};

export type CustomTrainingFilters = {
  languageId?: string;
  regionId?: string;
  lessonId?: string;
  stageId?: string;
  stageIds?: string[];
  signIds?: string[];
  modelName?: string;
};
