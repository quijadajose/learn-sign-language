import {
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  TextInput,
  Label,
  Textarea,
  Spinner,
  FileInput,
  HelperText,
} from "flowbite-react";
import { BACKEND_BASE_URL } from "../../config";
import { Language, LanguageForm, LanguageFormErrors } from "./types";
import { handleDragOver } from "./utils";

interface EditLanguageModalProps {
  show: boolean;
  editingLanguage: Language | null;
  editForm: LanguageForm;
  editFormErrors: LanguageFormErrors;
  onEditFormChange: (form: LanguageForm) => void;
  editSelectedFile: File | null;
  editPreviewUrl: string | null;
  imageTimestamp: number;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onFieldBlur: (field: "name" | "description") => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDrop: (e: React.DragEvent<HTMLLabelElement>) => void;
}

export default function EditLanguageModal({
  show,
  editingLanguage,
  editForm,
  editFormErrors,
  onEditFormChange,
  editSelectedFile,
  editPreviewUrl,
  imageTimestamp,
  isSubmitting,
  onClose,
  onSubmit,
  onFieldBlur,
  onFileChange,
  onFileDrop,
}: EditLanguageModalProps) {
  const nameError = Boolean(editFormErrors.name);
  const descriptionError = Boolean(editFormErrors.description);

  return (
    <Modal show={show} onClose={onClose} popup size="md">
      <ModalHeader />
      <ModalBody>
        <form onSubmit={onSubmit} className="space-y-6" noValidate>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white">
            Editar Idioma
          </h3>
          <div>
            <Label
              htmlFor="edit-name"
              className={nameError ? "text-red-600 dark:text-red-500" : undefined}
            >
              Nombre del Idioma *
            </Label>
            <TextInput
              id="edit-name"
              value={editForm.name}
              onChange={(e) =>
                onEditFormChange({ ...editForm, name: e.target.value })
              }
              onBlur={() => onFieldBlur("name")}
              color={nameError ? "failure" : undefined}
              disabled={isSubmitting}
            />
            {editFormErrors.name && (
              <HelperText color="failure">{editFormErrors.name}</HelperText>
            )}
          </div>
          <div>
            <Label
              htmlFor="edit-description"
              className={
                descriptionError ? "text-red-600 dark:text-red-500" : undefined
              }
            >
              Descripción *
            </Label>
            <Textarea
              id="edit-description"
              value={editForm.description}
              onChange={(e) =>
                onEditFormChange({ ...editForm, description: e.target.value })
              }
              onBlur={() => onFieldBlur("description")}
              rows={3}
              color={descriptionError ? "failure" : undefined}
              disabled={isSubmitting}
            />
            {editFormErrors.description && (
              <HelperText color="failure">
                {editFormErrors.description}
              </HelperText>
            )}
          </div>
          <div>
            <Label htmlFor="edit-image">Imagen (Opcional)</Label>
            <div className="mt-1 flex w-full items-center justify-center">
              <Label
                htmlFor="edit-dropzone-file"
                className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                onDrop={onFileDrop}
                onDragOver={handleDragOver}
              >
                <div className="flex flex-col items-center justify-center pb-6 pt-5">
                  <img
                    src={
                      editPreviewUrl ||
                      `${BACKEND_BASE_URL}/images/languages/${editingLanguage?.id}?size=original&v=${imageTimestamp}`
                    }
                    alt="Vista previa"
                    className="mb-3 h-12 w-20 rounded object-contain shadow-sm"
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (
                        editForm.countryCode &&
                        !target.src.includes("/flags/")
                      ) {
                        target.src = `/flags/${editForm.countryCode.toLowerCase()}.svg`;
                      } else {
                        target.style.display = "none";
                      }
                    }}
                  />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                </div>
                <FileInput
                  id="edit-dropzone-file"
                  className="hidden"
                  accept="image/*"
                  onChange={onFileChange}
                  disabled={isSubmitting}
                />
              </Label>
            </div>
            {editSelectedFile && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Archivo seleccionado: {editSelectedFile.name}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button color="gray" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              color="blue"
              disabled={isSubmitting}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isSubmitting && <Spinner size="sm" className="mr-2" aria-hidden="true" />}
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </ModalBody>
    </Modal>
  );
}
