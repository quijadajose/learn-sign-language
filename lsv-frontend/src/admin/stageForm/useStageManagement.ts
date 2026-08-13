import { useState, useEffect, useCallback } from "react";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { stageApi, adminApi } from "../../services/api";
import { usePermissions } from "../../hooks/usePermissions";
import { useAuth } from "../../context/AuthContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import type { Language, Stage, StageFormData, ToastMessage } from "./types";
import { CEFR_LEVELS } from "./cefrPresets";

export function useStageManagement() {
  const { isAdmin, isModerator, user } = usePermissions();
  const { token, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selectedLanguageIdByHook, setSelectedLanguageIdByHook] =
    useLocalStorage<string | null>("selectedLanguageId", null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [languageId, setLanguageId] = useState<string | null>(null);
  const [languageName, setLanguageName] = useState<string | null>(null);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [languagesLoading, setLanguagesLoading] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalStages, setTotalStages] = useState<number>(0);
  const [orderBy, setOrderBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<Stage | null>(null);
  const [formData, setFormData] = useState<StageFormData>({
    name: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [applyingCefr, setApplyingCefr] = useState(false);

  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: "success" | "error", message: string) => {
    const id = Date.now();
    setToastMessages((prev) => [...prev, { id, type, message }]);
  }, []);

  useEffect(() => {
    if (toastMessages.length === 0) return;
    const oldest = toastMessages[0];
    const timeoutId = setTimeout(() => {
      setToastMessages((prev) => prev.filter((toast) => toast.id !== oldest.id));
    }, 4000);
    return () => clearTimeout(timeoutId);
  }, [toastMessages]);

  const fetchStages = useCallback(
    async (
      langId: string,
      page: number,
      size: number,
      order: string,
      sort: "ASC" | "DESC",
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await stageApi.getStages(
          langId,
          page,
          size,
          order,
          sort,
        );

        if (response.success) {
          const responseData = response.data;
          if (
            responseData &&
            responseData.data &&
            Array.isArray(responseData.data)
          ) {
            setStages(responseData.data);
            if (responseData.total !== undefined)
              setTotalStages(responseData.total);
            if (responseData.page !== undefined)
              setCurrentPage(responseData.page);
            if (responseData.pageSize !== undefined)
              setPageSize(responseData.pageSize);
          } else {
            setStages(responseData || []);
            setTotalStages(responseData?.length || 0);
          }
        } else {
          const displayError =
            response.message || "Ocurrió un error al cargar las etapas.";
          setError(displayError);
          addToast("error", displayError);
          setStages([]);
        }
      } finally {
        setLoading(false);
      }
    },
    [addToast],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);
      if (token && selectedLanguageIdByHook) {
        fetchStages(
          selectedLanguageIdByHook,
          newPage,
          pageSize,
          orderBy,
          sortOrder,
        );
      }
    },
    [
      pageSize,
      orderBy,
      sortOrder,
      fetchStages,
      selectedLanguageIdByHook,
      token,
    ],
  );

  const handleSortChange = useCallback(
    (newOrderBy: string) => {
      const newSortOrder =
        orderBy === newOrderBy ? (sortOrder === "ASC" ? "DESC" : "ASC") : "ASC";
      const newOrderByValue = orderBy === newOrderBy ? orderBy : newOrderBy;

      setOrderBy(newOrderByValue);
      setSortOrder(newSortOrder);
      setCurrentPage(1);

      if (token && selectedLanguageIdByHook) {
        fetchStages(
          selectedLanguageIdByHook,
          1,
          pageSize,
          newOrderByValue,
          newSortOrder,
        );
      }
    },
    [
      orderBy,
      sortOrder,
      pageSize,
      fetchStages,
      selectedLanguageIdByHook,
      token,
    ],
  );

  const fetchLanguageName = useCallback(async (langId: string) => {
    const response = await adminApi.getLanguage(langId);

    if (response.success) {
      const data: { id: string; name: string } = response.data;
      setLanguageName(data?.name || null);
    } else {
      setLanguageName(null);
    }
  }, []);

  const fetchLanguages = useCallback(async () => {
    setLanguagesLoading(true);
    try {
      // Si es moderador y no es admin, filtramos por sus permisos
      if (isModerator && !isAdmin && user?.moderatorPermissions) {
        const moderatorLanguages: Language[] = [];
        const seenIds = new Set<string>();

        user.moderatorPermissions.forEach((p) => {
          if (
            p.scope === "language" &&
            p.language &&
            !seenIds.has(p.language.id)
          ) {
            moderatorLanguages.push({
              id: p.language.id,
              name: p.language.name,
              description: p.language.description,
              countryCode: p.language.countryCode,
            });
            seenIds.add(p.language.id);
          } else if (
            p.scope === "region" &&
            p.region?.language &&
            !seenIds.has(p.region.language.id)
          ) {
            moderatorLanguages.push({
              id: p.region.language.id,
              name: p.region.language.name,
              description: p.region.language.description,
              countryCode: p.region.language.countryCode,
            });
            seenIds.add(p.region.language.id);
          }
        });
        setLanguages(moderatorLanguages);
        return moderatorLanguages;
      }

      const response = await adminApi.getLanguages(1, 100);

      if (response.success) {
        const responseData = response.data;
        let fetchedLanguages: Language[] = [];
        if (
          responseData &&
          responseData.data &&
          Array.isArray(responseData.data)
        ) {
          fetchedLanguages = responseData.data;
        } else if (Array.isArray(responseData)) {
          fetchedLanguages = responseData;
        }
        setLanguages(fetchedLanguages);
        return fetchedLanguages;
      } else {
        addToast("error", "Error al cargar la lista de idiomas");
        setLanguages([]);
        return [];
      }
    } catch (error) {
      addToast("error", "Error al cargar la lista de idiomas");
      setLanguages([]);
      return [];
    } finally {
      setLanguagesLoading(false);
    }
  }, [addToast, isAdmin, isModerator, user?.moderatorPermissions]);

  const handleLanguageChange = useCallback(
    async (newLanguageId: string, options?: { silent?: boolean }) => {
      if (newLanguageId === languageId) return;

      setLanguageId(newLanguageId);
      setSelectedLanguageIdByHook(newLanguageId);
      setError(null);

      await fetchLanguageName(newLanguageId);

      setCurrentPage(1);
      await fetchStages(newLanguageId, 1, pageSize, orderBy, sortOrder);

      if (!options?.silent) {
        addToast("success", "Idioma cambiado correctamente");
      }
    },
    [
      languageId,
      fetchLanguageName,
      fetchStages,
      pageSize,
      orderBy,
      sortOrder,
      addToast,
      setSelectedLanguageIdByHook,
    ],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setError("No estás autenticado. Redirigiendo al login...");
      addToast("error", "No estás autenticado. Redirigiendo al login...");
      setLoading(false);
      const timer = setTimeout(() => navigate("/login"), 3000);
      return () => clearTimeout(timer);
    }

    let cancelled = false;

    const initialize = async () => {
      setLoading(true);
      setError(null);

      try {
        const fetchedLangs = await fetchLanguages();
        if (cancelled) return;

        const isUuid = (val: string | null): boolean =>
          !!val && z.string().uuid().safeParse(val).success;

        let currentLangId = selectedLanguageIdByHook;
        const stillValid =
          currentLangId &&
          isUuid(currentLangId) &&
          fetchedLangs.some((lang) => lang.id === currentLangId);

        if (!stillValid && fetchedLangs.length > 0) {
          currentLangId = fetchedLangs[0].id;
          setSelectedLanguageIdByHook(currentLangId);
        }

        if (!currentLangId || !isUuid(currentLangId)) {
          if (cancelled) return;
          setLanguageId(null);
          setStages([]);
          return;
        }

        if (cancelled) return;
        setLanguageId(currentLangId);
        await Promise.all([
          fetchStages(currentLangId, 1, pageSize, orderBy, sortOrder),
          fetchLanguageName(currentLangId),
        ]);
        if (cancelled) return;
        setCurrentPage(1);
      } catch (err) {
        if (!cancelled) {
          console.error("Error during initialization:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    void initialize();

    return () => {
      cancelled = true;
    };
    // Intentionally mount-driven: language changes go through handleLanguageChange.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid re-init loops with localStorage
  }, [isAuthenticated]);

  // Safety net: languages loaded but selection missing (e.g. race on first paint).
  useEffect(() => {
    if (loading || languagesLoading || languageId || languages.length === 0) {
      return;
    }
    void handleLanguageChange(languages[0].id, { silent: true });
  }, [
    loading,
    languagesLoading,
    languageId,
    languages,
    handleLanguageChange,
  ]);

  const openAddModal = () => {
    setFormData({ name: "", description: "" });
    setCurrentStage(null);
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setFormData({ name: "", description: "" });
  };

  const openEditModal = (stage: Stage) => {
    setCurrentStage(stage);
    setFormData({ name: stage.name, description: stage.description });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setCurrentStage(null);
    setFormData({ name: "", description: "" });
  };

  const openDeleteModal = (stage: Stage) => {
    setCurrentStage(stage);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCurrentStage(null);
  };

  const handleDeleteStage = async () => {
    if (!currentStage) {
      addToast("error", "No se ha seleccionado una etapa para eliminar.");
      return;
    }

    setIsDeleting(true);

    try {
      if (!isAuthenticated) {
        addToast("error", "Autenticación requerida.");
        return;
      }

      const response = await stageApi.deleteStage(currentStage.id);

      if (response.success) {
        addToast("success", "Etapa eliminada correctamente.");
        closeDeleteModal();

        if (languageId) {
          await fetchStages(
            languageId,
            currentPage,
            pageSize,
            orderBy,
            sortOrder,
          );
        }
      } else {
        addToast("error", `Error al eliminar etapa: ${response.message}`);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!languageId || !formData.name) {
      addToast("error", "El nombre de la etapa es obligatorio.");
      return;
    }
    setIsSubmitting(true);

    try {
      if (!isAuthenticated) {
        addToast("error", "Autenticación requerida.");
        return;
      }

      const response = await stageApi.createStage({
        ...formData,
        languageId: languageId,
      });

      if (response.success) {
        const newStage: Stage = response.data || {
          ...formData,
          languageId,
        };

        setStages((prev) => [...prev, newStage]);
        setTotalStages((prev) => prev + 1);
        addToast("success", "Etapa creada correctamente.");
        closeAddModal();
      } else {
        addToast("error", `Error al crear etapa: ${response.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyCefr = async () => {
    if (!languageId) {
      addToast("error", "Selecciona un lenguaje primero.");
      return;
    }
    if (!isAuthenticated) {
      addToast("error", "Autenticación requerida.");
      return;
    }

    setApplyingCefr(true);
    let created = 0;
    let skipped = 0;

    try {
      for (const level of CEFR_LEVELS) {
        const alreadyExists = stages.some(
          (stage) =>
            stage.name === level.name ||
            stage.name === level.code ||
            stage.name.startsWith(`${level.code} `) ||
            stage.name.startsWith(`${level.code}—`) ||
            stage.name.startsWith(`${level.code} -`),
        );
        if (alreadyExists) {
          skipped += 1;
          continue;
        }

        const response = await stageApi.createStage({
          name: level.name,
          description: level.description,
          languageId,
        });

        if (response.success) {
          created += 1;
        } else if (response.message?.toLowerCase().includes("already")) {
          skipped += 1;
        } else {
          addToast(
            "error",
            `No se pudo crear ${level.code}: ${response.message || "error"}`,
          );
        }
      }

      await fetchStages(languageId, 1, pageSize, orderBy, sortOrder);
      setCurrentPage(1);

      if (created > 0) {
        addToast(
          "success",
          skipped > 0
            ? `Se crearon ${created} etapas (${skipped} ya existían).`
            : "Se crearon los niveles MCER (A1–C2).",
        );
      } else if (skipped > 0) {
        addToast("success", "Los niveles MCER ya estaban creados.");
      }
    } finally {
      setApplyingCefr(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStage || !languageId || !formData.name) {
      addToast("error", "Datos incompletos para editar la etapa.");
      return;
    }
    setIsSubmitting(true);

    try {
      if (!isAuthenticated) {
        addToast("error", "Autenticación requerida.");
        return;
      }

      const response = await stageApi.updateStage(currentStage.id, {
        ...formData,
        languageId: languageId,
      });

      if (response.success) {
        const updatedStageData = response.data || {};
        const updatedStage: Stage = {
          ...currentStage,
          name: updatedStageData.name || formData.name,
          description: updatedStageData.description || formData.description,
          languageId: updatedStageData.languageId || languageId,
        };

        setStages((prev) =>
          prev.map((stage) =>
            stage.id === currentStage.id ? updatedStage : stage,
          ),
        );
        addToast("success", "Etapa actualizada correctamente.");
        closeEditModal();
      } else {
        addToast("error", `Error al editar etapa: ${response.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    stages,
    loading,
    error,
    languageId,
    languageName,
    languages,
    languagesLoading,
    currentPage,
    pageSize,
    totalStages,
    orderBy,
    sortOrder,
    showAddModal,
    showEditModal,
    showDeleteModal,
    currentStage,
    formData,
    isSubmitting,
    isDeleting,
    toastMessages,
    setToastMessages,
    handlePageChange,
    handleSortChange,
    handleLanguageChange,
    openAddModal,
    closeAddModal,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteStage,
    handleInputChange,
    handleAddSubmit,
    handleApplyCefr,
    applyingCefr,
    handleEditSubmit,
  };
}
