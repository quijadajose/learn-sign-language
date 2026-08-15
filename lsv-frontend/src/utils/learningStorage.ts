export const SELECTED_STAGE_ID_PREFIX = "selectedStageId_";
export const SELECTED_STAGE_EXPLICIT_PREFIX = "selectedStageExplicit_";

const STAGE_SELECTION_PREFIXES = [
  SELECTED_STAGE_ID_PREFIX,
  SELECTED_STAGE_EXPLICIT_PREFIX,
] as const;

export function stageSelectionStorageKeys(languageId: string) {
  return {
    stageId: `${SELECTED_STAGE_ID_PREFIX}${languageId}`,
    explicit: `${SELECTED_STAGE_EXPLICIT_PREFIX}${languageId}`,
  };
}

function notifyLocalStorageChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("local-storage"));
}

function listMatchingKeys(matches: (key: string) => boolean): string[] {
  if (typeof window === "undefined") return [];

  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && matches(key)) {
        keys.push(key);
      }
    }
    return keys;
  } catch {
    return [];
  }
}

function removeKeys(keys: string[]) {
  if (typeof window === "undefined" || keys.length === 0) return;

  try {
    for (const key of keys) {
      window.localStorage.removeItem(key);
    }
    notifyLocalStorageChanged();
  } catch {
    /* ignore quota / private-mode failures */
  }
}

/** Drops remembered stage selection for one sign language (e.g. unenroll). */
export function clearStageSelectionForLanguage(languageId: string) {
  if (!languageId) return;
  const { stageId, explicit } = stageSelectionStorageKeys(languageId);
  removeKeys([stageId, explicit]);
}

/** Drops all per-language stage keys so they do not leak across sessions. */
export function clearAllStageSelections() {
  removeKeys(
    listMatchingKeys((key) =>
      STAGE_SELECTION_PREFIXES.some((prefix) => key.startsWith(prefix)),
    ),
  );
}
