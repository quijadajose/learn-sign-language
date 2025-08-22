import { useState, useEffect } from "react";
import { BACKEND_BASE_URL } from "../config";
import {
  Button,
  Modal,
  TextInput,
  Label,
  Textarea,
  Spinner,
  Alert,
  Toast,
  FileInput,
} from "flowbite-react";
import {
  HiPencil,
  HiExclamationCircle,
  HiCheck,
  HiX,
  HiTrash,
  HiPlus,
} from "react-icons/hi";

interface Language {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface LanguagesResponse {
  data: Language[];
  total: number;
  page: number;
  pageSize: number;
}

export default function LanguageManagement() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingLanguage, setDeletingLanguage] = useState<Language | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", description: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [toastMessages, setToastMessages] = useState<
    { id: number; type: "success" | "error"; message: string }[]
  >([]);
  const [imageTimestamp, setImageTimestamp] = useState<number>(Date.now());

  const addToast = (type: "success" | "error", message: string) => {
    const id = Date.now();
    setToastMessages((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToastMessages((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const fetchLanguages = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("auth");

      const response = await fetch(
        `${BACKEND_BASE_URL}/languages?page=${page}&limit=100&orderBy=name&sortOrder=ASC`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message || `Error al cargar idiomas (${response.status})`;
        throw new Error(errorMessage);
      }

      const data: LanguagesResponse = await response.json();
      setLanguages(data.data);
      setTotalPages(Math.ceil(data.total / data.pageSize));
      setCurrentPage(data.page);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error fetching languages";
      setError(errorMessage);
      addToast("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLanguages();
  }, []);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchLanguages(page);
  };

  const handleEditClick = (language: Language) => {
    setEditingLanguage(language);
    setEditForm({
      name: language.name,
      description: language.description,
    });
    setEditSelectedFile(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLanguage) return;

    setIsSubmitting(true);
    let languageUpdateSuccess = false;
    let imageUploadSuccess = false;

    try {
      const token = localStorage.getItem("auth");

      const response = await fetch(
        `${BACKEND_BASE_URL}/languages/${editingLanguage.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editForm),
        },
      );

      if (response.ok) {
        languageUpdateSuccess = true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          `Error al actualizar idioma (${response.status})`;
        addToast("error", `Error al actualizar idioma: ${errorMessage}`);
      }

      if (editSelectedFile) {
        try {
          const formData = new FormData();
          formData.append("id", editingLanguage.id);
          const fileExtension = editSelectedFile.name
            .split(".")
            .pop()
            ?.toLowerCase();
          const validFormats = ["png", "jpeg", "jpg", "webp"];
          const format = validFormats.includes(fileExtension || "")
            ? fileExtension!
            : "png";
          formData.append("format", format);
          formData.append("file", editSelectedFile);

          const uploadResponse = await fetch(
            `${BACKEND_BASE_URL}/images/upload/language`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            },
          );

          if (uploadResponse.ok) {
            imageUploadSuccess = true;
            setImageTimestamp(Date.now());
          } else {
            const uploadErrorData = await uploadResponse
              .json()
              .catch(() => ({}));
            const uploadErrorMessage =
              uploadErrorData.message || "Error desconocido al subir imagen";
            addToast("error", `Error al subir imagen: ${uploadErrorMessage}`);
          }
        } catch (uploadErr) {
          console.warn("Error uploading image:", uploadErr);
          addToast("error", "Error al subir la imagen.");
        }
      }

      if (languageUpdateSuccess && imageUploadSuccess) {
        addToast("success", "Idioma e imagen actualizados correctamente.");
      } else if (languageUpdateSuccess) {
        addToast("success", "Idioma actualizado correctamente.");
      } else if (imageUploadSuccess) {
        addToast("success", "Imagen actualizada correctamente.");
      }

      if (languageUpdateSuccess || imageUploadSuccess) {
        await fetchLanguages(currentPage);
        setIsEditModalOpen(false);
        setEditingLanguage(null);
        setEditForm({ name: "", description: "" });
        setEditSelectedFile(null);
        setError(null);
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error updating language";
      addToast("error", `Error al actualizar idioma: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingLanguage(null);
    setEditForm({ name: "", description: "" });
    setEditSelectedFile(null);
  };

  const handleDeleteClick = (language: Language) => {
    setDeletingLanguage(language);
    setIsDeleteModalOpen(true);
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeletingLanguage(null);
  };

  const handleDeleteSubmit = async () => {
    if (!deletingLanguage) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("auth");
      const response = await fetch(
        `${BACKEND_BASE_URL}/languages/${deletingLanguage.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message || `Error al eliminar idioma (${response.status})`;
        throw new Error(errorMessage);
      }

      await fetchLanguages(currentPage);
      setIsDeleteModalOpen(false);
      setDeletingLanguage(null);
      setError(null);
      addToast("success", "Idioma eliminado correctamente.");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error deleting language";
      setError(errorMessage);
      addToast("error", `Error al eliminar idioma: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddClick = () => {
    setAddForm({ name: "", description: "" });
    setSelectedFile(null);
    setIsAddModalOpen(true);
  };

  const handleCancelAdd = () => {
    setIsAddModalOpen(false);
    setAddForm({ name: "", description: "" });
    setSelectedFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditSelectedFile(file);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file);
    }
  };

  const handleEditFileDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setEditSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) {
      addToast("error", "El nombre del idioma es obligatorio.");
      return;
    }

    setIsAdding(true);
    try {
      const token = localStorage.getItem("auth");

      const createResponse = await fetch(`${BACKEND_BASE_URL}/languages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addForm),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          `Error al crear idioma (${createResponse.status})`;
        throw new Error(errorMessage);
      }

      const newLanguage = await createResponse.json();

      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append("id", newLanguage.id);
          const fileExtension = selectedFile.name
            .split(".")
            .pop()
            ?.toLowerCase();
          const validFormats = ["png", "jpeg", "jpg", "webp"];
          const format = validFormats.includes(fileExtension || "")
            ? fileExtension!
            : "png";
          formData.append("format", format);
          formData.append("file", selectedFile);

          const uploadResponse = await fetch(
            `${BACKEND_BASE_URL}/images/upload/language`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
              body: formData,
            },
          );

          if (!uploadResponse.ok) {
            const uploadErrorData = await uploadResponse
              .json()
              .catch(() => ({}));
            const uploadErrorMessage =
              uploadErrorData.message || "Error desconocido al subir imagen";
            addToast(
              "error",
              `Idioma creado pero error al subir imagen: ${uploadErrorMessage}`,
            );
          } else {
            setImageTimestamp(Date.now());
          }
        } catch (uploadErr) {
          console.warn("Error uploading image:", uploadErr);
          addToast(
            "error",
            "Idioma creado pero hubo un error al subir la imagen.",
          );
        }
      }

      await fetchLanguages(currentPage);
      setIsAddModalOpen(false);
      setAddForm({ name: "", description: "" });
      setSelectedFile(null);
      setError(null);
      addToast("success", "Idioma creado correctamente.");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error creating language";
      setError(errorMessage);
      addToast("error", `Error al crear idioma: ${errorMessage}`);
    } finally {
      setIsAdding(false);
    }
  };

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

      <div className="mx-auto w-full max-w-6xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
              Administración de Idiomas
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Gestiona los idiomas disponibles en la plataforma
            </p>
          </div>
          <Button onClick={handleAddClick} color="blue">
            <HiPlus className="mr-2 size-5" />
            Añadir Idioma
          </Button>
        </div>

        {error && (
          <Alert color="failure" icon={HiExclamationCircle} className="mb-4">
            <span className="font-medium">Error!</span> {error}
          </Alert>
        )}

        <div className="overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800">
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Lista de Idiomas
            </h2>
          </div>

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
                    Fecha de Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Última Actualización
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {languages.map((language) => (
                  <tr
                    key={language.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={`${BACKEND_BASE_URL}/images/language/${language.id}?size=sm&v=${imageTimestamp}`}
                          alt={`Bandera de ${language.name}`}
                          className="mr-3 h-6 w-8 rounded object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {language.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs text-sm text-gray-500 dark:text-gray-400">
                        {language.description}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(language.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(language.updatedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          color="light"
                          onClick={() => handleEditClick(language)}
                        >
                          <HiPencil className="mr-1 size-4" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          color="failure"
                          onClick={() => handleDeleteClick(language)}
                        >
                          <HiTrash className="mr-1 size-4" />
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  color="light"
                  size="sm"
                >
                  Anterior
                </Button>
                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  color="light"
                  size="sm"
                >
                  Siguiente
                </Button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Mostrando página{" "}
                    <span className="font-medium">{currentPage}</span> de{" "}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
                    <Button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      color="light"
                      size="sm"
                    >
                      Anterior
                    </Button>
                    <Button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      color="light"
                      size="sm"
                    >
                      Siguiente
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal show={isEditModalOpen} onClose={handleCancelEdit} popup size="md">
        <Modal.Header />
        <Modal.Body>
          <form onSubmit={handleEditSubmit} className="space-y-6">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Editar Idioma
            </h3>
            <div>
              <Label htmlFor="edit-name" value="Nombre del Idioma" />
              <TextInput
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-description" value="Descripción" />
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-image" value="Imagen (Opcional)" />
              <div className="flex w-full items-center justify-center">
                <Label
                  htmlFor="edit-dropzone-file"
                  className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                  onDrop={handleEditFileDrop}
                  onDragOver={handleDragOver}
                >
                  <div className="flex flex-col items-center justify-center pb-6 pt-5">
                    <svg
                      className="mb-4 h-8 w-8 text-gray-500 dark:text-gray-400"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 16"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                  </div>
                  <FileInput
                    id="edit-dropzone-file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleEditFileChange}
                    disabled={isSubmitting}
                  />
                </Label>
              </div>
              {editSelectedFile && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Archivo seleccionado: {editSelectedFile.name}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button
                color="gray"
                onClick={handleCancelEdit}
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

      <Modal
        show={isDeleteModalOpen}
        onClose={handleCancelDelete}
        popup
        size="md"
      >
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <HiExclamationCircle className="mx-auto mb-4 size-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que quieres eliminar el idioma{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                "{deletingLanguage?.name}"
              </span>
              ?
            </h3>
            <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              idioma y todos sus datos asociados.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                color="gray"
                onClick={handleCancelDelete}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                color="failure"
                onClick={handleDeleteSubmit}
                isProcessing={isDeleting}
                disabled={isDeleting}
              >
                {isDeleting ? "Eliminando..." : "Sí, eliminar"}
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      <Modal show={isAddModalOpen} onClose={handleCancelAdd} popup size="md">
        <Modal.Header />
        <Modal.Body>
          <form onSubmit={handleAddSubmit} className="space-y-6">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Añadir Nuevo Idioma
            </h3>
            <div>
              <Label htmlFor="add-name" value="Nombre del Idioma" />
              <TextInput
                id="add-name"
                value={addForm.name}
                onChange={(e) =>
                  setAddForm({ ...addForm, name: e.target.value })
                }
                placeholder="Ej: Lenguaje de señas Chileno"
                required
                disabled={isAdding}
              />
            </div>
            <div>
              <Label htmlFor="add-description" value="Descripción" />
              <Textarea
                id="add-description"
                value={addForm.description}
                onChange={(e) =>
                  setAddForm({ ...addForm, description: e.target.value })
                }
                placeholder="Describe brevemente el idioma"
                rows={3}
                disabled={isAdding}
              />
            </div>
            <div>
              <Label htmlFor="add-image" value="Imagen (Opcional)" />
              <div className="flex w-full items-center justify-center">
                <Label
                  htmlFor="dropzone-file"
                  className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                  onDrop={handleFileDrop}
                  onDragOver={handleDragOver}
                >
                  <div className="flex flex-col items-center justify-center pb-6 pt-5">
                    <svg
                      className="mb-4 h-8 w-8 text-gray-500 dark:text-gray-400"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 16"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                      />
                    </svg>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                  </div>
                  <FileInput
                    id="dropzone-file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isAdding}
                  />
                </Label>
              </div>
              {selectedFile && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Archivo seleccionado: {selectedFile.name}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <Button
                color="gray"
                onClick={handleCancelAdd}
                disabled={isAdding}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                color="blue"
                isProcessing={isAdding}
                disabled={isAdding}
              >
                {isAdding ? "Creando..." : "Crear Idioma"}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </>
  );
}
