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
} from "flowbite-react";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiExclamationCircle,
  HiCheck,
  HiX,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { BACKEND_BASE_URL } from "../config";

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

export default function StageManagement() {
  const navigate = useNavigate();
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [languageId, setLanguageId] = useState<string | null>(null);
  const [languageName, setLanguageName] = useState<string | null>(null);

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
      token: string,
      page: number,
      size: number,
      order: string,
      sort: "ASC" | "DESC",
    ) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: size.toString(),
          orderBy: order,
          sortOrder: sort,
        });

        const response = await fetch(
          `${BACKEND_BASE_URL}/stage/${langId}?${params}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          let errorMsg = `Error ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (jsonError) {
            console.warn(
              "Could not parse error response as JSON during fetch:",
              jsonError,
            );
          }
          throw new Error(errorMsg);
        }

        const responseData = await response.json();
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
      } catch (err: any) {
        console.error("Error fetching stages:", err);
        const displayError =
          err.message || "Ocurrió un error al cargar las etapas.";
        setError(displayError);
        addToast("error", displayError);
        setStages([]);
      } finally {
        setLoading(false);
      }
    },
    [addToast],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);
      const token = localStorage.getItem("auth");
      const selectedLangId = localStorage.getItem("selectedLanguageId");
      if (token && selectedLangId) {
        fetchStages(
          selectedLangId,
          token,
          newPage,
          pageSize,
          orderBy,
          sortOrder,
        );
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
        fetchStages(
          selectedLangId,
          token,
          1,
          pageSize,
          newOrderByValue,
          newSortOrder,
        );
      }
    },
    [orderBy, sortOrder, pageSize, fetchStages],
  );

  const fetchLanguageName = useCallback(
    async (langId: string, token: string) => {
      try {
        const response = await fetch(
          `${BACKEND_BASE_URL}/languages/${langId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          let errorMsg = `Error ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (jsonError) {
            console.warn(
              "Could not parse error response as JSON during fetch language:",
              jsonError,
            );
          }
          throw new Error(errorMsg);
        }

        const data: { id: string; name: string } = await response.json();
        setLanguageName(data?.name || null);
      } catch (err: any) {
        console.error("Error fetching language:", err);
        setLanguageName(null);
      }
    },
    [],
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

    if (!selectedLangId) {
      setError(
        "No se ha seleccionado un idioma. Por favor, selecciona uno primero.",
      );
      addToast("error", "No se ha seleccionado un idioma.");
      setLoading(false);
      return;
    }

    setLanguageId(selectedLangId);
    fetchStages(
      selectedLangId,
      token,
      currentPage,
      pageSize,
      orderBy,
      sortOrder,
    );
    fetchLanguageName(selectedLangId, token);
  }, [navigate, fetchStages, addToast, fetchLanguageName]);

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

    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/stage/${currentStage.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (jsonError) {
          console.warn(
            "Could not parse error response as JSON during delete:",
            jsonError,
          );
        }
        throw new Error(errorMsg);
      }

      addToast("success", "Etapa eliminada correctamente.");
      closeDeleteModal();

      if (languageId) {
        await fetchStages(
          languageId,
          token,
          currentPage,
          pageSize,
          orderBy,
          sortOrder,
        );
      }
    } catch (err: any) {
      console.error("Error deleting stage:", err);
      addToast("error", `Error al eliminar etapa: ${err.message}`);
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
    const token = localStorage.getItem("auth");

    if (!token || token === "undefined") {
      addToast("error", "Autenticación requerida.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_BASE_URL}/stage`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          languageId: languageId,
        }),
      });

      if (!response.ok) {
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (jsonError) {
          console.warn(
            "Could not parse error response as JSON during add:",
            jsonError,
          );
        }
        throw new Error(errorMsg);
      }

      const text = await response.text();
      const newStage: Stage = text
        ? JSON.parse(text)
        : {
            ...formData,
            languageId,
          };

      setStages((prev) => [...prev, newStage]);
      setStages((prev) => [...prev, newStage]);
      addToast("success", "Etapa creada correctamente.");
      closeAddModal();
    } catch (err: any) {
      console.error("Error adding stage:", err);
      addToast("error", `Error al crear etapa: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
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

    try {
      const response = await fetch(
        `${BACKEND_BASE_URL}/stage/${currentStage.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            languageId: languageId,
          }),
        },
      );

      if (!response.ok) {
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (jsonError) {
          console.warn(
            "Could not parse error response as JSON during edit:",
            jsonError,
          );
        }
        throw new Error(errorMsg);
      }

      const rawText = await response.text();
      const updatedStageData = rawText ? JSON.parse(rawText) : {};
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
    } catch (err: any) {
      console.error("Error editing stage:", err);
      addToast("error", `Error al editar etapa: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
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
                            <HiPencil className="mr-1 size-4" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            color="failure"
                            onClick={() => openDeleteModal(stage)}
                          >
                            <HiTrash className="mr-1 size-4" />
                            Eliminar
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

            {/* Controles de paginación */}
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
