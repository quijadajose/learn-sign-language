import { Button } from "flowbite-react";
import {
  HiTrash,
  HiPlus,
  HiExternalLink,
  HiUserGroup,
} from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { ModeratorPermission } from "./types";

interface ModeratorTableProps {
  permissions: ModeratorPermission[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onAssign: () => void;
  onDeleteClick: (permission: ModeratorPermission) => void;
  onPageChange: (page: number) => void;
}

export default function ModeratorTable({
  permissions,
  currentPage,
  pageSize,
  totalItems,
  onAssign,
  onDeleteClick,
  onPageChange,
}: ModeratorTableProps) {
  const navigate = useNavigate();
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  if (permissions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center dark:border-gray-600 dark:bg-gray-800">
        <HiUserGroup className="mx-auto size-10 text-gray-400 dark:text-gray-500" />
        <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
          Aún no hay moderadores
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
          Asigna permisos por lenguaje o región para que otras personas ayuden a
          crear contenido, grabar señas y gestionar lecciones.
        </p>
        <Button
          color="blue"
          className="mt-6 bg-blue-600 hover:bg-blue-700"
          onClick={onAssign}
        >
          <HiPlus className="mr-2 size-4" />
          Asignar primer moderador
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {totalItems} {totalItems === 1 ? "permiso" : "permisos"}
      </p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/40">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Alcance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Recurso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Asignado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {permissions.map((permission) => {
              const languageId =
                permission.scope === "language"
                  ? permission.language?.id
                  : undefined;
              const resourceName =
                permission.scope === "language"
                  ? permission.language?.name || "—"
                  : permission.region?.name || "—";

              return (
                <tr
                  key={permission.id}
                  className="bg-white hover:bg-gray-50 dark:bg-gray-900/20 dark:hover:bg-gray-900/40"
                >
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {permission.user.firstName} {permission.user.lastName}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {permission.user.email}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        permission.scope === "language"
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                          : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {permission.scope === "language"
                        ? "Lenguaje"
                        : "Región"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {resourceName}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(permission.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {languageId && (
                        <Button
                          size="sm"
                          color="light"
                          onClick={() =>
                            navigate(`/admin/languages/${languageId}`)
                          }
                        >
                          <HiExternalLink className="mr-1.5 size-4" />
                          Panel
                        </Button>
                      )}
                      <Button
                        size="sm"
                        color="failure"
                        className="bg-red-600 text-white hover:bg-red-700 enabled:hover:bg-red-700"
                        onClick={() => onDeleteClick(permission)}
                      >
                        <HiTrash className="mr-1.5 size-4" />
                        Revocar
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                color="light"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
              >
                Anterior
              </Button>
              <Button
                size="sm"
                color="light"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
