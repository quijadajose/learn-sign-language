import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions";
import { useLocalStorage } from "../hooks/useLocalStorage";
import {
  Button,
  Select,
  Spinner,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  TextInput,
  Textarea,
  Toast,
  ToastToggle,
  Badge,
  Table,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
  Label,
} from "flowbite-react";
import {
  HiEye,
  HiExclamationCircle,
  HiPencilAlt,
  HiCheck,
  HiX,
  HiTrash,
  HiPlus,
  HiAcademicCap,
  HiGlobe,
} from "react-icons/hi";
import QuillEditor from "../components/QuillEditor";
import "../styles/quill-flowbite.css";
import { adminApi, regionApi, lessonVariantApi } from "../services/api";

interface Language {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface Region {
  id: string;
  name: string;
  code: string;
  description: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LessonVariant {
  id: string;
  name: string;
  description: string;
  content: string;
  isRegionalSpecific: boolean;
  isBase: boolean;
  regionalNotes?: string;
  region: Region;
  baseLesson: Lesson;
  createdAt: string;
  updatedAt: string;
}

interface Lesson {
  id: string;
  name: string;
  description: string;
  languageId: string;
  languageName: string;
  difficulty: string;
  estimatedDuration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LessonDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  content: string;
  stage?: StageItem;
}

interface StageItem {
  id: string;
  name: string;
  description: string;
}

type ToastMessage = { id: number; type: "success" | "error"; message: string };

interface LanguagesResponse {
  data: Language[];
  total: number;
  page: number;
  pageSize: number;
}

interface LessonsResponse {
  data: Lesson[];
  total: number;
  page: number;
  pageSize: number;
}

export default function LessonManagement() {
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

  const addToast = (type: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((prev: ToastMessage[]) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev: ToastMessage[]) =>
        prev.filter((t: ToastMessage) => t.id !== id),
      );
    }, 3500);
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [stagesLoading, setStagesLoading] = useState(false);
  const [stages, setStages] = useState<StageItem[]>([]);
  const [editLessonId, setEditLessonId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    content: "",
    languageId: "",
    stageId: "",
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
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
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [lessonVariants, setLessonVariants] = useState<LessonVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [isCreateVariantModalOpen, setIsCreateVariantModalOpen] =
    useState(false);
  const [variantForm, setVariantForm] = useState({
    name: "",
    description: "",
    content: "",
    regionId: "",
    isRegionalSpecific: false,
    isBase: false,
    regionalNotes: "",
  });
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);

  const fetchLanguages = async () => {
    setLoading(true);
    setError(null);

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
      setLoading(false);
      return moderatorLanguages;
    }

    const response = await adminApi.getLanguages();

    if (response.success) {
      const data: LanguagesResponse = response.data;
      setLanguages(data.data);
      setLoading(false);
      return data.data;
    } else {
      setError(response.message || "Error al cargar idiomas");
      setLoading(false);
      return [];
    }
  };

  const fetchRegions = async (languageId?: string) => {
    try {
      // If no language is selected, we might want to clear regions or fetch all (but fetching all causes the issue)
      // For now, let's only fetch if languageId is present, or fetch all if not (but user wants filtering).
      // Actually, simply passing languageId to getRegions is enough.
      const response = await regionApi.getRegions(1, 100, languageId);
      if (response.success) {
        setRegions(response.data.data || []);
      } else {
        addToast("error", response.message || "Error al cargar las regiones");
      }
    } catch (err) {
      addToast("error", "Error de conexión al cargar las regiones");
    }
  };

  const fetchLessonsByLanguage = async (
    languageId: string,
    page: number = 1,
    stageId?: string,
  ) => {
    if (!languageId) return;

    setLessonsLoading(true);
    setError(null);

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

    setLessonsLoading(false);
  };

  const fetchLessonDetail = async (lessonId: string) => {
    setViewLoading(true);
    setError(null);

    const response = await adminApi.getLesson(lessonId);

    if (response.success) {
      const lessonDetail: LessonDetail = response.data;
      setSelectedLesson(lessonDetail);
      setIsViewModalOpen(true);
    } else {
      setError(response.message || "Error al cargar detalles de la lección");
    }

    setViewLoading(false);
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

  const fetchFilterStages = async (languageId: string) => {
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
  };

  const handleOpenEditModal = (lesson: Lesson) => {
    setIsEditModalOpen(true);
    setEditLessonId(lesson.id);
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
    setEditLessonId(null);
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

    setIsDeleting(false);
  };

  const handleSubmitEdit = async () => {
    if (!editLessonId) return;
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
      const response = await adminApi.updateLesson(editLessonId, {
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

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      // Si no hay idioma seleccionado o es inválido, y tenemos idiomas disponibles, seleccionamos el primero
      if (
        (!langId || !uuidRegex.test(langId)) &&
        fetchedLangs &&
        fetchedLangs.length > 0
      ) {
        langId = fetchedLangs[0].id;
        setSelectedLanguageId(langId);
      }

      if (langId && uuidRegex.test(langId)) {
        setSelectedLanguageId(langId);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    if (selectedLanguageId) {
      fetchLessonsByLanguage(selectedLanguageId, 1, filterStageId);
      fetchRegions(selectedLanguageId);
      fetchFilterStages(selectedLanguageId);
    } else {
      setLessons([]);
      setFilterStages([]);
      setFilterStageId("");
      setRegions([]);
      setTotalPages(1);
      setCurrentPage(1);
      setTotalLessons(0);
    }
  }, [selectedLanguageId]);

  const handleLanguageChange = (languageId: string) => {
    setSelectedLanguageId(languageId);
    setFilterStageId(""); // Reset stage when language changes
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
      stageId: "",
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
      !selectedLessonId ||
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
      const response = editingVariantId
        ? await lessonVariantApi.updateLessonVariant(
            selectedLessonId,
            editingVariantId,
            variantForm,
          )
        : await lessonVariantApi.createLessonVariant(
            selectedLessonId,
            variantForm,
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
        loadLessonVariants(selectedLessonId);
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
    if (!selectedLessonId) return;

    try {
      const response = await lessonVariantApi.deleteLessonVariant(
        selectedLessonId,
        variantId,
      );

      if (response.success) {
        addToast("success", "Variante eliminada exitosamente");
        loadLessonVariants(selectedLessonId);
      } else {
        addToast("error", response.message || "Error al eliminar la variante");
      }
    } catch (err) {
      addToast("error", "Error de conexión al eliminar la variante");
    }
  };

  const openVariantsModal = (lessonId: string) => {
    setSelectedLessonId(lessonId);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const quillModules = {
    toolbar: false,
  };
  const quillEditModules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        ["blockquote", "code-block"],
        ["link", "image", "video"],
        [{ align: [] }],
        ["clean"],
      ],
    },
  };

  const quillFormats = [
    "header",
    "font",
    "size",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "list",
    "bullet",
    "indent",
    "link",
    "image",
  ];

  if (loading) {
    return (
      <div className="py-10 text-center">
        <Spinner size="xl" aria-label="Cargando idiomas..." />
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Cargando idiomas...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto w-full max-w-6xl p-2">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
              Gestión de Lecciones
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Administra las lecciones por idioma
            </p>
          </div>
        </div>

        {error && (
          <Alert color="failure" icon={HiExclamationCircle} className="mb-4">
            <span className="font-medium">Error!</span> {error}
          </Alert>
        )}

        <div className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Selección de Idioma y Etapa
            </h2>
          </div>

          <div className="p-2">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="language-select"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Seleccionar Idioma
                </label>
                <Select
                  id="language-select"
                  value={selectedLanguageId}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  disabled={loading}
                >
                  <option value="">Selecciona un idioma</option>
                  {languages.map((language) => (
                    <option key={language.id} value={language.id}>
                      {language.name}
                    </option>
                  ))}
                </Select>
              </div>

              {selectedLanguageId && (
                <div>
                  <label
                    htmlFor="stage-select"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Filtrar por Etapa
                  </label>
                  <Select
                    id="stage-select"
                    value={filterStageId}
                    onChange={(e) => handleStageChange(e.target.value)}
                    disabled={filterStagesLoading}
                  >
                    <option value="">Todas las etapas</option>
                    {filterStages.map((stage) => (
                      <option key={stage.id} value={stage.id}>
                        {stage.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedLanguageId && (
          <div className="mt-6 overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800">
            <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Lista de Lecciones
                </h2>
                {selectedLanguageId &&
                  hasAnyPermissionForLanguage(selectedLanguageId) && (
                    <Button color="blue" onClick={handleOpenCreateModal}>
                      <HiPlus className="mr-2 size-5" />
                      Agregar lección
                    </Button>
                  )}
              </div>
            </div>

            {lessonsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Spinner size="lg" />
                <span className="ml-3 text-gray-600 dark:text-gray-400">
                  Cargando lecciones...
                </span>
              </div>
            ) : lessons.length === 0 ? (
              <div className="py-8 text-center">
                <span className="text-lg text-gray-500 dark:text-gray-400">
                  No se encontraron lecciones para este idioma
                </span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                        Nombre
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                        Descripción
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                        Fecha Creación
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                    {lessons.map((lesson) => (
                      <tr
                        key={lesson.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {lesson.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs text-sm text-gray-500 dark:text-gray-400">
                            <div
                              className="truncate"
                              title={lesson.description}
                            >
                              {lesson.description}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(lesson.createdAt)}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              color="light"
                              onClick={() => handleViewClick(lesson.id)}
                              disabled={viewLoading}
                            >
                              <div className="flex items-center">
                                <HiEye className="mr-1 size-4" />
                                Ver
                              </div>
                            </Button>
                            {hasAnyPermissionForLanguage(
                              lesson.languageId || selectedLanguageId,
                            ) && (
                              <>
                                {hasLanguagePermission(
                                  lesson.languageId || selectedLanguageId,
                                ) && (
                                  <Button
                                    size="sm"
                                    color="info"
                                    onClick={() => handleOpenEditModal(lesson)}
                                    disabled={editLoading}
                                  >
                                    <div className="flex items-center">
                                      <HiPencilAlt className="mr-1 size-4" />
                                      Editar
                                    </div>
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  color="info"
                                  onClick={() => openVariantsModal(lesson.id)}
                                >
                                  <div className="flex items-center">
                                    <HiGlobe className="mr-1 size-4" />
                                    Variantes
                                  </div>
                                </Button>
                                <Button
                                  size="sm"
                                  color="purple"
                                  onClick={() =>
                                    navigate(
                                      `/admin/lessons/${lesson.id}/quizzes`,
                                    )
                                  }
                                >
                                  <div className="flex items-center">
                                    <HiAcademicCap className="mr-1 size-4" />
                                    Quiz
                                  </div>
                                </Button>
                                {hasLanguagePermission(
                                  lesson.languageId || selectedLanguageId,
                                ) && (
                                  <Button
                                    size="sm"
                                    color="failure"
                                    onClick={() =>
                                      handleOpenDeleteModal(lesson)
                                    }
                                    disabled={isDeleting}
                                  >
                                    <div className="flex items-center">
                                      <HiTrash className="mr-1 size-4" />
                                      Eliminar
                                    </div>
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {selectedLanguageId && totalPages > 1 && (
                  <div className="flex items-center justify-between p-2">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Mostrando {lessons.length} de {totalLessons} lecciones
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        color="light"
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        Anterior
                      </Button>
                      <span className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                        Página {currentPage} de {totalPages}
                      </span>
                      <Button
                        size="sm"
                        color="light"
                        disabled={currentPage === totalPages}
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        show={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        size="5xl"
      >
        <ModalHeader>
          <div className="flex w-full items-center justify-between">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Agregar Lección
            </h3>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre
              </label>
              <TextInput
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Nombre de la lección"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Descripción
              </label>
              <Textarea
                rows={3}
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Descripción de la lección"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contenido
              </label>
              <QuillEditor
                value={createForm.content}
                onChange={(value) =>
                  setCreateForm((p) => ({ ...p, content: value }))
                }
                modules={quillEditModules}
                formats={quillFormats}
                theme="snow"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Idioma
                </label>
                <Select
                  value={createForm.languageId}
                  onChange={(e) => {
                    const newLang = e.target.value;
                    setCreateForm((p) => ({
                      ...p,
                      languageId: newLang,
                      stageId: "",
                    }));
                    fetchStages(newLang);
                  }}
                >
                  <option value="">Selecciona un idioma</option>
                  {languages.map((language) => (
                    <option key={language.id} value={language.id}>
                      {language.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Etapa
                </label>
                <Select
                  value={createForm.stageId}
                  onChange={(e) =>
                    setCreateForm((p) => ({ ...p, stageId: e.target.value }))
                  }
                  disabled={!createForm.languageId || stagesLoading}
                >
                  <option value="">Selecciona una etapa</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex w-full justify-end gap-2">
            <Button
              color="light"
              onClick={handleCloseCreateModal}
              disabled={createLoading}
            >
              Cancelar
            </Button>
            <Button
              color="success"
              onClick={handleSubmitCreate}
              disabled={createLoading}
            >
              {createLoading && <Spinner size="sm" className="mr-2" />}
              Crear Lección
            </Button>
          </div>
        </ModalFooter>
      </Modal>

      <Modal show={isViewModalOpen} onClose={handleCloseViewModal} size="4xl">
        <ModalHeader>
          <div className="flex w-full items-center justify-between">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Detalles de la Lección
            </h3>
          </div>
        </ModalHeader>
        <ModalBody>
          {viewLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner size="lg" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Cargando detalles...
              </span>
            </div>
          ) : selectedLesson ? (
            <div className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre
                </label>
                <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
                  {selectedLesson.name}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Descripción
                </label>
                <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
                  {selectedLesson.description}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Contenido
                </label>
                <QuillEditor
                  value={selectedLesson.content}
                  readOnly={true}
                  modules={quillModules}
                  formats={quillFormats}
                  theme="snow"
                />
              </div>

              {selectedLesson.stage && (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Etapa
                    </label>
                    <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
                      {selectedLesson.stage.name}
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Descripción de la etapa
                    </label>
                    <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
                      {selectedLesson.stage.description}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Fecha de Creación
                  </label>
                  <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
                    {formatDate(selectedLesson.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Última Actualización
                  </label>
                  <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
                    {formatDate(selectedLesson.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <span className="text-gray-500 dark:text-gray-400">
                No se pudieron cargar los detalles de la lección
              </span>
            </div>
          )}
        </ModalBody>
      </Modal>

      <Modal show={isEditModalOpen} onClose={handleCloseEditModal} size="5xl">
        <ModalHeader>
          <div className="flex w-full items-center justify-between">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Editar Lección
            </h3>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nombre
              </label>
              <TextInput
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Nombre de la lección"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Descripción
              </label>
              <Textarea
                rows={3}
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Descripción de la lección"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contenido
              </label>
              <div className="quill-flowbite rounded-md bg-gray-50 dark:bg-gray-700">
                <QuillEditor
                  value={editForm.content}
                  onChange={(changes: any) =>
                    setEditForm((p) => ({ ...p, content: changes.html }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Idioma
                </label>
                <Select
                  value={editForm.languageId}
                  onChange={(e) => {
                    const newLang = e.target.value;
                    setEditForm((p) => ({
                      ...p,
                      languageId: newLang,
                      stageId: "",
                    }));
                    fetchStages(newLang);
                  }}
                >
                  <option value="">Selecciona un idioma</option>
                  {languages.map((language) => (
                    <option key={language.id} value={language.id}>
                      {language.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Etapa
                </label>
                <Select
                  value={editForm.stageId}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, stageId: e.target.value }))
                  }
                  disabled={!editForm.languageId || stagesLoading}
                >
                  <option value="">Selecciona una etapa</option>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex w-full justify-end gap-2">
            <Button
              color="light"
              onClick={handleCloseEditModal}
              disabled={editLoading}
            >
              Cancelar
            </Button>
            <Button
              color="success"
              onClick={handleSubmitEdit}
              disabled={editLoading}
            >
              {editLoading && <Spinner size="sm" className="mr-2" />}
              Guardar Cambios
            </Button>
          </div>
        </ModalFooter>
      </Modal>

      <Modal
        show={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        popup
        size="md"
      >
        <ModalHeader />
        <ModalBody>
          <div className="text-center">
            <HiExclamationCircle className="mx-auto mb-4 size-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Estás seguro de que quieres eliminar la lección{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                "{deletingLesson?.name}"
              </span>
              ?
            </h3>
            <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              lección y sus datos asociados.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                color="gray"
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                color="failure"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting && <Spinner size="sm" className="mr-2" />}
                {isDeleting ? "Eliminando..." : "Sí, eliminar"}
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>

      <Modal
        show={isVariantModalOpen}
        size="6xl"
        onClose={() => setIsVariantModalOpen(false)}
      >
        <ModalHeader>Variantes Regionales</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Variantes de la Lección
              </h3>
              <Button
                onClick={openCreateVariantModal}
                className="bg-green-600 hover:bg-green-700"
              >
                <HiPlus className="mr-2 h-4 w-4" />
                Nueva Variante
              </Button>
            </div>

            {variantsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Spinner size="lg" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableHeadCell>Nombre</TableHeadCell>
                    <TableHeadCell>Región</TableHeadCell>
                    <TableHeadCell>Tipo</TableHeadCell>
                    <TableHeadCell>Notas Regionales</TableHeadCell>
                    <TableHeadCell>Acciones</TableHeadCell>
                  </TableHead>
                  <TableBody className="divide-y">
                    {lessonVariants.map((variant) => (
                      <TableRow
                        key={variant.id}
                        className="bg-white dark:border-gray-700 dark:bg-gray-800"
                      >
                        <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                          {variant.name}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-white">
                          {variant.region.name} ({variant.region.code})
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {variant.isBase && (
                              <Badge color="green">Base</Badge>
                            )}
                            {variant.isRegionalSpecific && (
                              <Badge color="blue">Específica</Badge>
                            )}
                            {!variant.isBase && !variant.isRegionalSpecific && (
                              <Badge color="gray">Regional</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-white">
                          {variant.regionalNotes || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {(hasLanguagePermission(selectedLanguageId) ||
                              hasRegionPermission(variant.region.id)) && (
                              <>
                                <Button
                                  size="sm"
                                  color="info"
                                  onClick={() =>
                                    handleOpenVariantEditModal(variant)
                                  }
                                >
                                  <HiPencilAlt className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  color="failure"
                                  onClick={() =>
                                    handleDeleteVariant(variant.id)
                                  }
                                >
                                  <HiTrash className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="gray" onClick={() => setIsVariantModalOpen(false)}>
            Cerrar
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        show={isCreateVariantModalOpen}
        size="4xl"
        onClose={() => {
          setIsCreateVariantModalOpen(false);
          setEditingVariantId(null);
        }}
      >
        <ModalHeader>
          {editingVariantId
            ? "Editar Variante Regional"
            : "Crear Variante Regional"}
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <Label htmlFor="variant-name">Nombre</Label>
              <TextInput
                id="variant-name"
                value={variantForm.name}
                onChange={(e) =>
                  setVariantForm({ ...variantForm, name: e.target.value })
                }
                placeholder="Nombre de la variante regional"
                required
              />
            </div>
            <div>
              <Label htmlFor="variant-description">Descripción</Label>
              <Textarea
                id="variant-description"
                value={variantForm.description}
                onChange={(e) =>
                  setVariantForm({
                    ...variantForm,
                    description: e.target.value,
                  })
                }
                placeholder="Descripción de la variante"
                rows={3}
                required
              />
            </div>
            <div>
              <Label htmlFor="variant-region">Región</Label>
              <Select
                id="variant-region"
                value={variantForm.regionId}
                onChange={(e) =>
                  setVariantForm({ ...variantForm, regionId: e.target.value })
                }
                required
              >
                <option value="">Selecciona una región</option>
                {regions
                  .filter(
                    (region) =>
                      (hasLanguagePermission(selectedLanguageId) ||
                        hasRegionPermission(region.id)) &&
                      (!lessonVariants.some((v) => v.region.id === region.id) ||
                        (editingVariantId &&
                          lessonVariants.find((v) => v.id === editingVariantId)
                            ?.region.id === region.id)),
                  )
                  .map((region) => (
                    <option key={region.id} value={region.id}>
                      {region.name} ({region.code})
                    </option>
                  ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="variant-content">Contenido</Label>
              <div className="mt-1">
                <QuillEditor
                  value={variantForm.content}
                  onChange={(value) =>
                    setVariantForm({ ...variantForm, content: value })
                  }
                  theme="snow"
                  className="h-48"
                />
              </div>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="variant-specific"
                checked={variantForm.isRegionalSpecific}
                onChange={(e) =>
                  setVariantForm({
                    ...variantForm,
                    isRegionalSpecific: e.target.checked,
                  })
                }
                className="mr-2"
              />
              <Label htmlFor="variant-specific">Específica de la región</Label>
            </div>
            {lessonVariants.some((v) => v.isBase) ? (
              <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                <span className="font-medium">Nota:</span> Ya existe una
                variante base para esta lección. solo puede haber una.
              </div>
            ) : (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="variant-base"
                  checked={variantForm.isBase}
                  onChange={(e) =>
                    setVariantForm({ ...variantForm, isBase: e.target.checked })
                  }
                  className="mr-2"
                />
                <Label htmlFor="variant-base">
                  Variante base (solo puede haber una por lección)
                </Label>
              </div>
            )}
            <div>
              <Label htmlFor="variant-notes">Notas Regionales</Label>
              <Textarea
                id="variant-notes"
                value={variantForm.regionalNotes}
                onChange={(e) =>
                  setVariantForm({
                    ...variantForm,
                    regionalNotes: e.target.value,
                  })
                }
                placeholder="Notas sobre las diferencias regionales..."
                rows={2}
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            onClick={handleCreateVariant}
            disabled={createLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {createLoading ? <Spinner size="sm" className="mr-2" /> : null}
            {editingVariantId ? "Actualizar Variante" : "Crear Variante"}
          </Button>
          <Button
            color="gray"
            onClick={() => setIsCreateVariantModalOpen(false)}
          >
            Cancelar
          </Button>
        </ModalFooter>
      </Modal>

      <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map((t: ToastMessage) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast>
              <div
                className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${
                  t.type === "success"
                    ? "bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200"
                    : "bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200"
                }`}
              >
                {t.type === "success" ? (
                  <HiCheck className="size-5" />
                ) : (
                  <HiX className="size-5" />
                )}
              </div>
              <div className="ml-3 text-sm font-normal">{t.message}</div>
              <ToastToggle
                onClick={() =>
                  setToasts((prev: ToastMessage[]) =>
                    prev.filter((x: ToastMessage) => x.id !== t.id),
                  )
                }
              />
            </Toast>
          </div>
        ))}
      </div>
    </>
  );
}
