import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { usePermissions } from "../../hooks/usePermissions";
import { fetchLanguageSetupCounts } from "./fetchLanguageSetupCounts";
import {
  buildSetupSteps,
  getNextSetupStep,
  getSetupStepPath,
} from "./getNextSetupStep";
import type { LanguageSetupCounts, SetupStep, SetupStepId } from "./types";

interface UseContentSetupProgressOptions {
  languages: { id: string; name: string }[];
  enabled?: boolean;
  focusLanguageId?: string | null;
}

export function useContentSetupProgress({
  languages,
  enabled = true,
  focusLanguageId,
}: UseContentSetupProgressOptions) {
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();
  const [selectedLanguageId, setSelectedLanguageId] = useLocalStorage<
    string | null
  >("selectedLanguageId", null);
  const [counts, setCounts] = useState<LanguageSetupCounts | null>(null);
  const [loading, setLoading] = useState(false);
  const [countsError, setCountsError] = useState<string | null>(null);
  const [continuingId, setContinuingId] = useState<string | null>(null);

  const preferredId = focusLanguageId || selectedLanguageId;
  const focusLanguage =
    languages.find((language) => language.id === preferredId) ??
    languages[0] ??
    null;

  const hasLanguage = languages.length > 0;
  const nextStep: SetupStepId = getNextSetupStep(hasLanguage, counts);
  const steps: SetupStep[] = buildSetupSteps(hasLanguage, counts);
  const isComplete = nextStep === "done";

  useEffect(() => {
    if (!enabled || !focusLanguage) {
      setCounts(null);
      setCountsError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setCountsError(null);

    fetchLanguageSetupCounts(focusLanguage.id, {
      includeModerators: isAdmin,
    })
      .then((result) => {
        if (!cancelled) {
          setCounts(result);
          setCountsError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCounts(null);
          setCountsError("No se pudo cargar el progreso de configuración");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, focusLanguage, isAdmin]);

  const goToStep = useCallback(
    (step: SetupStepId, languageId?: string) => {
      const targetLanguageId = languageId || focusLanguage?.id;
      if (languageId) setSelectedLanguageId(languageId);

      if (step === "language") return;

      if (step === "moderators") {
        if (!targetLanguageId) return;
        navigate(`/admin/languages/${targetLanguageId}?invite=1`);
        return;
      }

      if (step === "done" && targetLanguageId) {
        navigate(`/admin/languages/${targetLanguageId}`);
        return;
      }

      const path = getSetupStepPath(step);
      if (!path) return;
      navigate(path);
    },
    [focusLanguage?.id, navigate, setSelectedLanguageId],
  );

  const continueSetup = useCallback(
    async (languageId: string) => {
      setContinuingId(languageId);
      setSelectedLanguageId(languageId);
      try {
        const result = await fetchLanguageSetupCounts(languageId, {
          includeModerators: isAdmin,
        });
        const step = getNextSetupStep(true, result);
        if (step === "done") {
          navigate(`/admin/languages/${languageId}`);
          return;
        }
        goToStep(step, languageId);
      } finally {
        setContinuingId(null);
      }
    },
    [goToStep, isAdmin, navigate, setSelectedLanguageId],
  );

  const openWorkspace = useCallback(
    (languageId: string) => {
      setSelectedLanguageId(languageId);
      navigate(`/admin/languages/${languageId}`);
    },
    [navigate, setSelectedLanguageId],
  );

  return {
    focusLanguage,
    counts,
    countsError,
    loading,
    steps,
    nextStep,
    isComplete,
    continuingId,
    goToStep,
    continueSetup,
    openWorkspace,
    refreshCounts: async () => {
      if (!focusLanguage) return;
      try {
        const result = await fetchLanguageSetupCounts(focusLanguage.id, {
          includeModerators: isAdmin,
        });
        setCounts(result);
        setCountsError(null);
      } catch {
        setCountsError("No se pudo cargar el progreso de configuración");
      }
    },
  };
}
