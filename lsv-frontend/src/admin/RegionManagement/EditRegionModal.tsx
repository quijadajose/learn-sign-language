import {
  Button,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Textarea,
  Spinner,
} from "flowbite-react";
import AsyncSelect from "react-select/async";
import type { SingleValue } from "react-select";
import type { CountryOption, DivisionOption, RegionForm } from "./types";
import { getSelectStyles, getSelectTheme } from "./selectHelpers";

interface EditRegionModalProps {
  show: boolean;
  onClose: () => void;
  editSelectedCountry: CountryOption | null;
  editSelectedDivision: DivisionOption | null;
  onDivisionChange: (selectedOption: SingleValue<DivisionOption>) => void;
  loadEditDivisionOptions: (inputValue: string) => Promise<DivisionOption[]>;
  editForm: RegionForm;
  onEditFormChange: (form: RegionForm) => void;
  onSubmit: () => void;
  loading: boolean;
  isDarkMode: boolean;
  hasOtherBaseRegion: boolean;
}

export default function EditRegionModal({
  show,
  onClose,
  editSelectedCountry,
  editSelectedDivision,
  onDivisionChange,
  loadEditDivisionOptions,
  editForm,
  onEditFormChange,
  onSubmit,
  loading,
  isDarkMode,
  hasOtherBaseRegion,
}: EditRegionModalProps) {
  return (
    <Modal show={show} onClose={onClose}>
      <ModalHeader>Editar Región</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          {editSelectedCountry && (
            <div>
              <Label htmlFor="edit-division">División/Estado</Label>
              <AsyncSelect<DivisionOption>
                id="edit-division"
                value={editSelectedDivision}
                onChange={onDivisionChange}
                loadOptions={loadEditDivisionOptions}
                placeholder="Buscar división o estado..."
                isSearchable
                isClearable
                noOptionsMessage={() =>
                  "Escribe al menos 2 caracteres para buscar"
                }
                loadingMessage={() => "Buscando..."}
                className="react-select-container"
                classNamePrefix="react-select"
                styles={getSelectStyles<DivisionOption>(isDarkMode)}
                theme={getSelectTheme(isDarkMode)}
              />
            </div>
          )}

          <div>
            <Label htmlFor="edit-description">Descripción</Label>
            <Textarea
              id="edit-description"
              value={editForm.description}
              onChange={(e) =>
                onEditFormChange({ ...editForm, description: e.target.value })
              }
              placeholder="Descripción de la región..."
              rows={3}
              required
            />
          </div>
          {hasOtherBaseRegion ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ya existe otra región base para este idioma. Esta permanecerá
              como regional.
            </p>
          ) : (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="edit-default"
                checked={editForm.isDefault}
                onChange={(e) =>
                  onEditFormChange({ ...editForm, isDefault: e.target.checked })
                }
                className="mr-2"
              />
              <Label htmlFor="edit-default" className="flex items-center gap-1">
                Región base
                <span
                  title="Región por defecto del idioma. Solo puede haber una; los estudiantes se inscriben a través de ella."
                  className="inline-flex size-4 cursor-help items-center justify-center rounded-full text-xs font-semibold text-gray-400 ring-1 ring-current hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Más información"
                >
                  ?
                </span>
              </Label>
            </div>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          onClick={onSubmit}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? <Spinner size="sm" className="mr-2" /> : null}
          Actualizar Región
        </Button>
        <Button color="gray" onClick={onClose}>
          Cancelar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
