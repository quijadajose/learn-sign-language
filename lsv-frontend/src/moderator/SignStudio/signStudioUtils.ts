import type { UiCapturePhase } from "../../utils/signDetection";
import type { Sign, TrainingMode } from "./types";

export const toast = {
  success: (msg: string) => {
    window.dispatchEvent(new CustomEvent("show-toast", { detail: { type: "success", message: msg } }));
  },
  error: (msg?: string) => {
    window.dispatchEvent(new CustomEvent("show-toast", { detail: { type: "error", message: msg || "Ha ocurrido un error inesperado" } }));
  }
};

export function filterAndSortSigns(
  allSigns: Sign[],
  searchTerm: string,
  sortKey: "name" | "createdAt",
  sortDirection: "asc" | "desc",
): Sign[] {
  return allSigns
    .filter(s => {
      if (!searchTerm) return true;
      return s.name?.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      // 1. Prioridad: Globales siempre arriba
      if (a.isGlobal && !b.isGlobal) return -1;
      if (!a.isGlobal && b.isGlobal) return 1;

      // 2. Orden secundario según el criterio del usuario
      let comparison = 0;
      if (sortKey === "name") {
        comparison = (a.name || "").localeCompare(b.name || "");
      } else {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        comparison = dateA - dateB;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
}

export function buildTrainingModelName(params: {
  mode: TrainingMode;
  langName?: string;
  rgnName?: string;
  stgName?: string;
  lsnName?: string;
  selectedCount: number;
}): string {
  const { mode, langName, rgnName, stgName, lsnName, selectedCount } = params;
  if (mode === "lesson" && lsnName) {
    return `${langName}${rgnName ? ` (${rgnName})` : ""}: ${stgName} - ${lsnName}`;
  }
  if (mode === "stage" && stgName) {
    return `${langName}${rgnName ? ` (${rgnName})` : ""}: ${stgName}`;
  }
  if (mode === "language" && langName) {
    return `${langName}${rgnName ? ` (${rgnName})` : ""}`;
  }
  if (mode === "selection") {
    return `Selección: ${selectedCount} señas`;
  }
  return "Entrenamiento Personalizado";
}

export function getRecordCaptureCue(
  phase: "idle" | UiCapturePhase,
  handVisible: boolean,
  /** Dinámicas: reposo inicial completado, esperando el movimiento */
  armedReady = false,
): { panel: string; badge: string; label: string } {
  // Sin mano → ámbar/rojo
  // Mano + reposo/armado → verde claro (ya detectó; espera quietud o el arranque)
  // Movimiento / cierre → verde fuerte (capturando de verdad)
  if (!handVisible) {
    return {
      panel: "bg-amber-600/90",
      badge: "bg-red-600 animate-pulse",
      label: "Grabando",
    };
  }
  if (phase === "collecting" || phase === "closing") {
    return {
      panel: "bg-emerald-600/90",
      badge: "bg-emerald-600",
      label: phase === "closing" ? "Cerrando" : "Capturando",
    };
  }
  if (armedReady && phase === "arming") {
    return {
      panel: "bg-emerald-600/90",
      badge: "bg-emerald-600 animate-pulse",
      label: "Listo",
    };
  }
  return {
    panel: "bg-emerald-400/90",
    badge: "bg-emerald-400",
    label: "Mano OK",
  };
}
