import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
} from "flowbite-react";
import type { Region } from "./types";

interface DeleteRegionModalProps {
  show: boolean;
  onClose: () => void;
  region: Region | null;
  onConfirm: () => void;
  loading: boolean;
}

export default function DeleteRegionModal({
  show,
  onClose,
  region,
  onConfirm,
  loading,
}: DeleteRegionModalProps) {
  return (
    <Modal show={show} size="md" onClose={onClose}>
      <ModalHeader>Confirmar Eliminación</ModalHeader>
      <ModalBody>
        <div className="text-center">
          <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
            ¿Estás seguro de que quieres eliminar la región{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {region?.name}
            </span>
            ?
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Esta acción no se puede deshacer. Se eliminarán también todas las
            variantes regionales asociadas.
          </p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="failure" onClick={onConfirm} disabled={loading}>
          {loading ? <Spinner size="sm" className="mr-2" /> : null}
          Sí, eliminar
        </Button>
        <Button color="gray" onClick={onClose}>
          Cancelar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
