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
} from "flowbite-react";
import { HiPencil, HiExclamationCircle, HiCheck, HiX } from "react-icons/hi";

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessages, setToastMessages] = useState<
    { id: number; type: "success" | "error"; message: string }[]
  >([]);

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
        throw new Error(`HTTP error! status: ${response.status}`);
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
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLanguage) return;

    setIsSubmitting(true);
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await fetchLanguages(currentPage);
      setIsEditModalOpen(false);
      setEditingLanguage(null);
      setEditForm({ name: "", description: "" });
      setError(null);
      addToast("success", "Idioma actualizado correctamente.");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error updating language";
      setError(errorMessage);
      addToast("error", `Error al actualizar idioma: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingLanguage(null);
    setEditForm({ name: "", description: "" });
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-700 dark:text-gray-300">
            Administración de Idiomas
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Gestiona los idiomas disponibles en la plataforma
          </p>
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
                          src={`${BACKEND_BASE_URL}/images/language/${language.id}?size=sm`}
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
                      <Button
                        size="sm"
                        color="light"
                        onClick={() => handleEditClick(language)}
                      >
                        <HiPencil className="mr-1 size-4" />
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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

      {/* Modal de Edición */}
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
    </>
  );
}
