import type { CustomTrainingFilters } from "../../types/signRecord";
import type { TrainingMode } from "./types";

export type SortKey = "name" | "createdAt";
export type SortDirection = "asc" | "desc";

/**
 * Calcula el nuevo orden al pulsar una columna: si ya era la activa invierte
 * la dirección, si no, la activa en ascendente.
 */
export function nextSortState(
  current: { key: SortKey; direction: SortDirection },
  key: SortKey,
): { key: SortKey; direction: SortDirection } {
  if (current.key === key) {
    return {
      key,
      direction: current.direction === "asc" ? "desc" : "asc",
    };
  }
  return { key, direction: "asc" };
}

export interface TrainingFilterInput {
  signs: { id: string }[];
  selectedLessonId: string;
  selectedStageId: string;
  selectedLanguageId: string;
  selectedRegionId: string;
  selectedTrainingSignIds: string[];
}

/**
 * Filtros del entrenamiento según el modo elegido. Devuelve null solo cuando
 * el modo "selection" no tiene señas seleccionadas.
 */
export function buildTrainingFilters(
  mode: TrainingMode,
  input: TrainingFilterInput,
): CustomTrainingFilters | null {
  const filters: CustomTrainingFilters = {};

  switch (mode) {
    case "lesson":
      filters.signIds = input.signs.map((s) => s.id);
      filters.lessonId = input.selectedLessonId;
      filters.stageId = input.selectedStageId;
      filters.languageId = input.selectedLanguageId;
      break;
    case "stage":
      filters.stageIds = [input.selectedStageId];
      filters.stageId = input.selectedStageId;
      filters.languageId = input.selectedLanguageId;
      break;
    case "language":
      filters.languageId = input.selectedLanguageId;
      filters.regionId = input.selectedRegionId;
      break;
    case "selection":
      if (input.selectedTrainingSignIds.length === 0) return null;
      filters.signIds = input.selectedTrainingSignIds;
      filters.languageId = input.selectedLanguageId;
      break;
  }

  return filters;
}
