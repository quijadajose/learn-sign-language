import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
} from "flowbite-react";
import { HiExclamationCircle } from "react-icons/hi";
import { ModeratorPermission } from "./types";

interface DeletePermissionModalProps {
  show: boolean;
  isDeleting: boolean;
  deletingPermission: ModeratorPermission | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeletePermissionModal({
  show,
  isDeleting,
  deletingPermission,
  onClose,
  onConfirm,
}: DeletePermissionModalProps) {
  return (
    <Modal show={show} onClose={onClose} size="md">
      <ModalHeader>Revocar Permiso</ModalHeader>
      <ModalBody>
        <div className="text-center">
          <HiExclamationCircle className="mx-auto mb-4 size-14 text-red-500 dark:text-red-400" />
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
      </ModalBody>
      <ModalFooter>
        <Button color="light" onClick={onClose} disabled={isDeleting}>
          Cancelar
        </Button>
        <Button
          color="failure"
          onClick={onConfirm}
          disabled={isDeleting}
          className="bg-red-600 text-white hover:bg-red-700 enabled:hover:bg-red-700"
        >
          {isDeleting && <Spinner size="sm" className="mr-2" aria-hidden="true" />}
          {isDeleting ? "Revocando..." : "Sí, revocar"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
