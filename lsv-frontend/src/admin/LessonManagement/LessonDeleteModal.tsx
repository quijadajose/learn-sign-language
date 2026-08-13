import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  Spinner,
} from "flowbite-react";
import { HiExclamationCircle } from "react-icons/hi";
import { Lesson } from "./types";

interface LessonDeleteModalProps {
  show: boolean;
  deletingLesson: Lesson | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LessonDeleteModal({
  show,
  deletingLesson,
  isDeleting,
  onClose,
  onConfirm,
}: LessonDeleteModalProps) {
  return (
    <Modal show={show} onClose={onClose} popup size="md">
      <ModalHeader />
      <ModalBody>
        <div className="text-center">
          <HiExclamationCircle className="mx-auto mb-4 size-14 text-red-500 dark:text-red-400" />
          <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
            ¿Estás seguro de que quieres eliminar la lección{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              "{deletingLesson?.name}"
            </span>
            ?
          </h3>
          <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
            Esta acción no se puede deshacer. Se eliminará permanentemente la
            lección y sus datos asociados.
          </p>
          <div className="flex justify-center gap-4">
            <Button color="light" onClick={onClose} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button
              color="failure"
              onClick={onConfirm}
              disabled={isDeleting}
              className="bg-red-600 text-white hover:bg-red-700 enabled:hover:bg-red-700"
            >
              {isDeleting && <Spinner size="sm" className="mr-2" />}
              {isDeleting ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
