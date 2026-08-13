import {
  Button,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "flowbite-react";
import type { Region } from "./types";

interface ViewRegionModalProps {
  show: boolean;
  onClose: () => void;
  region: Region | null;
}

export default function ViewRegionModal({
  show,
  onClose,
  region,
}: ViewRegionModalProps) {
  return (
    <Modal show={show} onClose={onClose}>
      <ModalHeader>Detalles de la Región</ModalHeader>
      <ModalBody>
        {region && (
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <p className="font-medium text-gray-900 dark:text-white">
                {region.name}
              </p>
            </div>
            <div>
              <Label>Código</Label>
              <p className="text-gray-900 dark:text-white">{region.code}</p>
            </div>
            <div>
              <Label>Descripción</Label>
              <p className="text-gray-900 dark:text-white">
                {region.description}
              </p>
            </div>
            <div>
              <Label>Tipo</Label>
              <p className="text-gray-900 dark:text-white">
                {region.isDefault
                  ? "Región base"
                  : "Región Regional"}
              </p>
            </div>
            <div>
              <Label>Fecha de Creación</Label>
              <p className="text-gray-900 dark:text-white">
                {new Date(region.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="gray" onClick={onClose}>
          Cerrar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
