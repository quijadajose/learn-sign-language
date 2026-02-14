import { useState, useEffect, useRef } from "react";
import {
  Button,
  Card,
  Label,
  Modal,
  Table,
  Select,
  Toast,
  Alert,
  Spinner,
} from "flowbite-react";
import { HiPlus, HiTrash, HiExclamationCircle } from "react-icons/hi";
import AsyncSelect from "react-select/async";
import { moderatorApi, adminApi, regionApi } from "../services/api";
import { PermissionScope } from "../types/user";
import { SingleValue } from "react-select";

interface ModeratorPermission {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  scope: PermissionScope;
  language?: {
    id: string;
    name: string;
  };
  region?: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface Language {
  id: string;
  name: string;
}

interface Region {
  id: string;
  name: string;
  languageId?: string;
}

interface ToastMessage {
  id: number;
  type: "success" | "error";
  message: string;
}

export default function ModeratorManagement() {
  const [permissions, setPermissions] = useState<ModeratorPermission[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPermission, setDeletingPermission] =
    useState<ModeratorPermission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{
    value: string;
    label: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  } | null>(null);
  const [selectedScope, setSelectedScope] = useState<PermissionScope | "">("");
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>("");
  const searchTimeoutRef = useRef<number | null>(null);

  const addToast = (type: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchModerators = async (page: number = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const response = await moderatorApi.listModerators({
        page,
        limit: pageSize,
      });

      if (response.success && response.data) {
        setPermissions(response.data.data || []);
        setTotalItems(response.data.total || 0);
      } else {
        setError(response.message || "Error al cargar moderadores");
      }
    } catch (err) {
      setError("Error de conexión al cargar moderadores");
    } finally {
      setLoading(false);
    }
  };

  const fetchLanguages = async () => {
    try {
      // El backend tiene un límite máximo de 100, así que hacemos múltiples llamadas si es necesario
      const response = await adminApi.getLanguages(1, 100);
      if (response.success && response.data) {
        setLanguages(response.data.data || []);
        // Si hay más páginas, podríamos hacer llamadas adicionales, pero por ahora solo cargamos la primera página
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Error loading languages:", err);
      }
    }
  };

  const fetchRegions = async () => {
    try {
      // El backend tiene un límite máximo de 100, así que hacemos múltiples llamadas si es necesario
      const response = await regionApi.getRegions(1, 100);
      if (response.success && response.data) {
        setRegions(response.data.data || []);
        // Si hay más páginas, podríamos hacer llamadas adicionales, pero por ahora solo cargamos la primera página
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Error loading regions:", err);
      }
    }
  };

  useEffect(() => {
    fetchModerators(currentPage);
    fetchLanguages();
    fetchRegions();
  }, [currentPage]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const loadUserOptions = async (inputValue: string): Promise<
    Array<{
      value: string;
      label: string;
      user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
      };
    }>
  > => {
    if (!inputValue || inputValue.trim().length < 2) {
      return [];
    }

    try {
      const response = await moderatorApi.searchUsers(inputValue.trim());

      if (response.success && response.data) {
        const users = Array.isArray(response.data) ? response.data : [];
        return users.map((user: {
          id: string;
          email: string;
          firstName: string;
          lastName: string;
        }) => ({
          value: user.id,
          label: `${user.firstName} ${user.lastName} (${user.email})`,
          user: user,
        }));
      }
      return [];
    } catch (err) {
      return [];
    }
  };

  const handleAssignPermission = async () => {
    if (!selectedUser) {
      addToast("error", "Debes buscar y seleccionar un usuario primero");
      return;
    }

    if (!selectedScope) {
      addToast("error", "Debes seleccionar un tipo de permiso");
      return;
    }

    if (!selectedTargetId) {
      addToast(
        "error",
        `Debes seleccionar un ${selectedScope === "language" ? "lenguaje" : "región"}`,
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await moderatorApi.assignPermission({
        userId: selectedUser.user.id,
        scope: selectedScope,
        targetId: selectedTargetId,
      });

      if (response.success) {
        addToast("success", "Permiso asignado exitosamente");
        setIsAssignModalOpen(false);
        resetAssignForm();
        fetchModerators();
      } else {
        addToast("error", response.message || "Error al asignar permiso");
      }
    } catch (err) {
      addToast("error", "Error de conexión al asignar permiso");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (permission: ModeratorPermission) => {
    setDeletingPermission(permission);
    setIsDeleteModalOpen(true);
  };

  const handleDeletePermission = async () => {
    if (!deletingPermission) return;

    try {
      setIsDeleting(true);
      const response = await moderatorApi.revokePermission(
        deletingPermission.id,
      );

      if (response.success) {
        addToast("success", "Permiso revocado exitosamente");
        setIsDeleteModalOpen(false);
        setDeletingPermission(null);
        fetchModerators();
      } else {
        addToast("error", response.message || "Error al revocar permiso");
      }
    } catch (err) {
      addToast("error", "Error de conexión al revocar permiso");
    } finally {
      setIsDeleting(false);
    }
  };

  const resetAssignForm = () => {
    setSelectedUser(null);
    setSelectedScope("");
    setSelectedTargetId("");
    setSelectedLanguageId("");
  };

  const handleScopeChange = (scope: PermissionScope) => {
    setSelectedScope(scope);
    setSelectedTargetId(""); // Reset target when scope changes
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="fixed right-5 top-5 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <Toast key={toast.id}>
            <div
              className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${toast.type === "success"
                  ? "bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200"
                  : "bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200"
                }`}
            >
              {toast.type === "success" ? (
                <HiExclamationCircle className="size-5" />
              ) : (
                <HiExclamationCircle className="size-5" />
              )}
            </div>
            <div className="ml-3 text-sm font-normal">{toast.message}</div>
            <Toast.Toggle
              onDismiss={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
            />
          </Toast>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestión de Moderadores
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra los permisos de moderación para lenguajes y regiones
          </p>
        </div>
        <Button
          onClick={() => setIsAssignModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <HiPlus className="mr-2 h-4 w-4" />
          Asignar Permiso
        </Button>
      </div>

      {error && (
        <Alert color="failure" onDismiss={() => setError(null)}>
          <span className="font-medium">Error!</span> {error}
        </Alert>
      )}

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <Table.Head>
              <Table.HeadCell>Usuario</Table.HeadCell>
              <Table.HeadCell>Tipo</Table.HeadCell>
              <Table.HeadCell>Recurso</Table.HeadCell>
              <Table.HeadCell>Fecha de Asignación</Table.HeadCell>
              <Table.HeadCell>Acciones</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {permissions.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={5} className="text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      No hay permisos de moderación asignados
                    </p>
                  </Table.Cell>
                </Table.Row>
              ) : (
                permissions.map((permission) => (
                  <Table.Row
                    key={permission.id}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800"
                  >
                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      {permission.user.firstName} {permission.user.lastName}
                      <br />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {permission.user.email}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${permission.scope === "language"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                          }`}
                      >
                        {permission.scope === "language"
                          ? "Lenguaje"
                          : "Región"}
                      </span>
                    </Table.Cell>
                    <Table.Cell className="text-gray-900 dark:text-white">
                      {permission.scope === "language"
                        ? permission.language?.name || "N/A"
                        : permission.region?.name || "N/A"}
                    </Table.Cell>
                    <Table.Cell className="text-gray-900 dark:text-white">
                      {new Date(permission.createdAt).toLocaleDateString()}
                    </Table.Cell>
                    <Table.Cell>
                      <Button
                        size="sm"
                        color="failure"
                        onClick={() => handleDeleteClick(permission)}
                      >
                        <HiTrash className="h-4 w-4" />
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table>
        </div>

        {/* Paginación */}
        {totalItems > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                color="gray"
              >
                Anterior
              </Button>
              <Button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage * pageSize >= totalItems}
                color="gray"
              >
                Siguiente
              </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-400">
                  Mostrando{" "}
                  <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>{" "}
                  a{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, totalItems)}
                  </span>{" "}
                  de <span className="font-medium">{totalItems}</span> resultados
                </p>
              </div>
              <div>
                <div className="inline-flex gap-2">
                  <Button
                    size="sm"
                    color="gray"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    size="sm"
                    color="gray"
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={currentPage * pageSize >= totalItems}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Modal
        show={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          resetAssignForm();
        }}
        size="md"
      >
        <Modal.Header>Asignar Permiso de Moderación</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user-select" value="Seleccionar Usuario" />
              <AsyncSelect
                id="user-select"
                value={selectedUser}
                onChange={(option: SingleValue<typeof selectedUser>) => setSelectedUser(option)}
                loadOptions={loadUserOptions}
                placeholder="Escribe para buscar por email o nombre..."
                isClearable
                isDisabled={isSubmitting}
                noOptionsMessage={({ inputValue }) =>
                  inputValue.length < 2
                    ? "Escribe al menos 2 caracteres para buscar"
                    : "No se encontraron usuarios"
                }
                loadingMessage={() => "Buscando usuarios..."}
                defaultOptions={false}
                cacheOptions={false}
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: "42px",
                    borderColor: "#d1d5db",
                    "&:hover": {
                      borderColor: "#9ca3af",
                    },
                  }),
                }}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Escribe el email o nombre del usuario para buscar (mínimo 2 caracteres)
              </p>
            </div>

            <div>
              <Label htmlFor="scope" value="Tipo de Permiso" />
              <Select
                id="scope"
                value={selectedScope}
                onChange={(e) =>
                  handleScopeChange(e.target.value as PermissionScope)
                }
                disabled={isSubmitting || !selectedUser}
              >
                <option value="">Selecciona un tipo</option>
                <option value="language">Lenguaje</option>
                <option value="region">Región</option>
              </Select>
            </div>

            {selectedScope === "language" && (
              <div>
                <Label htmlFor="language-select" value="Lenguaje" />
                <Select
                  id="language-select"
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  disabled={isSubmitting || !selectedUser}
                >
                  <option value="">Selecciona un lenguaje</option>
                  {languages.map((language) => (
                    <option key={language.id} value={language.id}>
                      {language.name}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            {selectedScope === "region" && (
              <>
                <div>
                  <Label htmlFor="language-for-region-select" value="Lenguaje" />
                  <Select
                    id="language-for-region-select"
                    value={selectedLanguageId}
                    onChange={(e) => {
                      setSelectedLanguageId(e.target.value);
                      setSelectedTargetId(""); // Reset region when language changes
                    }}
                    disabled={isSubmitting || !selectedUser}
                  >
                    <option value="">Selecciona un lenguaje primero</option>
                    {languages.map((language) => (
                      <option key={language.id} value={language.id}>
                        {language.name}
                      </option>
                    ))}
                  </Select>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Primero selecciona el lenguaje para ver sus regiones
                  </p>
                </div>
                {selectedLanguageId && (
                  <div>
                    <Label htmlFor="region-select" value="Región" />
                    <Select
                      id="region-select"
                      value={selectedTargetId}
                      onChange={(e) => setSelectedTargetId(e.target.value)}
                      disabled={isSubmitting || !selectedUser || !selectedLanguageId}
                    >
                      <option value="">Selecciona una región</option>
                      {regions
                        .filter((region) => region.languageId === selectedLanguageId)
                        .map((region) => (
                          <option key={region.id} value={region.id}>
                            {region.name}
                          </option>
                        ))}
                    </Select>
                  </div>
                )}
              </>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="gray"
            onClick={() => {
              setIsAssignModalOpen(false);
              resetAssignForm();
            }}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleAssignPermission}
            isProcessing={isSubmitting}
            disabled={isSubmitting || !selectedUser || !selectedScope || !selectedTargetId}
          >
            Asignar Permiso
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingPermission(null);
        }}
        size="md"
      >
        <Modal.Header>Revocar Permiso</Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <HiExclamationCircle className="mx-auto mb-4 size-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que quieres revocar el permiso de{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {deletingPermission?.user.firstName}{" "}
                {deletingPermission?.user.lastName}
              </span>
              ?
            </h3>
            <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
              Esta acción revocará el permiso de moderación para{" "}
              {deletingPermission?.scope === "language"
                ? `el lenguaje "${deletingPermission?.language?.name}"`
                : `la región "${deletingPermission?.region?.name}"`}
              .
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="gray"
            onClick={() => {
              setIsDeleteModalOpen(false);
              setDeletingPermission(null);
            }}
            disabled={isDeleting}
          >
            Cancelar
          </Button>
          <Button
            color="failure"
            onClick={handleDeletePermission}
            isProcessing={isDeleting}
            disabled={isDeleting}
          >
            {isDeleting ? "Revocando..." : "Sí, revocar"}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
