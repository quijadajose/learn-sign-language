import { useState, useEffect, useRef, useCallback } from "react";
import { SingleValue } from "react-select";
import { moderatorApi, adminApi, regionApi, unwrapApiList } from "../../services/api";
import { PermissionScope } from "../../types/user";
import {
  Language,
  ModeratorPermission,
  Region,
  ToastMessage,
  UserSelectOption,
} from "./types";

export function useModeratorManagement() {
  const [permissions, setPermissions] = useState<ModeratorPermission[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingPermission, setDeletingPermission] =
    useState<ModeratorPermission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSelectOption | null>(
    null,
  );
  const [selectedScope, setSelectedScope] = useState<PermissionScope | "">("");
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>("");
  const searchTimeoutRef = useRef<number | null>(null);

  const addToast = useCallback((type: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const fetchModerators = useCallback(
    async (page: number = currentPage) => {
      try {
        setLoading(true);
        setError(null);
        const response = await moderatorApi.listModerators({
          page,
          limit: pageSize,
        });

        if (response.success && response.data) {
          setPermissions(unwrapApiList(response.data));
          setTotalItems(
            typeof response.data === "object" &&
              response.data !== null &&
              "total" in response.data
              ? Number((response.data as { total?: number }).total) || 0
              : 0,
          );
        } else {
          setError(response.message || "Error al cargar moderadores");
        }
      } catch {
        setError("Error de conexión al cargar moderadores");
      } finally {
        setLoading(false);
      }
    },
    [currentPage, pageSize],
  );

  const fetchLanguages = useCallback(async () => {
    try {
      const response = await adminApi.getLanguages(1, 100);
      if (response.success && response.data) {
        setLanguages(unwrapApiList(response.data));
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Error loading languages:", err);
      }
    }
  }, []);

  const fetchRegions = useCallback(async () => {
    try {
      const response = await regionApi.getRegions(1, 100);
      if (response.success && response.data) {
        const list = unwrapApiList(response.data) as Array<
          Region & { language?: { id?: string } }
        >;
        setRegions(
          list.map((region) => ({
            id: region.id,
            name: region.name,
            languageId:
              region.languageId || region.language?.id || undefined,
          })),
        );
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("Error loading regions:", err);
      }
    }
  }, []);

  useEffect(() => {
    void fetchModerators(currentPage);
    void fetchLanguages();
    void fetchRegions();
  }, [currentPage, fetchModerators, fetchLanguages, fetchRegions]);

  useEffect(() => {
    const timeoutId = searchTimeoutRef.current;
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const resetAssignForm = () => {
    setSelectedUser(null);
    setSelectedScope("");
    setSelectedTargetId("");
    setSelectedLanguageId("");
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
    } catch {
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
    } catch {
      addToast("error", "Error de conexión al revocar permiso");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleScopeChange = (scope: PermissionScope) => {
    setSelectedScope(scope);
    setSelectedTargetId("");
  };

  const closeAssignModal = () => {
    setIsAssignModalOpen(false);
    resetAssignForm();
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingPermission(null);
  };

  const handleUserChange = (option: SingleValue<UserSelectOption>) => {
    setSelectedUser(option);
  };

  return {
    permissions,
    loading,
    error,
    toasts,
    setToasts,
    currentPage,
    setCurrentPage,
    pageSize,
    totalItems,
    isAssignModalOpen,
    setIsAssignModalOpen,
    isDeleteModalOpen,
    deletingPermission,
    isSubmitting,
    isDeleting,
    selectedUser,
    selectedScope,
    selectedTargetId,
    selectedLanguageId,
    setSelectedLanguageId,
    languages,
    regions,
    handleAssignPermission,
    handleDeleteClick,
    handleDeletePermission,
    handleScopeChange,
    closeAssignModal,
    closeDeleteModal,
    handleUserChange,
    setSelectedTargetId,
    setError,
  };
}
