import { useState, useEffect, useRef, useCallback } from "react";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../../hooks/usePermissions";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import {
  adminApi,
  regionApi,
  lessonVariantApi,
  unwrapApiList,
} from "../../services/api";
import {
  Language,
  Region,
  LessonVariant,
  Lesson,
  LessonDetail,
  StageItem,
  ToastMessage,
  LanguagesResponse,
  LessonsResponse,
  LessonFormState,
  VariantFormState,
} from "./types";
import { useQuillConfig } from "./useQuillConfig";

export function useLessonManagement() {
  const navigate = useNavigate();
  const {
    isAdmin,
    isModerator,
    user,
    hasLanguagePermission,
    hasRegionPermission,
    hasAnyPermissionForLanguage,
  } = usePermissions();
  const [selectedLanguageId, setSelectedLanguageId] = useLocalStorage<string>(
    "selectedLanguageId",
    "",
  );
  const [languages, setLanguages] = useState<Language[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLessons, setTotalLessons] = useState(0);
  const [filterStageId, setFilterStageId] = useState<string>("");
  const [filterStages, setFilterStages] = useState<StageItem[]>([]);
  const [filterStagesLoading, setFilterStagesLoading] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonDetail | null>(
    null,
  );
  const [viewLoading, setViewLoading] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const isInitialized = useRef(false);

  const addToast = useCallback((type: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((prev: ToastMessage[]) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev: ToastMessage[]) =>
        prev.filter((t: ToastMessage) => t.id !== id),
      );
    }, 3500);
  }, []);

  const { quillModules, quillEditModules, quillFormats, quillConfig } =
    useQuillConfig(addToast);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [stagesLoading, setStagesLoading] = useState(false);
  const [stages, setStages] = useState<StageItem[]>([]);
  const editLessonIdRef = useRef<string | null>(null);
  const [editForm, setEditForm] = useState<LessonFormState>({
    name: "",
    description: "",
    content: "",
    languageId: "",
    stageId: "",
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState<LessonFormState>({
    name: "",
    description: "",
    content: "",
    languageId: "",
    stageId: "",
  });

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [regions, setRegions] = useState<Region[]>([]);
  const selectedLessonIdRef = useRef<string | null>(null);
  const [lessonVariants, setLessonVariants] = useState<LessonVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [isCreateVariantModalOpen, setIsCreateVariantModalOpen] =
    useState(false);
  const [variantForm, setVariantForm] = useState<VariantFormState>({
    name: "",
    description: "",
    content: "",
    regionId: "",
    isRegionalSpecific: false,
    isBase: false,
    regionalNotes: "",
  });
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);

  const fetchLanguages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
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
              description: p.language.description || "",
              createdAt: p.language.createdAt || "",
              updatedAt: p.language.updatedAt || "",
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
              description: p.region.language.description || "",
              createdAt: p.region.language.createdAt || "",
              updatedAt: p.region.language.updatedAt || "",
            });
            seenIds.add(p.region.language.id);
          }
        });
        setLanguages(moderatorLanguages);
        return moderatorLanguages;
      }

      const response = await adminApi.getLanguages();

      if (response.success) {
        const data: LanguagesResponse = response.data;
        setLanguages(data.data);
        return data.data;
      } else {
        setError(response.message || "Error al cargar idiomas");
        return [];
      }
    } finally {
      setLoading(false);
    }
  }, [isModerator, isAdmin, user?.moderatorPermissions]);

  const fetchRegions = useCallback(
    async (languageId?: string) => {
      try {
        const response = await regionApi.getRegions(1, 100, languageId);
        if (response.success) {
          setRegions(unwrapApiList(response.data));
        } else {
          addToast("error", response.message || "Error al cargar las regiones");
        }
      } catch (err) {
        addToast("error", "Error de conexión al cargar las regiones");
      }
    },
    [addToast],
  );

  const fetchLessonsByLanguage = useCallback(
    async (languageId: string, page: number = 1, stageId?: string) => {
      if (!languageId) return;

      setLessonsLoading(true);
      setError(null);

      try {
        const response = await adminApi.getLessonsByLanguage(
          languageId,
          page,
          100,
          stageId,
        );

        if (response.success) {
          const data: LessonsResponse = response.data;
          setLessons(data.data);
          setTotalPages(Math.ceil(data.total / data.pageSize));
          setCurrentPage(data.page);
          setTotalLessons(data.total);
        } else {
          setError(response.message || "Error al cargar lecciones");
        }
      } finally {
        setLessonsLoading(false);
      }
    },
    [],
  );

  const fetchLessonDetail = async (lessonId: string) => {
    setViewLoading(true);
    setError(null);

    try {
      const response = await adminApi.getLesson(lessonId);

      if (response.success) {
        const lessonDetail: LessonDetail = response.data;
        setSelectedLesson(lessonDetail);
        setIsViewModalOpen(true);
      } else {
        setError(response.message || "Error al cargar detalles de la lección");
      }
    } finally {
      setViewLoading(false);
    }
  };

  const fetchLessonForEdit = async (lessonId: string) => {
    try {
      setEditLoading(true);
      setError(null);

      const response = await adminApi.getLesson(lessonId);

      if (!response.success) {
        const errorMessage = response.message || "Error al cargar lección";
        throw new Error(errorMessage);
      }

      const lessonDetail: LessonDetail = response.data;
      setEditForm((prev) => ({
        ...prev,
        name: lessonDetail.name,
        description: lessonDetail.description,
        content: lessonDetail.content,
        stageId: lessonDetail.stage?.id || prev.stageId,
      }));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cargar lección";
      setError(errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  const fetchStages = async (languageId: string) => {
    if (!languageId) return;
    try {
      setStagesLoading(true);
      setError(null);

      const response = await adminApi.getStagesByLanguage(languageId, 1, 5);

      if (!response.success) {
        throw new Error(response.message || "Error al cargar etapas");
      }

      setStages(response.data.data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cargar etapas";
      setError(errorMessage);
    } finally {
      setStagesLoading(false);
    }
  };

  const fetchFilterStages = useCallback(
    async (languageId: string) => {
      if (!languageId) return;
      try {
        setFilterStagesLoading(true);

        const response = await adminApi.getStagesByLanguage(languageId, 1, 100);

        if (!response.success) {
          throw new Error(response.message || "Error al cargar etapas");
        }

        setFilterStages(response.data.data);
      } catch (err) {
        console.error(err);
        addToast("error", "Error al cargar las etapas para el filtro");
      } finally {
        setFilterStagesLoading(false);
      }
    },
    [addToast],
  );

  const handleOpenEditModal = (lesson: Lesson) => {
    setIsEditModalOpen(true);
    editLessonIdRef.current = lesson.id;
    const langId = lesson.languageId || selectedLanguageId;
    setEditForm({
      name: lesson.name,
      description: lesson.description,
      content: "",
      languageId: langId,
      stageId: "",
    });
    fetchLessonForEdit(lesson.id);
    fetchStages(langId);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    editLessonIdRef.current = null;
    setStages([]);
    setEditForm({
      name: "",
      description: "",
      content: "",
      languageId: "",
      stageId: "",
    });
  };

  const handleOpenDeleteModal = (lesson: Lesson) => {
    setDeletingLesson(lesson);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setIsDeleteModalOpen(false);
    setDeletingLesson(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingLesson) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await adminApi.deleteLesson(deletingLesson.id);

      if (response.success) {
        addToast("success", "Lección eliminada correctamente");
        setIsDeleteModalOpen(false);
        setDeletingLesson(null);
        if (selectedLanguageId) {
          await fetchLessonsByLanguage(
            selectedLanguageId,
            currentPage,
            filterStageId,
          );
        }
      } else {
        setError(response.message || "Error al eliminar lección");
        addToast("error", response.message || "Error al eliminar lección");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!editLessonIdRef.current) return;
    if (
      !editForm.name ||
      !editForm.description ||
      !editForm.languageId ||
      !editForm.stageId
    ) {
      setError("Completa los campos requeridos");
      return;
    }
    try {
      setEditLoading(true);
      setError(null);
      const response = await adminApi.updateLesson(editLessonIdRef.current, {
        name: editForm.name,
        description: editForm.description,
        content: editForm.content,
        languageId: editForm.languageId,
        stageId: editForm.stageId,
      });

      if (!response.success) {
        throw new Error(response.message || "Error al actualizar lección");
      }

      if (editForm.languageId) {
        const isSameLang = editForm.languageId === selectedLanguageId;
        await fetchLessonsByLanguage(
          editForm.languageId,
          1,
          isSameLang ? filterStageId : undefined,
        );
      }
      handleCloseEditModal();
      addToast("success", "Lección actualizada correctamente");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al actualizar lección";
      setError(errorMessage);
      addToast("error", errorMessage);
    } finally {
      setEditLoading(false);
    }
  };

  const handleViewClick = (lessonId: string) => {
    fetchLessonDetail(lessonId);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedLesson(null);
  };

  useEffect(() => {
    const initialize = async () => {
      if (isInitialized.current) return;
      isInitialized.current = true;

      const fetchedLangs = await fetchLanguages();
      let langId = selectedLanguageId;

      const isUuid = (val: string | null): boolean =>
        !!val && z.string().uuid().safeParse(val).success;

      if (
        (!langId || !isUuid(langId)) &&
        fetchedLangs &&
        fetchedLangs.length > 0
      ) {
        langId = fetchedLangs[0].id;
        setSelectedLanguageId(langId);
      }

      if (langId && isUuid(langId)) {
        setSelectedLanguageId(langId);
      }
    };

    initialize();
  }, [fetchLanguages, selectedLanguageId, setSelectedLanguageId]);

  useEffect(() => {
    if (selectedLanguageId) {
      void fetchLessonsByLanguage(selectedLanguageId, 1, filterStageId);
      void fetchRegions(selectedLanguageId);
      void fetchFilterStages(selectedLanguageId);
    } else {
      setLessons([]);
      setFilterStages([]);
      setFilterStageId("");
      setRegions([]);
      setTotalPages(1);
      setCurrentPage(1);
      setTotalLessons(0);
    }
  }, [
    selectedLanguageId,
    filterStageId,
    fetchLessonsByLanguage,
    fetchRegions,
    fetchFilterStages,
  ]);

  const handleLanguageChange = (languageId: string) => {
    setSelectedLanguageId(languageId);
    setFilterStageId("");
  };

  const handleStageChange = (stageId: string) => {
    setFilterStageId(stageId);
    if (selectedLanguageId) {
      fetchLessonsByLanguage(selectedLanguageId, 1, stageId);
    }
  };

  const handlePageChange = (page: number) => {
    if (selectedLanguageId) {
      fetchLessonsByLanguage(selectedLanguageId, page, filterStageId);
    }
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
    const langId = selectedLanguageId || "";
    setCreateForm({
      name: "",
      description: "",
      content: "",
      languageId: langId,
      stageId: filterStageId || "",
    });
    if (langId) {
      fetchStages(langId);
    }
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateForm({
      name: "",
      description: "",
      content: "",
      languageId: "",
      stageId: "",
    });
  };

  const handleSubmitCreate = async () => {
    if (
      !createForm.name ||
      !createForm.description ||
      !createForm.languageId ||
      !createForm.stageId
    ) {
      setError("Completa los campos requeridos");
      return;
    }
    try {
      setCreateLoading(true);
      setError(null);
      const response = await adminApi.createLesson({
        name: createForm.name,
        description: createForm.description,
        content: createForm.content,
        languageId: createForm.languageId,
        stageId: createForm.stageId,
      });

      if (!response.success) {
        const errorMessage = response.message || "Error al crear lección";
        throw new Error(errorMessage);
      }

      if (createForm.languageId) {
        const isSameLang = createForm.languageId === selectedLanguageId;
        if (!isSameLang) {
          setFilterStageId("");
        }
        await fetchLessonsByLanguage(
          createForm.languageId,
          1,
          isSameLang ? filterStageId : undefined,
        );
        setSelectedLanguageId(createForm.languageId);
      }
      handleCloseCreateModal();
      addToast("success", "Lección creada correctamente");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al crear lección";
      setError(errorMessage);
      addToast("error", errorMessage);
    } finally {
      setCreateLoading(false);
    }
  };

  const loadLessonVariants = async (lessonId: string) => {
    try {
      setVariantsLoading(true);
      const response = await lessonVariantApi.getLessonVariants(lessonId);

      if (response.success) {
        setLessonVariants(response.data || []);
      } else {
        addToast("error", response.message || "Error al cargar las variantes");
      }
    } catch (err) {
      addToast("error", "Error de conexión al cargar las variantes");
    } finally {
      setVariantsLoading(false);
    }
  };

  const handleCreateVariant = async () => {
    if (
      !selectedLessonIdRef.current ||
      !variantForm.name.trim() ||
      !variantForm.description.trim() ||
      !variantForm.content.trim() ||
      !variantForm.regionId
    ) {
      addToast("error", "Todos los campos son obligatorios");
      return;
    }

    try {
      setCreateLoading(true);
      const baseVariant = lessonVariants.find((v) => v.isBase);
      const canSetAsBase =
        !baseVariant || baseVariant.id === editingVariantId;
      const payload = {
        ...variantForm,
        isBase: canSetAsBase ? variantForm.isBase : false,
      };
      const response = editingVariantId
        ? await lessonVariantApi.updateLessonVariant(
            selectedLessonIdRef.current,
            editingVariantId,
            payload,
          )
        : await lessonVariantApi.createLessonVariant(
            selectedLessonIdRef.current,
            payload,
          );

      if (response.success) {
        addToast(
          "success",
          editingVariantId
            ? "Variante regional actualizada exitosamente"
            : "Variante regional creada exitosamente",
        );
        setIsCreateVariantModalOpen(false);
        setEditingVariantId(null);
        setVariantForm({
          name: "",
          description: "",
          content: "",
          regionId: "",
          isRegionalSpecific: false,
          isBase: false,
          regionalNotes: "",
        });
        loadLessonVariants(selectedLessonIdRef.current);
      } else {
        addToast(
          "error",
          response.message ||
            `Error al ${editingVariantId ? "actualizar" : "crear"} la variante`,
        );
      }
    } catch (err) {
      addToast(
        "error",
        `Error de conexión al ${editingVariantId ? "actualizar" : "crear"} la variante`,
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const handleOpenVariantEditModal = (variant: LessonVariant) => {
    setEditingVariantId(variant.id);
    setVariantForm({
      name: variant.name,
      description: variant.description,
      content: variant.content,
      regionId: variant.region.id,
      isRegionalSpecific: variant.isRegionalSpecific,
      isBase: variant.isBase,
      regionalNotes: variant.regionalNotes || "",
    });
    setIsCreateVariantModalOpen(true);
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!selectedLessonIdRef.current) return;

    try {
      const response = await lessonVariantApi.deleteLessonVariant(
        selectedLessonIdRef.current,
        variantId,
      );

      if (response.success) {
        addToast("success", "Variante eliminada exitosamente");
        loadLessonVariants(selectedLessonIdRef.current);
      } else {
        addToast("error", response.message || "Error al eliminar la variante");
      }
    } catch (err) {
      addToast("error", "Error de conexión al eliminar la variante");
    }
  };

  const openVariantsModal = (lessonId: string) => {
    selectedLessonIdRef.current = lessonId;
    setIsVariantModalOpen(true);
    loadLessonVariants(lessonId);
  };

  const openCreateVariantModal = () => {
    setEditingVariantId(null);
    setVariantForm({
      name: "",
      description: "",
      content: "",
      regionId: "",
      isRegionalSpecific: false,
      isBase: false,
      regionalNotes: "",
    });
    setIsCreateVariantModalOpen(true);
  };

  const handleCloseVariantModal = () => {
    setIsVariantModalOpen(false);
  };

  const handleCloseVariantFormModal = () => {
    setIsCreateVariantModalOpen(false);
    setEditingVariantId(null);
  };

  const handleCancelVariantFormModal = () => {
    setIsCreateVariantModalOpen(false);
  };

  const dismissToast = (id: number) => {
    setToasts((prev: ToastMessage[]) =>
      prev.filter((x: ToastMessage) => x.id !== id),
    );
  };

  return {
    navigate,
    hasLanguagePermission,
    hasRegionPermission,
    hasAnyPermissionForLanguage,
    languages,
    lessons,
    loading,
    lessonsLoading,
    error,
    currentPage,
    totalPages,
    totalLessons,
    filterStageId,
    filterStages,
    filterStagesLoading,
    selectedLanguageId,
    isViewModalOpen,
    selectedLesson,
    viewLoading,
    toasts,
    isEditModalOpen,
    editLoading,
    stagesLoading,
    stages,
    editForm,
    isCreateModalOpen,
    createLoading,
    createForm,
    isDeleteModalOpen,
    deletingLesson,
    isDeleting,
    regions,
    lessonVariants,
    variantsLoading,
    isVariantModalOpen,
    isCreateVariantModalOpen,
    variantForm,
    editingVariantId,
    quillModules,
    quillEditModules,
    quillFormats,
    quillConfig,
    handleLanguageChange,
    handleStageChange,
    handlePageChange,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleSubmitCreate,
    handleViewClick,
    handleCloseViewModal,
    handleOpenEditModal,
    handleCloseEditModal,
    handleSubmitEdit,
    handleOpenDeleteModal,
    handleCloseDeleteModal,
    handleConfirmDelete,
    openVariantsModal,
    openCreateVariantModal,
    handleCloseVariantModal,
    handleCloseVariantFormModal,
    handleCancelVariantFormModal,
    handleOpenVariantEditModal,
    handleDeleteVariant,
    handleCreateVariant,
    setCreateForm,
    setEditForm,
    setVariantForm,
    fetchStages,
    dismissToast,
  };
}
