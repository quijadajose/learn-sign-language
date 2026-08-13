import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { SingleValue } from "react-select";
import {
  adminApi,
  moderatorApi,
  regionApi,
  unwrapApiList,
} from "../../services/api";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { usePermissions } from "../../hooks/usePermissions";
import { PermissionScope } from "../../types/user";
import { fetchLanguageSetupCounts } from "../setup/fetchLanguageSetupCounts";
import {
  buildSetupSteps,
  getNextSetupStep,
  getSetupStepPath,
} from "../setup/getNextSetupStep";
import type { LanguageSetupCounts, SetupStepId } from "../setup/types";
import type {
  Language as ModeratorLanguage,
  ModeratorPermission,
  Region,
  UserSelectOption,
} from "../ModeratorManagement/types";

export interface WorkspaceLanguage {
  id: string;
  name: string;
  description: string;
  countryCode?: string;
}

export function useLanguageWorkspace() {
  const { languageId = "" } = useParams<{ languageId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAdmin, hasAnyPermissionForLanguage } = usePermissions();
  const [, setSelectedLanguageId] = useLocalStorage<string | null>(
    "selectedLanguageId",
    null,
  );

  const [language, setLanguage] = useState<WorkspaceLanguage | null>(null);
  const [counts, setCounts] = useState<LanguageSetupCounts | null>(null);
  const [permissions, setPermissions] = useState<ModeratorPermission[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSelectOption | null>(
    null,
  );
  const [selectedScope, setSelectedScope] = useState<PermissionScope | "">(
    "language",
  );
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [assignLanguageId, setAssignLanguageId] = useState("");

  const canAccess =
    Boolean(languageId) &&
    (isAdmin || hasAnyPermissionForLanguage(languageId));

  const load = useCallback(async () => {
    if (!languageId) return;
    setLoading(true);
    setError(null);
    try {
      const [languageRes, countsResult, regionsRes] = await Promise.all([
        adminApi.getLanguage(languageId),
        fetchLanguageSetupCounts(languageId, { includeModerators: isAdmin }),
        regionApi.getRegions(1, 100, languageId),
      ]);

      if (!languageRes.success || !languageRes.data) {
        setError(languageRes.message || "No se encontró el lenguaje");
        setLanguage(null);
        return;
      }

      const lang = languageRes.data as WorkspaceLanguage;
      setLanguage(lang);
      setCounts(countsResult);
      setSelectedLanguageId(languageId);
      setAssignLanguageId(languageId);
      setSelectedTargetId(languageId);

      if (regionsRes.success) {
        const list = unwrapApiList<Region>(regionsRes.data);
        setRegions(
          list.map((region) => ({
            ...region,
            languageId: region.languageId || languageId,
          })),
        );
      }

      if (isAdmin) {
        const modsRes = await moderatorApi.listModerators({
          page: 1,
          limit: 50,
          languageId,
        });
        if (modsRes.success) {
          setPermissions(unwrapApiList(modsRes.data));
        }
      } else {
        setPermissions([]);
      }
    } catch {
      setError("Error al cargar el panel del lenguaje");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, languageId, setSelectedLanguageId]);

  useEffect(() => {
    if (!canAccess) {
      setLoading(false);
      setError("No tienes permiso para este lenguaje");
      return;
    }
    void load();
  }, [canAccess, load]);

  useEffect(() => {
    if (searchParams.get("invite") === "1" && isAdmin) {
      setIsAssignModalOpen(true);
      setSelectedScope("language");
      setSelectedTargetId(languageId);
      setAssignLanguageId(languageId);
      setSearchParams({}, { replace: true });
    }
  }, [isAdmin, languageId, searchParams, setSearchParams]);

  const steps = buildSetupSteps(Boolean(language), counts);
  const nextStep = getNextSetupStep(Boolean(language), counts);

  const goToStep = (step: SetupStepId) => {
    if (step === "moderators") {
      if (isAdmin) {
        setIsAssignModalOpen(true);
        setSelectedScope("language");
        setSelectedTargetId(languageId);
      }
      return;
    }
    if (step === "language") return;
    const path = getSetupStepPath(step);
    if (path) navigate(path);
  };

  const openAssignModal = () => {
    setSelectedUser(null);
    setSelectedScope("language");
    setSelectedTargetId(languageId);
    setAssignLanguageId(languageId);
    setIsAssignModalOpen(true);
  };

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    setSelectedUser(null);
    setIsSubmitting(false);
  };

  const handleAssignPermission = async () => {
    if (!selectedUser || !selectedScope || !selectedTargetId) {
      setToast({ type: "error", message: "Completa todos los campos" });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await moderatorApi.assignPermission({
        userId: selectedUser.value,
        scope: selectedScope,
        targetId: selectedTargetId,
      });
      if (response.success) {
        setToast({ type: "success", message: "Moderador asignado" });
        closeAssignModal();
        await load();
      } else {
        setToast({
          type: "error",
          message: response.message || "No se pudo asignar el permiso",
        });
      }
    } catch {
      setToast({ type: "error", message: "Error al asignar moderador" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScopeChange = (scope: PermissionScope) => {
    setSelectedScope(scope);
    if (scope === "language") {
      setSelectedTargetId(languageId);
    } else {
      setSelectedTargetId("");
    }
  };

  const languagesForModal: ModeratorLanguage[] = language
    ? [{ id: language.id, name: language.name }]
    : [];

  return {
    languageId,
    language,
    counts,
    permissions,
    regions,
    loading,
    error,
    toast,
    setToast,
    steps,
    nextStep,
    isAdmin,
    canAccess,
    goToStep,
    navigate,
    isAssignModalOpen,
    isSubmitting,
    selectedUser,
    selectedScope,
    selectedTargetId,
    assignLanguageId,
    languagesForModal,
    openAssignModal,
    closeAssignModal,
    handleAssignPermission,
    handleScopeChange,
    handleUserChange: (option: SingleValue<UserSelectOption>) =>
      setSelectedUser(option),
    setSelectedTargetId,
    setAssignLanguageId,
    reload: load,
  };
}
