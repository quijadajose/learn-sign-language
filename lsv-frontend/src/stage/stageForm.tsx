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
} from "flowbite-react";
import { HiPlus, HiPencil, HiExclamationCircle, HiCheck, HiX } from "react-icons/hi";
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

  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [currentStage, setCurrentStage] = useState<Stage | null>(null);
  const [formData, setFormData] = useState<StageFormData>({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  const fetchStages = useCallback(async (langId: string, token: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/stage/${langId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorMsg;
        } catch (jsonError) {
          console.warn("Could not parse error response as JSON during fetch:", jsonError);
        }
        throw new Error(errorMsg);
      }

      const data: Stage[] = await response.json();
      setStages(data);

    } catch (err: any) {
      console.error("Error fetching stages:", err);
      const displayError = err.message || "Ocurrió un error al cargar las etapas.";
      setError(displayError);
      addToast("error", displayError);
      setStages([]);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

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
      setError("No se ha seleccionado un idioma. Por favor, selecciona uno primero.");
      addToast("error", "No se ha seleccionado un idioma.");
      setLoading(false);
      return;
    }

    setLanguageId(selectedLangId);
    fetchStages(selectedLangId, token);

  }, [navigate, fetchStages, addToast]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
          console.warn("Could not parse error response as JSON during add:", jsonError);
        }
        throw new Error(errorMsg);
      }



      const text = await response.text();
      const newStage: Stage = text ? JSON.parse(text) : {
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
      const response = await fetch(`${BACKEND_BASE_URL}/stage/${currentStage.id}`, {
        method: "PUT",
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
          console.warn("Could not parse error response as JSON during edit:", jsonError);
        }
        throw new Error(errorMsg);
      }

      const rawText = await response.text();
      console.log("Raw response text:", rawText);
      const updatedStageData = rawText ? JSON.parse(rawText) : {};
      const updatedStage: Stage = {
        ...currentStage,
        name: updatedStageData.name || formData.name,
        description: updatedStageData.description || formData.description,
        languageId: updatedStageData.languageId || languageId,
      };

      setStages((prev) =>
        prev.map((stage) => (stage.id === currentStage.id ? updatedStage : stage))
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
              {toast.type === "success" ? <HiCheck className="size-5" /> : <HiX className="size-5" />}
            </div>
            <div className="ml-3 text-sm font-normal">{toast.message}</div>
            <Toast.Toggle onDismiss={() => setToastMessages((prev) => prev.filter((t) => t.id !== toast.id))} />
          </Toast>
        ))}
      </div>

      <div className="mx-auto w-full max-w-4xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
            Gestionar Etapas {languageId ? `(Idioma ID: ...${languageId.slice(-6)})` : ''}
          </h1>
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
                 <Table.HeadCell>Nombre</Table.HeadCell>
                 <Table.HeadCell>Descripción</Table.HeadCell>
                 <Table.HeadCell>
                   <span className="sr-only">Editar</span>
                 </Table.HeadCell>
               </Table.Head>
               <Table.Body className="divide-y">
                 {stages.length > 0 ? (
                   stages.map((stage) => (
                     <Table.Row key={stage.id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                       <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                         {stage.name}
                       </Table.Cell>
                       <Table.Cell>{stage.description}</Table.Cell>
                       <Table.Cell>
                         <Button
                           size="sm"
                           color="light"
                           onClick={() => openEditModal(stage)}
                         >
                           <HiPencil className="mr-1 size-4" />
                           Editar
                         </Button>
                       </Table.Cell>
                     </Table.Row>
                   ))
                 ) : (
                   <Table.Row>
                     <Table.Cell colSpan={3} className="text-center text-gray-500 dark:text-gray-400">
                       No se encontraron etapas para este idioma.
                     </Table.Cell>
                   </Table.Row>
                 )}
               </Table.Body>
             </Table>
          </div>
        )}
      </div>

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
               <Button color="gray" onClick={closeAddModal} disabled={isSubmitting}>
                 Cancelar
               </Button>
               <Button type="submit" color="blue" isProcessing={isSubmitting} disabled={isSubmitting}>
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
               <Button color="gray" onClick={closeEditModal} disabled={isSubmitting}>
                 Cancelar
               </Button>
               <Button type="submit" color="success" isProcessing={isSubmitting} disabled={isSubmitting}>
                 {isSubmitting ? "Guardando..." : "Guardar Cambios"}
               </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </>
  );
}
