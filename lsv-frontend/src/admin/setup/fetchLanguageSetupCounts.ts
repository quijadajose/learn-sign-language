import { adminApi, moderatorApi, regionApi } from "../../services/api";
import type { LanguageSetupCounts } from "./types";

function readTotal(payload: unknown): number {
  if (!payload || typeof payload !== "object") return 0;
  const data = payload as { total?: number; data?: unknown[] };
  if (typeof data.total === "number") return data.total;
  if (Array.isArray(data.data)) return data.data.length;
  if (Array.isArray(payload)) return payload.length;
  return 0;
}

export async function fetchLanguageSetupCounts(
  languageId: string,
  options?: { includeModerators?: boolean },
): Promise<LanguageSetupCounts> {
  const includeModerators = options?.includeModerators !== false;

  const [stagesRes, regionsRes, lessonsRes] = await Promise.all([
    adminApi.getStagesByLanguage(languageId, 1, 1),
    regionApi.getRegions(1, 1, languageId),
    adminApi.getLessonsByLanguage(languageId, 1, 1),
  ]);

  let moderatorCount = 0;
  if (includeModerators) {
    try {
      const moderatorsRes = await moderatorApi.listModerators({
        page: 1,
        limit: 1,
        languageId,
      });
      if (moderatorsRes.success) {
        moderatorCount = readTotal(moderatorsRes.data);
      }
    } catch {
      moderatorCount = 0;
    }
  }

  return {
    stageCount: stagesRes.success ? readTotal(stagesRes.data) : 0,
    regionCount: regionsRes.success ? readTotal(regionsRes.data) : 0,
    lessonCount: lessonsRes.success ? readTotal(lessonsRes.data) : 0,
    moderatorCount,
  };
}
