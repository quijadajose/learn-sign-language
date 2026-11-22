import { Button, Modal, ModalHeader, ModalBody, Spinner } from "flowbite-react";
import { HiExclamationCircle } from "react-icons/hi";
import { Language, LanguageDeletionImpact } from "./types";

interface DeleteLanguageModalProps {
  show: boolean;
  deletingLanguage: Language | null;
  isDeleting: boolean;
  deletionImpact: LanguageDeletionImpact | null;
  loadingImpact: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteLanguageModal({
  show,
  deletingLanguage,
  isDeleting,
  deletionImpact,
  loadingImpact,
  onClose,
  onConfirm,
}: DeleteLanguageModalProps) {
  return (
    <Modal show={show} onClose={onClose} popup size="md">
      <ModalHeader />
      <ModalBody>
        <div className="text-center">
          <HiExclamationCircle className="mx-auto mb-4 size-14 text-gray-400 dark:text-gray-200" />
          <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
            ¿Estás seguro de que quieres eliminar el idioma{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              "{deletingLanguage?.name}"
            </span>
            ?
          </h3>
          <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
            Esta acción no se puede deshacer. Se eliminará permanentemente el
            idioma y todos sus datos asociados.
          </p>
          {loadingImpact ? (
            <p className="mb-5 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              <Spinner size="sm" className="mr-2" aria-hidden="true" />
              Calculando el contenido que se perderá...
            </p>
          ) : deletionImpact ? (
            <ul className="mb-5 space-y-1 text-sm text-gray-700 dark:text-gray-200">
              <li>Etapas que se eliminarán: {deletionImpact.stages}</li>
              <li>Lecciones que se eliminarán: {deletionImpact.lessons}</li>
              <li>Quizzes que se eliminarán: {deletionImpact.quizzes}</li>
              <li>
                Señas que quedarán sin idioma (no se borran):{" "}
                {deletionImpact.signs}
              </li>
            </ul>
          ) : (
            <p className="mb-5 text-sm text-red-600 dark:text-red-400">
              No se pudo calcular el contenido que se perderá. Revisa antes de
              confirmar.
            </p>
          )}
          <div className="flex justify-center gap-4">
            <Button color="gray" onClick={onClose} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button
              color="failure"
              onClick={onConfirm}
              disabled={isDeleting || loadingImpact}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting && <Spinner size="sm" className="mr-2" aria-hidden="true" />}
              {isDeleting ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
