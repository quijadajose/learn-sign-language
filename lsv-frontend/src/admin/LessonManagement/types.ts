import type { Language as SharedLanguage, Region as SharedRegion } from "../../types/user";

export type Language = SharedLanguage;
export type Region = SharedRegion;

export interface Lesson {
  id: string;
  name: string;
  description: string;
  languageId: string;
  languageName: string;
  difficulty: string;
  estimatedDuration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LessonVariant {
  id: string;
  name: string;
  description: string;
  content: string;
  isRegionalSpecific: boolean;
  isBase: boolean;
  regionalNotes?: string;
  region: Region;
  baseLesson: Lesson;
  createdAt: string;
  updatedAt: string;
}

export interface StageItem {
  id: string;
  name: string;
  description: string;
}

export interface LessonDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  content: string;
  stage?: StageItem;
}

export type ToastMessage = {
  id: number;
  type: "success" | "error";
  message: string;
};

export interface LanguagesResponse {
  data: Language[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LessonsResponse {
  data: Lesson[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LessonFormState {
  name: string;
  description: string;
  content: string;
  languageId: string;
  stageId: string;
}

export interface VariantFormState {
  name: string;
  description: string;
  content: string;
  regionId: string;
  isRegionalSpecific: boolean;
  isBase: boolean;
  regionalNotes: string;
}
