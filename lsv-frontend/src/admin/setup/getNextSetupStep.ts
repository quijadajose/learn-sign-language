import type { LanguageSetupCounts, SetupStep, SetupStepId } from "./types";

/** Required content path ignores optional moderator step. */
export function getNextSetupStep(
  hasLanguage: boolean,
  counts?: LanguageSetupCounts | null,
): SetupStepId {
  if (!hasLanguage) return "language";
  if (!counts || counts.stageCount === 0) return "stages";
  if (counts.regionCount === 0) return "regions";
  if (counts.lessonCount === 0) return "lessons";
  return "done";
}

export function getSetupStepPath(step: SetupStepId): string | null {
  switch (step) {
    case "language":
      return "/admin/languages";
    case "stages":
      return "/admin/stages";
    case "regions":
      return "/admin/regions";
    case "moderators":
      return null;
    case "lessons":
      return "/admin/lessons";
    case "done":
      return null;
  }
}

export function buildSetupSteps(
  hasLanguage: boolean,
  counts?: LanguageSetupCounts | null,
): SetupStep[] {
  const next = getNextSetupStep(hasLanguage, counts);
  const stageDone = Boolean(hasLanguage && counts && counts.stageCount > 0);
  const regionDone = Boolean(hasLanguage && counts && counts.regionCount > 0);
  const moderatorDone = Boolean(
    hasLanguage && counts && counts.moderatorCount > 0,
  );
  const lessonDone = Boolean(hasLanguage && counts && counts.lessonCount > 0);

  return [
    {
      id: "language",
      label: "Crear lenguaje",
      description: "Base de todo el contenido de la plataforma",
      path: "/admin/languages",
      done: hasLanguage,
      current: next === "language",
      locked: false,
    },
    {
      id: "stages",
      label: "Crear etapas",
      description: "Organiza el progreso de aprendizaje",
      path: "/admin/stages",
      done: stageDone,
      current: next === "stages",
      locked: !hasLanguage,
    },
    {
      id: "regions",
      label: "Crear regiones",
      description: "Permite variantes regionales de señas",
      path: "/admin/regions",
      done: regionDone,
      current: next === "regions",
      locked: !hasLanguage,
    },
    {
      id: "moderators",
      label: "Invitar moderadores",
      description: "Opcional: asigna ayuda por lenguaje o región",
      path: "/admin/moderators",
      done: moderatorDone,
      current: false,
      locked: !regionDone,
      optional: true,
    },
    {
      id: "lessons",
      label: "Crear lecciones",
      description: "Contenido que verán los estudiantes",
      path: "/admin/lessons",
      done: lessonDone,
      current: next === "lessons",
      locked: !stageDone,
    },
  ];
}

export function getNextStepLabel(step: SetupStepId): string {
  switch (step) {
    case "language":
      return "Crear lenguaje";
    case "stages":
      return "Crear etapa";
    case "regions":
      return "Crear región";
    case "moderators":
      return "Invitar moderador";
    case "lessons":
      return "Crear lección";
    case "done":
      return "Configuración lista";
  }
}
