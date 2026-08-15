import { Button, Spinner } from "flowbite-react";
import {
  HiEye,
  HiPencilAlt,
  HiTrash,
  HiAcademicCap,
  HiGlobe,
  HiVideoCamera,
} from "react-icons/hi";
import { NavigateFunction } from "react-router-dom";
import { Lesson } from "./types";

interface LessonListTableProps {
  selectedLanguageId: string;
  lessons: Lesson[];
  lessonsLoading: boolean;
  viewLoading: boolean;
  editLoading: boolean;
  isDeleting: boolean;
  currentPage: number;
  totalPages: number;
  totalLessons: number;
  hasAnyPermissionForLanguage: (languageId: string) => boolean;
  hasLanguagePermission: (languageId: string) => boolean;
  formatDate: (dateString: string) => string;
  onViewClick: (lessonId: string) => void;
  onOpenEditModal: (lesson: Lesson) => void;
  onOpenVariantsModal: (lessonId: string) => void;
  onOpenDeleteModal: (lesson: Lesson) => void;
  onPageChange: (page: number) => void;
  navigate: NavigateFunction;
}

export default function LessonListTable({
  selectedLanguageId,
  lessons,
  lessonsLoading,
  viewLoading,
  editLoading,
  isDeleting,
  currentPage,
  totalPages,
  totalLessons,
  hasAnyPermissionForLanguage,
  hasLanguagePermission,
  formatDate,
  onViewClick,
  onOpenEditModal,
  onOpenVariantsModal,
  onOpenDeleteModal,
  onPageChange,
  navigate,
}: LessonListTableProps) {
  if (lessonsLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Spinner size="lg" aria-label="Cargando lecciones..." />
        <span className="ml-3 text-gray-600 dark:text-gray-400">
          Cargando lecciones...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {totalLessons} {totalLessons === 1 ? "lección" : "lecciones"}
      </p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Fecha Creación
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900/40">
            {lessons.map((lesson) => (
              <tr
                key={lesson.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {lesson.name}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="max-w-xs text-sm text-gray-500 dark:text-gray-400">
                    <div className="truncate" title={lesson.description}>
                      {lesson.description}
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(lesson.createdAt)}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      color="light"
                      onClick={() => onViewClick(lesson.id)}
                      disabled={viewLoading}
                    >
                      <HiEye className="mr-1.5 size-4" />
                      Ver
                    </Button>
                    {hasAnyPermissionForLanguage(
                      lesson.languageId || selectedLanguageId,
                    ) && (
                      <>
                        {hasLanguagePermission(
                          lesson.languageId || selectedLanguageId,
                        ) && (
                          <Button
                            size="sm"
                            color="light"
                            onClick={() => onOpenEditModal(lesson)}
                            disabled={editLoading}
                          >
                            <HiPencilAlt className="mr-1.5 size-4" />
                            Editar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          color="light"
                          onClick={() => onOpenVariantsModal(lesson.id)}
                        >
                          <HiGlobe className="mr-1.5 size-4" />
                          Variantes
                        </Button>
                        <Button
                          size="sm"
                          color="light"
                          title="Grabar señas en Sign Studio"
                          onClick={() => {
                            const languageId =
                              lesson.languageId || selectedLanguageId;
                            const params = new URLSearchParams({
                              lessonId: lesson.id,
                            });
                            if (languageId) {
                              params.set("languageId", languageId);
                            }
                            navigate(`/admin/sign-studio?${params.toString()}`);
                          }}
                        >
                          <HiVideoCamera className="mr-1.5 size-4" />
                          Señas
                        </Button>
                        <Button
                          size="sm"
                          color="light"
                          title="Quiz sin cámara (imágenes/video)"
                          onClick={() =>
                            navigate(`/admin/lessons/${lesson.id}/quizzes`)
                          }
                        >
                          <HiAcademicCap className="mr-1.5 size-4" />
                          Quiz
                        </Button>
                        {hasLanguagePermission(
                          lesson.languageId || selectedLanguageId,
                        ) && (
                          <Button
                            size="sm"
                            color="failure"
                            onClick={() => onOpenDeleteModal(lesson)}
                            disabled={isDeleting}
                            className="bg-red-600 text-white hover:bg-red-700 enabled:hover:bg-red-700"
                          >
                            <HiTrash className="mr-1.5 size-4" />
                            Eliminar
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {selectedLanguageId && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 p-3 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {lessons.length} de {totalLessons} lecciones
            </span>
            <div className="flex space-x-2">
              <Button
                size="sm"
                color="light"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
              >
                Anterior
              </Button>
              <span className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                size="sm"
                color="light"
                disabled={currentPage === totalPages}
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
