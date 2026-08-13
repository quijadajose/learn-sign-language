import { Button } from "flowbite-react";
import {
  HiPencil,
  HiTrash,
  HiArrowRight,
  HiExternalLink,
} from "react-icons/hi";
import { BACKEND_BASE_URL } from "../../config";
import EmptyNextStep from "../setup/EmptyNextStep";
import { Language } from "./types";

interface LanguageTableProps {
  languages: Language[];
  imageTimestamp: number;
  hasLanguagePermission: (languageId: string) => boolean;
  hasAnyPermissionForLanguage: (languageId: string) => boolean;
  continuingId?: string | null;
  onOpenWorkspace: (languageId: string) => void;
  onContinueSetup: (languageId: string) => void;
  onEdit: (language: Language) => void;
  onDelete: (language: Language) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onAddLanguage?: () => void;
  canDelete?: boolean;
}

export default function LanguageTable({
  languages,
  imageTimestamp,
  hasLanguagePermission,
  hasAnyPermissionForLanguage,
  continuingId = null,
  onOpenWorkspace,
  onContinueSetup,
  onEdit,
  onDelete,
  currentPage,
  totalPages,
  onPageChange,
  onAddLanguage,
  canDelete = false,
}: LanguageTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Lenguajes
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Abre el panel de cada lenguaje para configurar contenido y equipo.
        </p>
      </div>

      {languages.length === 0 ? (
        <EmptyNextStep
          title="Todavía no hay lenguajes"
          description="Crea el primero para desbloquear etapas, regiones y lecciones."
          actionLabel={onAddLanguage ? "Crear lenguaje" : undefined}
          onAction={onAddLanguage}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Lenguaje
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Descripción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {languages.map((language) => {
                const canManage = hasAnyPermissionForLanguage(language.id);
                const canEdit = hasLanguagePermission(language.id);
                return (
                  <tr
                    key={language.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/30"
                  >
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={`${BACKEND_BASE_URL}/images/languages/${encodeURIComponent(language.id)}?size=original&v=${imageTimestamp}`}
                          alt=""
                          className="h-8 w-12 rounded object-contain"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (
                              language.countryCode &&
                              !target.src.includes("/flags/")
                            ) {
                              target.src = `/flags/${language.countryCode.toLowerCase()}.svg`;
                            } else {
                              target.style.display = "none";
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="text-left text-sm font-medium text-blue-700 hover:underline dark:text-blue-300"
                          onClick={() => onOpenWorkspace(language.id)}
                          disabled={!canManage}
                        >
                          {language.name}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-sm truncate text-sm text-gray-500 dark:text-gray-400">
                        {language.description}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {canManage && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            color="blue"
                            onClick={() => onOpenWorkspace(language.id)}
                          >
                            <HiExternalLink className="mr-1 size-4" />
                            Abrir panel
                          </Button>
                          {canEdit && (
                            <Button
                              size="sm"
                              color="light"
                              disabled={continuingId === language.id}
                              onClick={() => onContinueSetup(language.id)}
                            >
                              {continuingId === language.id ? (
                                "Revisando…"
                              ) : (
                                <>
                                  <HiArrowRight className="mr-1 size-4" />
                                  Continuar setup
                                </>
                              )}
                            </Button>
                          )}
                          {canEdit && (
                            <Button
                              size="sm"
                              color="light"
                              onClick={() => onEdit(language)}
                            >
                              <HiPencil className="mr-1 size-4" />
                              Editar
                            </Button>
                          )}
                          {canDelete && canEdit && (
                            <Button
                              size="sm"
                              color="failure"
                              className="bg-red-600 text-white hover:bg-red-700 enabled:hover:bg-red-700"
                              onClick={() => onDelete(language)}
                            >
                              <HiTrash className="mr-1 size-4" />
                              Eliminar
                            </Button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              color="light"
              size="sm"
            >
              Anterior
            </Button>
            <Button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              color="light"
              size="sm"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
