import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  TextInput,
  Label,
  Textarea,
  Spinner,
  Alert,
  Toast,
  Pagination,
  Select,
} from "flowbite-react";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiExclamationCircle,
  HiCheck,
  HiX,
  HiTranslate,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { stageApi, adminApi } from "../services/api";

interface Stage {
  id: string;
  name: string;
  description: string;
  languageId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface StageFormData {
  name: string;
  description: string;
}

interface Language {
  id: string;
  name: string;
  description?: string;
}

export default function StageManagement() {
  const navigate = useNavigate();
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

  const [toastMessages, setToastMessages] = useState<
    { id: number; type: "success" | "error"; message: string }[]
  >([]);

  const addToast = useCallback((type: "success" | "error", message: string) => {
    const id = Date.now();
    setToastMessages((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToastMessages((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

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

      setLoading(false);
    },
    [addToast],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);
      const token = localStorage.getItem("auth");
      const selectedLangId = localStorage.getItem("selectedLanguageId");
      if (token && selectedLangId) {
        fetchStages(selectedLangId, newPage, pageSize, orderBy, sortOrder);
      }
    },
    [pageSize, orderBy, sortOrder, fetchStages],
  );

  const handleSortChange = useCallback(
    (newOrderBy: string) => {
      const newSortOrder =
        orderBy === newOrderBy ? (sortOrder === "ASC" ? "DESC" : "ASC") : "ASC";
      const newOrderByValue = orderBy === newOrderBy ? orderBy : newOrderBy;

      setOrderBy(newOrderByValue);
      setSortOrder(newSortOrder);
      setCurrentPage(1);

      const token = localStorage.getItem("auth");
      const selectedLangId = localStorage.getItem("selectedLanguageId");
      if (token && selectedLangId) {
        fetchStages(selectedLangId, 1, pageSize, newOrderByValue, newSortOrder);
      }
    },
    [orderBy, sortOrder, pageSize, fetchStages],
  );

  const fetchLanguageName = useCallback(async (langId: string) => {
    const response = await adminApi.getLanguage(langId);

    if (response.success) {
      const data: { id: string; name: string } = response.data;
      setLanguageName(data?.name || null);
    } else {
      console.error("Error fetching language:", response.message);
      setLanguageName(null);
    }
  }, []);

  const fetchLanguages = useCallback(async () => {
    setLanguagesLoading(true);
    try {
      const response = await adminApi.getLanguages(1, 100);

      if (response.success) {
        const responseData = response.data;
        if (
          responseData &&
          responseData.data &&
          Array.isArray(responseData.data)
        ) {
          setLanguages(responseData.data);
        } else if (Array.isArray(responseData)) {
          setLanguages(responseData);
        } else {
          setLanguages([]);
        }
      } else {
        console.error("Error fetching languages:", response.message);
        addToast("error", "Error al cargar la lista de idiomas");
        setLanguages([]);
      }
    } catch (error) {
      console.error("Error fetching languages:", error);
      addToast("error", "Error al cargar la lista de idiomas");
      setLanguages([]);
    } finally {
      setLanguagesLoading(false);
    }
  }, [addToast]);

  const handleLanguageChange = useCallback(
    async (newLanguageId: string) => {
      if (newLanguageId === languageId) return;

      setLanguageId(newLanguageId);
      localStorage.setItem("selectedLanguageId", newLanguageId);

      await fetchLanguageName(newLanguageId);

      setCurrentPage(1);
      await fetchStages(newLanguageId, 1, pageSize, orderBy, sortOrder);

      addToast("success", "Idioma cambiado correctamente");
    },
    [
      languageId,
      fetchLanguageName,
      fetchStages,
      pageSize,
      orderBy,
      sortOrder,
      addToast,
    ],
  );

  useEffect(() => {
    const token = localStorage.getItem("auth");
    const selectedLangId = localStorage.getItem("selectedLanguageId");

    if (!token || token === "undefined") {
      setError("No estás autenticado. Redirigiendo al login...");
      addToast("error", "No estás autenticado. Redirigiendo al login...");
      setLoading(false);
      setTimeout(() => navigate("/login"), 3000);
      return;
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!selectedLangId || !uuidRegex.test(selectedLangId)) {
      setError(
        "No se ha seleccionado un idioma válido. Por favor, vuelve a la gestión de idiomas y selecciona uno.",
      );
      addToast("error", "ID de idioma no válido.");
      setLoading(false);
      setStages([]);
      return;
    }

    setLanguageId(selectedLangId);
    fetchStages(selectedLangId, currentPage, pageSize, orderBy, sortOrder);
    fetchLanguageName(selectedLangId);
    fetchLanguages();
  }, [navigate, fetchStages, addToast, fetchLanguageName, fetchLanguages]);

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
    const token = localStorage.getItem("auth");

    if (!token || token === "undefined") {
      addToast("error", "Autenticación requerida.");
      setIsDeleting(false);
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

    setIsDeleting(false);
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
    const token = localStorage.getItem("auth");

    if (!token || token === "undefined") {
      addToast("error", "Autenticación requerida.");
      setIsSubmitting(false);
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
      addToast("success", "Etapa creada correctamente.");
      closeAddModal();
    } else {
      addToast("error", `Error al crear etapa: ${response.message}`);
    }

    setIsSubmitting(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStage || !languageId || !formData.name) {
      addToast("error", "Datos incompletos para editar la etapa.");
      return;
    }
    setIsSubmitting(true);
    const token = localStorage.getItem("auth");

    if (!token || token === "undefined") {
      addToast("error", "Autenticación requerida.");
      setIsSubmitting(false);
      return;
    }

    console.log("Edit stage data:", {
      currentStage,
      currentStageId: currentStage.id,
      formData,
      languageId,
    });

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

    setIsSubmitting(false);
  };

  return (
    <>
      <div className="fixed right-5 top-5 z-50 flex flex-col gap-3">
        {toastMessages.map((toast) => (
          <Toast key={toast.id}>
            <div
              className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${
                toast.type === "success"
                  ? "bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200"
                  : "bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200"
              }`}
            >
              {toast.type === "success" ? (
                <HiCheck className="size-5" />
              ) : (
                <HiX className="size-5" />
              )}
            </div>
            <div className="ml-3 text-sm font-normal">{toast.message}</div>
            <Toast.Toggle
              onDismiss={() =>
                setToastMessages((prev) =>
                  prev.filter((t) => t.id !== toast.id),
                )
              }
            />
          </Toast>
        ))}
      </div>

      <div className="mx-auto w-full max-w-4xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
              Gestionar Etapas del {languageName}
            </h1>
            {totalStages > 0 && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Total de etapas: {totalStages}
              </p>
            )}
          </div>
          <Button onClick={openAddModal} color="blue">
            <HiPlus className="mr-2 size-5" />
            Añadir Etapa
          </Button>
        </div>

        {/* Selector de idiomas */}
        <div className="mb-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <HiTranslate className="size-5 text-gray-600 dark:text-gray-400" />
              <Label
                htmlFor="language-select"
                value="Seleccionar idioma:"
                className="text-sm font-medium"
              />
            </div>
            <div className="max-w-xs flex-1">
              <Select
                id="language-select"
                value={languageId || ""}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={languagesLoading}
              >
                <option value="" disabled>
                  {languagesLoading
                    ? "Cargando idiomas..."
                    : "Selecciona un idioma"}
                </option>
                {languages.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.name}
                  </option>
                ))}
              </Select>
            </div>
            {languagesLoading && (
              <Spinner size="sm" aria-label="Cargando idiomas..." />
            )}
          </div>
        </div>

        {loading && (
          <div className="py-10 text-center">
            <Spinner size="xl" aria-label="Cargando etapas..." />
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Cargando etapas...
            </p>
          </div>
        )}

        {error && !loading && (
          <Alert color="failure" icon={HiExclamationCircle} className="mb-4">
            <span className="font-medium">Error!</span> {error}
          </Alert>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => handleSortChange("name")}
                >
                  <div className="flex items-center gap-2">
                    Nombre
                    {orderBy === "name" && (
                      <span className="text-blue-600">
                        {sortOrder === "ASC" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </Table.HeadCell>
                <Table.HeadCell
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => handleSortChange("description")}
                >
                  <div className="flex items-center gap-2">
                    Descripción
                    {orderBy === "description" && (
                      <span className="text-blue-600">
                        {sortOrder === "ASC" ? "↑" : "↓"}
                      </span>
                    )}
                  </div>
                </Table.HeadCell>
                <Table.HeadCell>
                  <span className="sr-only">Acciones</span>
                </Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {stages.length > 0 ? (
                  stages.map((stage) => (
                    <Table.Row
                      key={stage.id}
                      className="bg-white dark:border-gray-700 dark:bg-gray-800"
                    >
                      <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                        {stage.name}
                      </Table.Cell>
                      <Table.Cell>{stage.description}</Table.Cell>
                      <Table.Cell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            color="light"
                            onClick={() => openEditModal(stage)}
                          >
                            <div className="flex items-center">
                              <HiPencil className="mr-1 size-4" />
                              Editar
                            </div>
                          </Button>
                          <Button
                            size="sm"
                            color="failure"
                            onClick={() => openDeleteModal(stage)}
                          >
                            <div className="flex items-center">
                              <HiTrash className="mr-1 size-4" />
                              Eliminar
                            </div>
                          </Button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                ) : (
                  <Table.Row>
                    <Table.Cell
                      colSpan={3}
                      className="text-center text-gray-500 dark:text-gray-400"
                    >
                      No se encontraron etapas para este idioma.
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>

            {totalStages > pageSize && (
              <div className="mt-4 space-y-4">
                <div className="flex overflow-x-auto sm:justify-center">
                  <Pagination
                    layout="pagination"
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalStages / pageSize)}
                    onPageChange={handlePageChange}
                    previousLabel="Anterior"
                    nextLabel="Siguiente"
                    showIcons
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal show={showDeleteModal} onClose={closeDeleteModal} popup size="md">
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <HiExclamationCircle className="mx-auto mb-4 size-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que quieres eliminar la etapa{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                "{currentStage?.name}"
              </span>
              ?
            </h3>
            <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              etapa y todos sus datos asociados.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                color="gray"
                onClick={closeDeleteModal}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                color="failure"
                onClick={handleDeleteStage}
                isProcessing={isDeleting}
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Sí, eliminar"}
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      <Modal show={showAddModal} onClose={closeAddModal} popup size="md">
        <Modal.Header />
        <Modal.Body>
          <form onSubmit={handleAddSubmit} className="space-y-6">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Añadir Nueva Etapa
            </h3>
            <div>
              <Label htmlFor="name" value="Nombre de la Etapa" />
              <TextInput
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ej: Nivel Básico 1"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="description" value="Descripción" />
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe brevemente el contenido o nivel de la etapa"
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                color="gray"
                onClick={closeAddModal}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                color="blue"
                isProcessing={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creando..." : "Crear Etapa"}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>

      <Modal show={showEditModal} onClose={closeEditModal} popup size="md">
        <Modal.Header />
        <Modal.Body>
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Editar Etapa
            </h3>
            <div>
              <Label htmlFor="edit-name" value="Nombre de la Etapa" />
              <TextInput
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-description" value="Descripción" />
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                color="gray"
                onClick={closeEditModal}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                color="success"
                isProcessing={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </>
  );
}
