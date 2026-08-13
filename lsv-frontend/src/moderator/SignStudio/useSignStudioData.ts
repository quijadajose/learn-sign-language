import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import {
  adminApi,
  signRecordApi,
  regionApi,
  unwrapApiList,
} from "../../services/api";
import { BACKEND_BASE_URL } from "../../config";
import { usePermissions } from "../../hooks/usePermissions";
import { useAuth } from "../../context/AuthContext";
import type { SignDetectionType } from "../../utils/signDetection";
import {
  toast,
  filterAndSortSigns,
  buildTrainingModelName,
} from "./signStudioUtils";
import type { BulkSignDraft } from "./signCatalogPresets";
import type { Language, Region } from "../../types/user";
import type { CustomTrainingFilters } from "../../types/signRecord";
import type {
  Lesson,
  Sign,
  ConfirmConfig,
  TrainingMode,
  SignRecording,
  StudioModel,
} from "./types";

interface StudioStage {
  id: string;
  name: string;
}

export function useSignStudioData() {
  const { isAdmin, isModerator, user } = usePermissions();
  const { token } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkLessonId = useRef<string | null>(
    searchParams.get("lessonId"),
  );
  const deepLinkLanguageId = useRef<string | null>(
    searchParams.get("languageId"),
  );
  const deepLinkStageId = useRef<string | null>(null);
  const deepLinkApplied = useRef(false);

  // Hierarchy state
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState("");
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [stages, setStages] = useState<StudioStage[]>([]);
  const [selectedStageId, setSelectedStageId] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [signs, setSigns] = useState<Sign[]>([]);
  const [globalSigns, setGlobalSigns] = useState<Sign[]>([]);
  const [selectedSignId, setSelectedSignId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [totalSigns, setTotalSigns] = useState(0);
  const [signsPerPage] = useState(10);

  const [signRecordings, setSignRecordings] = useState<SignRecording[]>([]);
  const [selectedPlaybackRecording, setSelectedPlaybackRecording] =
    useState<SignRecording | null>(null);
  const [showPlaybackModal, setShowPlaybackModal] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  // Training Selection State
  const [selectedTrainingSignIds, setSelectedTrainingSignIds] = useState<string[]>([]);
  const [models, setModels] = useState<StudioModel[]>([]);

  // Sorting State
  const [sortKey, setSortKey] = useState<"name" | "createdAt">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTesterModal, setShowTesterModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [selectedLogsModel, setSelectedLogsModel] = useState<StudioModel | null>(
    null,
  );
  const [selectedTesterModel, setSelectedTesterModel] =
    useState<StudioModel | null>(null);
  const [newSignName, setNewSignName] = useState("");
  const [newSignDetectionType, setNewSignDetectionType] = useState<SignDetectionType>("static");
  const [isNewSignGlobal, setIsNewSignGlobal] = useState(false);
  const [isCreatingSigns, setIsCreatingSigns] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>({
    title: "",
    message: "",
    onConfirm: () => {},
    confirmLabel: "Sí, estoy seguro",
    cancelLabel: "No, cancelar"
  });

  useEffect(() => {
    let cancelled = false;

    async function loadLanguages() {
      try {
        if (isModerator && !isAdmin && user?.moderatorPermissions) {
          const moderatorLanguages: { id: string; name: string }[] = [];
          const seenIds = new Set<string>();
          user.moderatorPermissions.forEach((p) => {
            if (p.scope === "language" && p.language && !seenIds.has(p.language.id)) {
              moderatorLanguages.push({ id: p.language.id, name: p.language.name });
              seenIds.add(p.language.id);
            } else if (
              p.scope === "region" &&
              p.region?.language &&
              !seenIds.has(p.region.language.id)
            ) {
              moderatorLanguages.push({
                id: p.region.language.id,
                name: p.region.language.name,
              });
              seenIds.add(p.region.language.id);
            }
          });
          if (!cancelled) setLanguages(moderatorLanguages);
          return;
        }

        const langRes = await adminApi.getLanguages();
        if (cancelled) return;
        if (langRes && langRes.success) {
          setLanguages(unwrapApiList(langRes.data));
        }
      } catch (error) {
        console.error("Error loading languages:", error);
      }
    }

    loadLanguages();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, isModerator, user?.moderatorPermissions]);

  // Deep-link from lessons/quizzes: ?languageId=&lessonId=
  useEffect(() => {
    if (deepLinkApplied.current || languages.length === 0) return;

    const languageId = deepLinkLanguageId.current;
    const lessonId = deepLinkLessonId.current;
    if (!languageId && !lessonId) return;

    let cancelled = false;

    async function applyDeepLink() {
      let langId = languageId;
      let stageId: string | null = null;

      if (lessonId) {
        try {
          const res = await adminApi.getLesson(lessonId);
          if (cancelled || !res.success || !res.data) return;
          const lesson = res.data as {
            languageId?: string;
            language?: { id?: string };
            stage?: { id?: string };
          };
          langId =
            langId ||
            lesson.languageId ||
            lesson.language?.id ||
            null;
          stageId = lesson.stage?.id || null;
          deepLinkStageId.current = stageId;
        } catch {
          toast.error("No se pudo abrir la lección en Sign Studio");
          return;
        }
      }

      if (langId && languages.some((item) => item.id === langId)) {
        setSelectedLanguageId(langId);
      }
    }

    void applyDeepLink();
    return () => {
      cancelled = true;
    };
  }, [languages]);

  useEffect(() => {
    if (deepLinkApplied.current) return;
    if (!deepLinkStageId.current || stages.length === 0) return;
    if (stages.some((stage) => stage.id === deepLinkStageId.current)) {
      setSelectedStageId(deepLinkStageId.current);
    }
  }, [stages]);

  useEffect(() => {
    if (deepLinkApplied.current) return;
    if (!deepLinkLessonId.current || lessons.length === 0) return;
    if (lessons.some((lesson) => lesson.id === deepLinkLessonId.current)) {
      setSelectedLessonId(deepLinkLessonId.current);
      deepLinkApplied.current = true;
      setSearchParams({}, { replace: true });
    }
  }, [lessons, setSearchParams]);

  useEffect(() => {
    if (!selectedLanguageId || selectedRegionId || regions.length === 0) {
      return;
    }
    const preferred =
      regions.find((region) => region.isDefault) ?? regions[0];
    if (preferred) {
      setSelectedRegionId(preferred.id);
    }
  }, [regions, selectedLanguageId, selectedRegionId]);

  const fetchModels = async () => {
    try {
      const res = await signRecordApi.getModels();
      if (res.success) {
        setModels(unwrapApiList<StudioModel>(res.data));
      } else {
        toast.error(res.message || "Error al cargar modelos");
      }
    } catch {
      toast.error("Error al cargar modelos");
    }
  };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await signRecordApi.getModels();
        if (cancelled) return;
        if (res.success) {
          setModels(unwrapApiList<StudioModel>(res.data));
        } else {
          toast.error(res.message || "Error al cargar modelos");
        }
      } catch {
        if (!cancelled) toast.error("Error al cargar modelos");
      }
    })();

    const socketUrl = BACKEND_BASE_URL.replace(/\/api\/?$/, "");
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      auth: token ? { token } : undefined,
    });

    socket.on('connect', () => {
      socket.emit('subscribeAdmin');
    });

    socket.on('admin:training-progress', (data) => {
      setModels(prev => prev.map(m =>
        (m.id === data.modelId || m.trainingJobId === data.modelId)
          ? { ...m, progress: data.progress, accuracy: data.accuracy, status: 'TRAINING' }
          : m
      ));
    });

    socket.on('admin:model-status', (data) => {
      setModels(prev => prev.map(m =>
        (m.id === data.modelId || m.trainingJobId === data.modelId)
          ? { ...m, status: data.status, progress: data.status === 'PENDING' ? 0 : m.progress }
          : m
      ));
    });

    socket.on('admin:model-ready', (data) => {
      const warningCount =
        data?.warnings?.length ||
        data?.trainingLogs?.warnings?.length ||
        data?.logs?.warnings?.length ||
        0;
      if (warningCount > 0) {
        toast.error(
          `Modelo listo con ${warningCount} advertencia(s). Revisa Logs antes de usarlo.`,
        );
      } else {
        toast.success("Modelo listo");
      }
      setModels(prev => prev.map(m =>
        (m.id === data.modelId || m.trainingJobId === data.modelId)
          ? {
              ...m,
              ...data,
              status: 'READY',
              trainingLogs: data.trainingLogs || data.logs || m.trainingLogs,
            }
          : m
      ));
    });

    return () => {
      cancelled = true;
      socket.off("connect");
      socket.off("admin:training-progress");
      socket.off("admin:model-status");
      socket.off("admin:model-ready");
      socket.disconnect();
    };
  }, [token]);

  const fetchRegions = useCallback(async () => {
    try {
      const res = await regionApi.getRegions(1, 100, selectedLanguageId);
      if (res.success) {
        setRegions(unwrapApiList(res.data));
      }
    } catch (err) {
      console.error("Error fetching regions:", err);
    }
  }, [selectedLanguageId]);

  const fetchStages = useCallback(async () => {
    try {
      const res = await adminApi.getStagesByLanguage(selectedLanguageId, 1, 100);
      if (res.success) {
        setStages(unwrapApiList(res.data));
      }
    } catch (err) {
      toast.error("Error al cargar etapas");
    }
  }, [selectedLanguageId]);

  // Load Regions and Stages when Language changes
  useEffect(() => {
    if (selectedLanguageId) {
      void fetchRegions();
      void fetchStages();
    } else {
      setRegions([]);
      setSelectedRegionId("");
      setStages([]);
      setSelectedStageId("");
    }
  }, [selectedLanguageId, fetchRegions, fetchStages]);

  const fetchLessons = useCallback(async () => {
    try {
      // Usamos el endpoint de adminApi con stageId
      const res = await adminApi.getLessonsByLanguage(
        selectedLanguageId,
        1,
        100,
        selectedStageId,
      );
      if (res.success) {
        setLessons(unwrapApiList(res.data));
      }
    } catch (err) {
      toast.error("Error al cargar lecciones");
    }
  }, [selectedLanguageId, selectedStageId]);

  // Load Lessons when Stage changes
  useEffect(() => {
    if (selectedStageId) {
      void fetchLessons();
    } else {
      setLessons([]);
      setSelectedLessonId("");
    }
  }, [selectedStageId, fetchLessons]);

  const fetchSigns = useCallback(async () => {
    if (!selectedLessonId) return;
    const res = await signRecordApi.getLessonSigns(
      selectedLessonId,
      selectedRegionId,
    );
    if (res.success) {
      const signList = unwrapApiList<Sign>(res.data);
      setSigns(signList);
      const total =
        res.data && typeof res.data === "object" && "total" in res.data
          ? Number((res.data as { total?: number }).total) || signList.length
          : signList.length;
      setTotalSigns(total);
    }
  }, [selectedLessonId, selectedRegionId]);

  // Load Signs when Lesson changes
  useEffect(() => {
    if (selectedLessonId) {
      void fetchSigns();
    } else {
      setSigns([]);
    }
  }, [selectedLessonId, selectedRegionId, fetchSigns]);

  const fetchGlobalSigns = useCallback(async () => {
    try {
      const res = await signRecordApi.getGlobalSigns(selectedRegionId);
      if (res.success) {
        setGlobalSigns(res.data || []);
      }
    } catch (err) {
      console.error("Error fetching global signs:", err);
    }
  }, [selectedRegionId]);

  useEffect(() => {
    void fetchGlobalSigns();
  }, [fetchGlobalSigns]);

  const fetchSignRecordings = useCallback(async () => {
    try {
      const res = await signRecordApi.getSignRecordings(
        selectedSignId,
        selectedRegionId,
      );
      if (res.success) {
        setSignRecordings(res.data || []);
      }
    } catch (err) {
      console.error("Error fetching recordings:", err);
    }
  }, [selectedSignId, selectedRegionId]);

  // Load Recordings when Selected Sign changes
  useEffect(() => {
    if (selectedSignId) {
      void fetchSignRecordings();
    } else {
      setSignRecordings([]);
    }
  }, [selectedSignId, selectedRegionId, fetchSignRecordings]);

  const handleAddSign = async () => {
    if (!newSignName) return;
    if (!isNewSignGlobal && !selectedLessonId) {
      toast.error("Selecciona una lección o marca como seña global");
      return;
    }

    if (!selectedLanguageId) {
      toast.error("Selecciona un idioma");
      return;
    }

    setIsCreatingSigns(true);
    try {
      const res = await signRecordApi.createSign(
        newSignName,
        selectedLanguageId,
        isNewSignGlobal ? undefined : selectedLessonId,
        isNewSignGlobal,
        newSignDetectionType,
      );

      if (res.success) {
        toast.success(isNewSignGlobal ? "Seña global creada" : "Seña creada");
        setNewSignName("");
        setNewSignDetectionType("static");
        setIsNewSignGlobal(false);
        setShowAddModal(false);
        if (isNewSignGlobal) fetchGlobalSigns();
        else fetchSigns();
      } else {
        toast.error(res.message || "Error al crear seña");
      }
    } finally {
      setIsCreatingSigns(false);
    }
  };

  const handleAddSignsBulk = async (drafts: BulkSignDraft[]) => {
    if (!selectedLanguageId) {
      toast.error("Selecciona un idioma");
      return;
    }
    if (!selectedLessonId) {
      toast.error("Selecciona una lección para el catálogo");
      return;
    }

    if (!drafts.length) {
      toast.error("Agrega al menos una seña");
      return;
    }

    setIsCreatingSigns(true);
    try {
      const res = await signRecordApi.createSignsBulk(
        selectedLanguageId,
        selectedLessonId,
        drafts,
      );

      if (res.success) {
        const payload = res.data;
        const createdCount = payload?.created?.length ?? 0;
        const skippedCount = payload?.skipped?.length ?? 0;
        if (createdCount > 0) {
          toast.success(
            skippedCount > 0
              ? `${createdCount} creadas, ${skippedCount} omitidas`
              : `${createdCount} señas creadas`,
          );
        } else if (skippedCount > 0) {
          toast.error(
            `Ninguna nueva: ${skippedCount} ya existían o estaban duplicadas`,
          );
        } else {
          toast.success("Catálogo actualizado");
        }
        setShowAddModal(false);
        fetchSigns();
      } else {
        toast.error(res.message || "Error al crear catálogo");
      }
    } finally {
      setIsCreatingSigns(false);
    }
  };

  const handleDeleteSign = (id: string) => {
    setConfirmConfig({
      title: "¿Eliminar Seña?",
      message: "Esta acción eliminará la seña y TODAS sus grabaciones asociadas de forma permanente.",
      color: "failure",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      onConfirm: async () => {
        const res = await signRecordApi.deleteSign(id);
        if (res.success) {
          toast.success("Seña eliminada");
          if (selectedSignId === id) setSelectedSignId("");
          fetchSigns();
          fetchGlobalSigns();
          setShowConfirmModal(false);
        } else {
          toast.error(res.message || "Error al eliminar seña");
        }
      }
    });
    setShowConfirmModal(true);
  };

  const handleDeleteRecording = (id: string) => {
    setConfirmConfig({
      title: "¿Eliminar Grabación?",
      message: "¿Estás seguro de que deseas eliminar esta muestra del historial? Esta acción no se puede deshacer.",
      color: "failure",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      onConfirm: async () => {
        try {
          const res = await signRecordApi.deleteRecording(id);
          if (res.success) {
            toast.success("Grabación eliminada");
            setShowPlaybackModal(false);
            fetchSignRecordings();
            fetchSigns();
            setShowConfirmModal(false);
          } else {
            toast.error(res.message || "Error al eliminar grabación");
          }
        } catch (error) {
          toast.error("Error al eliminar la grabación");
        }
      }
    });
    setShowConfirmModal(true);
  };

  const handleTriggerTraining = async (mode: TrainingMode) => {
    setIsTraining(true);
    const filters: CustomTrainingFilters = {};

    switch(mode) {
      case 'lesson':
        filters.signIds = signs.map(s => s.id);
        filters.lessonId = selectedLessonId;
        filters.stageId = selectedStageId;
        filters.languageId = selectedLanguageId;
        break;
      case 'stage':
        filters.stageIds = [selectedStageId];
        filters.stageId = selectedStageId;
        filters.languageId = selectedLanguageId;
        break;
      case 'language':
        filters.languageId = selectedLanguageId;
        filters.regionId = selectedRegionId;
        break;
      case 'selection':
        if (selectedTrainingSignIds.length === 0) {
          toast.error("Selecciona al menos una seña");
          setIsTraining(false);
          return;
        }
        filters.signIds = selectedTrainingSignIds;
        filters.languageId = selectedLanguageId;
        break;
    }
    const langName = languages.find(l => l.id === selectedLanguageId)?.name;
    const rgnName = regions.find(r => r.id === selectedRegionId)?.name;
    const stgName = stages.find(s => s.id === selectedStageId)?.name;
    const lsnName = lessons.find(l => l.id === selectedLessonId)?.name;

    filters.modelName = buildTrainingModelName({
      mode,
      langName,
      rgnName,
      stgName,
      lsnName,
      selectedCount: selectedTrainingSignIds.length,
    });

    try {
      const res = await signRecordApi.triggerCustomTraining(filters);
      if (res.success) {
        const jobCount = res.data?.jobs?.length ?? 1;
        toast.success(
          jobCount > 1
            ? `Entrenamiento dual iniciado (${jobCount} modelos)`
            : "Entrenamiento iniciado en segundo plano",
        );
        setSelectedTrainingSignIds([]); // Clear selection to avoid accidental double-triggers
        fetchModels();
      } else {
        toast.error(res.message || "Error al iniciar entrenamiento");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al iniciar entrenamiento");
    } finally {
      setIsTraining(false);
    }
  };

  const handleRenameSign = async (id: string, currentName: string) => {
    const newName = window.prompt("Nuevo nombre para la seña:", currentName);
    if (newName && newName !== currentName) {
      const res = await signRecordApi.updateSign(id, newName);
      if (res.success) {
        toast.success("Seña renombrada");
        fetchSigns();
        fetchGlobalSigns();
      } else {
        toast.error(res.message || "Error al renombrar seña");
      }
    }
  };

  const allSigns = React.useMemo(() => {
    // Usamos Map por ID para evitar duplicados si una global se coló en la lección
    const combined = [...globalSigns, ...signs];
    const uniqueMap = new Map();
    combined.forEach(s => uniqueMap.set(s.id, s));
    return Array.from(uniqueMap.values());
  }, [globalSigns, signs]);

  const filteredAndSortedSigns = React.useMemo(() => {
    return filterAndSortSigns(allSigns, searchTerm, sortKey, sortDirection);
  }, [allSigns, searchTerm, sortKey, sortDirection]);

  const toggleSort = (key: "name" | "createdAt") => {
    if (sortKey === key) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  return {
    languages,
    selectedLanguageId,
    setSelectedLanguageId,
    regions,
    selectedRegionId,
    setSelectedRegionId,
    stages,
    selectedStageId,
    setSelectedStageId,
    lessons,
    selectedLessonId,
    setSelectedLessonId,
    signs,
    globalSigns,
    selectedSignId,
    setSelectedSignId,
    searchTerm,
    setSearchTerm,
    totalSigns,
    signsPerPage,
    signRecordings,
    selectedPlaybackRecording,
    setSelectedPlaybackRecording,
    showPlaybackModal,
    setShowPlaybackModal,
    isTraining,
    selectedTrainingSignIds,
    setSelectedTrainingSignIds,
    models,
    sortKey,
    sortDirection,
    showAddModal,
    setShowAddModal,
    showTesterModal,
    setShowTesterModal,
    showLogsModal,
    setShowLogsModal,
    selectedLogsModel,
    setSelectedLogsModel,
    selectedTesterModel,
    setSelectedTesterModel,
    newSignName,
    setNewSignName,
    newSignDetectionType,
    setNewSignDetectionType,
    isNewSignGlobal,
    setIsNewSignGlobal,
    isCreatingSigns,
    showConfirmModal,
    setShowConfirmModal,
    confirmConfig,
    setConfirmConfig,
    fetchModels,
    fetchSigns,
    fetchGlobalSigns,
    fetchSignRecordings,
    handleAddSign,
    handleAddSignsBulk,
    handleDeleteSign,
    handleDeleteRecording,
    handleTriggerTraining,
    handleRenameSign,
    allSigns,
    filteredAndSortedSigns,
    toggleSort,
  };
}
