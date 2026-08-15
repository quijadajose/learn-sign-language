import { Button, Alert, Spinner, Toast, ToastToggle } from "flowbite-react";
import {
  HiPlus,
  HiCheck,
  HiX,
  HiArrowRight,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import AssignPermissionModal from "./AssignPermissionModal";
import DeletePermissionModal from "./DeletePermissionModal";
import ModeratorTable from "./ModeratorTable";
import { useModeratorManagement } from "./useModeratorManagement";

export default function ModeratorManagement() {
  const navigate = useNavigate();
  const {
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
  } = useModeratorManagement();

  const showEmpty = !loading && permissions.length === 0;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="xl" aria-label="Cargando moderadores..." />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <div className="fixed right-5 top-5 z-9999 flex flex-col gap-3">
        {toasts.map((toast) => (
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
            <ToastToggle
              onDismiss={() =>
                setToasts((prev) => prev.filter((t) => t.id !== toast.id))
              }
            />
          </Toast>
        ))}
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Moderadores
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
            Otorga acceso a usuarios para gestionar un lenguaje completo o solo
            una región. También puedes invitarlos desde el panel de cada
            lenguaje.
          </p>
        </div>
        {!showEmpty && (
          <Button
            onClick={() => setIsAssignModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <HiPlus className="mr-2 size-4" />
            Asignar permiso
          </Button>
        )}
      </div>

      {error && (
        <Alert color="failure" onDismiss={() => setError(null)}>
          <span className="font-medium">Error!</span> {error}
        </Alert>
      )}

      {!showEmpty && (
        <Alert color="info">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              Tip: desde el panel de un lenguaje puedes invitar moderadores en
              contexto.
            </span>
            <Button
              size="xs"
              color="light"
              onClick={() => navigate("/admin/languages")}
            >
              Ir a lenguajes
              <HiArrowRight className="ml-1 size-3.5" />
            </Button>
          </div>
        </Alert>
      )}

      <ModeratorTable
        permissions={permissions}
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={totalItems}
        onAssign={() => setIsAssignModalOpen(true)}
        onDeleteClick={handleDeleteClick}
        onPageChange={setCurrentPage}
      />

      <AssignPermissionModal
        show={isAssignModalOpen}
        isSubmitting={isSubmitting}
        selectedUser={selectedUser}
        selectedScope={selectedScope}
        selectedTargetId={selectedTargetId}
        selectedLanguageId={selectedLanguageId}
        languages={languages}
        regions={regions}
        onClose={closeAssignModal}
        onSubmit={handleAssignPermission}
        onUserChange={handleUserChange}
        onScopeChange={handleScopeChange}
        onTargetIdChange={setSelectedTargetId}
        onLanguageIdChange={setSelectedLanguageId}
      />

      <DeletePermissionModal
        show={isDeleteModalOpen}
        isDeleting={isDeleting}
        deletingPermission={deletingPermission}
        onClose={closeDeleteModal}
        onConfirm={handleDeletePermission}
      />
    </div>
  );
}
