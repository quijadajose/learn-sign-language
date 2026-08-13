import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  TextInput,
  Label,
  Textarea,
  Spinner,
} from "flowbite-react";
import { HiExclamationCircle } from "react-icons/hi";
import type { Stage, StageFormData } from "./types";

interface StageModalsProps {
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;
  currentStage: Stage | null;
  formData: StageFormData;
  isSubmitting: boolean;
  isDeleting: boolean;
  onCloseAdd: () => void;
  onCloseEdit: () => void;
  onCloseDelete: () => void;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onAddSubmit: (e: React.FormEvent) => void;
  onEditSubmit: (e: React.FormEvent) => void;
  onDelete: () => void;
}

export default function StageModals({
  showAddModal,
  showEditModal,
  showDeleteModal,
  currentStage,
  formData,
  isSubmitting,
  isDeleting,
  onCloseAdd,
  onCloseEdit,
  onCloseDelete,
  onInputChange,
  onAddSubmit,
  onEditSubmit,
  onDelete,
}: StageModalsProps) {
  return (
    <>
      <Modal show={showDeleteModal} onClose={onCloseDelete} popup size="md">
        <ModalHeader />
        <ModalBody>
          <div className="text-center">
            <HiExclamationCircle className="mx-auto mb-4 size-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que quieres eliminar la etapa{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                "{currentStage?.name}"
              </span>
              ?
            </h3>
            <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
              Esta acción no se puede deshacer. Se eliminará permanentemente la
              etapa y todos sus datos asociados.
            </p>
            <div className="flex justify-center gap-4">
              <Button color="gray" onClick={onCloseDelete} disabled={isDeleting}>
                Cancelar
              </Button>
              <Button color="failure" onClick={onDelete} disabled={isDeleting}>
                {isDeleting && <Spinner size="sm" className="mr-2" />}
                {isDeleting ? "Eliminando..." : "Sí, eliminar"}
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>

      <Modal show={showAddModal} onClose={onCloseAdd} popup size="md">
        <ModalHeader />
        <ModalBody>
          <form onSubmit={onAddSubmit} className="space-y-6">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Añadir Nueva Etapa
            </h3>
            <div>
              <Label htmlFor="name">Nombre de la Etapa</Label>
              <TextInput
                id="name"
                name="name"
                value={formData.name}
                onChange={onInputChange}
                placeholder="Ej: Nivel Básico 1"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={onInputChange}
                placeholder="Describe brevemente el contenido o nivel de la etapa"
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button color="gray" onClick={onCloseAdd} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" color="blue" disabled={isSubmitting}>
                {isSubmitting && <Spinner size="sm" className="mr-2" />}
                {isSubmitting ? "Creando..." : "Crear Etapa"}
              </Button>
            </div>
          </form>
        </ModalBody>
      </Modal>

      <Modal show={showEditModal} onClose={onCloseEdit} popup size="md">
        <ModalHeader />
        <ModalBody>
          <form onSubmit={onEditSubmit} className="space-y-6">
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Editar Etapa
            </h3>
            <div>
              <Label htmlFor="edit-name">Nombre de la Etapa</Label>
              <TextInput
                id="edit-name"
                name="name"
                value={formData.name}
                onChange={onInputChange}
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descripción</Label>
              <Textarea
                id="edit-description"
                name="description"
                value={formData.description}
                onChange={onInputChange}
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                color="gray"
                onClick={onCloseEdit}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" color="success" disabled={isSubmitting}>
                {isSubmitting && <Spinner size="sm" className="mr-2" />}
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </ModalBody>
      </Modal>
    </>
  );
}
