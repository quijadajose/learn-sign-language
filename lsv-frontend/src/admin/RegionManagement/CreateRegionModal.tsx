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
import Select from "react-select";
import AsyncSelect from "react-select/async";
import type { SingleValue } from "react-select";
import type {
  CountryOption,
  DivisionOption,
  LanguageListItem,
  LanguageOption,
  RegionForm,
} from "./types";
import { getSelectStyles, getSelectTheme } from "./selectHelpers";

interface CreateRegionModalProps {
  show: boolean;
  onClose: () => void;
  allLanguages: LanguageListItem[];
  selectedLanguageOption: LanguageOption | null;
  onLanguageChange: (
    selectedOption: SingleValue<LanguageOption>,
  ) => void | Promise<void>;
  selectedCountry: CountryOption | null;
  selectedDivision: DivisionOption | null;
  onDivisionChange: (selectedOption: SingleValue<DivisionOption>) => void;
  loadDivisionOptions: (inputValue: string) => Promise<DivisionOption[]>;
  createForm: RegionForm;
  onCreateFormChange: (form: RegionForm) => void;
  onSubmit: () => void;
  loading: boolean;
  isDarkMode: boolean;
  languageHasBaseRegion: boolean;
}

export default function CreateRegionModal({
  show,
  onClose,
  allLanguages,
  selectedLanguageOption,
  onLanguageChange,
  selectedCountry,
  selectedDivision,
  onDivisionChange,
  loadDivisionOptions,
  createForm,
  onCreateFormChange,
  onSubmit,
  loading,
  isDarkMode,
  languageHasBaseRegion,
}: CreateRegionModalProps) {
  return (
    <Modal show={show} onClose={onClose}>
      <ModalHeader>Crear Nueva Región</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <div>
            <Label htmlFor="create-language">Idioma / Lengua de Señas</Label>
            <Select<LanguageOption>
              id="create-language"
              value={selectedLanguageOption}
              onChange={onLanguageChange}
              options={allLanguages.map((lang) => ({
                value: lang.id,
                label: lang.name,
                countryCode: lang.countryCode ?? "",
              }))}
              placeholder="Seleccionar idioma..."
              isSearchable
              isClearable
              className="react-select-container"
              classNamePrefix="react-select"
              formatOptionLabel={(option: LanguageOption) => (
                <div className="flex items-center">
                  <img
                    src={`/flags/${option.countryCode.toLowerCase()}.svg`}
                    alt=""
                    className="mr-2 h-4 w-6 rounded-sm object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <span className="text-gray-900 dark:text-white">
                    {option.label}
                  </span>
                </div>
              )}
              styles={getSelectStyles<LanguageOption>(isDarkMode)}
              theme={getSelectTheme(isDarkMode)}
            />
          </div>

          {selectedCountry && (
            <div>
              <Label htmlFor="create-division">División/Estado</Label>
              <AsyncSelect<DivisionOption>
                id="create-division"
                value={selectedDivision}
                onChange={onDivisionChange}
                loadOptions={loadDivisionOptions}
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
            <Label htmlFor="create-description">Descripción</Label>
            <Textarea
              id="create-description"
              value={createForm.description}
              onChange={(e) =>
                onCreateFormChange({
                  ...createForm,
                  description: e.target.value,
                })
              }
              placeholder="Descripción de la región..."
              rows={3}
              required
            />
          </div>
          {languageHasBaseRegion ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ya existe una región base para este idioma. Esta se creará como
              regional.
            </p>
          ) : (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="create-default"
                checked={createForm.isDefault}
                onChange={(e) =>
                  onCreateFormChange({
                    ...createForm,
                    isDefault: e.target.checked,
                  })
                }
                className="mr-2"
              />
              <Label htmlFor="create-default" className="flex items-center gap-1">
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
          {loading ? <Spinner size="sm" className="mr-2" aria-hidden="true" /> : null}
          Crear Región
        </Button>
        <Button color="gray" onClick={onClose}>
          Cancelar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
