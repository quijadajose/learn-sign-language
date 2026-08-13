import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
} from "flowbite-react";
import QuillEditor from "../../components/QuillEditor";
import { formatDateShort } from "../../utils/formatDate";
import { LessonDetail } from "./types";

interface LessonViewModalProps {
  show: boolean;
  viewLoading: boolean;
  selectedLesson: LessonDetail | null;
  quillModules: Record<string, unknown>;
  quillFormats: string[];
  onClose: () => void;
}

export default function LessonViewModal({
  show,
  viewLoading,
  selectedLesson,
  quillModules,
  quillFormats,
  onClose,
}: LessonViewModalProps) {
  return (
    <Modal show={show} onClose={onClose} size="5xl">
      <ModalHeader>
        <div className="flex w-full items-center justify-between">
          <h3 className="text-xl font-medium text-gray-900 dark:text-white">
            Detalles de la Lección
          </h3>
        </div>
      </ModalHeader>
      <ModalBody className="max-h-[min(70vh,40rem)] overflow-y-auto">
        {viewLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Spinner size="lg" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Cargando detalles...
            </span>
          </div>
        ) : selectedLesson ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div>
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Etapa
                </span>
                <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
                  {selectedLesson.stage?.name ?? "—"}
                </p>
              </div>
              <div>
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre
                </span>
                <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
                  {selectedLesson.name}
                </p>
              </div>
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Descripción
              </span>
              <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
                {selectedLesson.description}
              </p>
            </div>

            <div>
              <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Contenido
              </span>
              <QuillEditor
                value={selectedLesson.content}
                readOnly={true}
                modules={quillModules}
                formats={quillFormats}
                theme="snow"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
              <div>
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fecha de Creación
                </span>
                <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
                  {formatDateShort(selectedLesson.createdAt)}
                </p>
              </div>
              <div>
                <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Última Actualización
                </span>
                <p className="rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-900 dark:bg-gray-700 dark:text-white">
                  {formatDateShort(selectedLesson.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <span className="text-gray-500 dark:text-gray-400">
              No se pudieron cargar los detalles de la lección
            </span>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <div className="flex w-full justify-end">
          <Button color="gray" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
