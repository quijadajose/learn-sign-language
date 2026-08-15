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
import Select from "react-select";
import {
  getSelectStyles,
  getSelectTheme,
} from "../RegionManagement/selectHelpers";
import {
  Country,
  CountryOption,
  LanguageForm,
  LanguageFormErrors,
} from "./types";
import { handleDragOver } from "./utils";

interface AddLanguageModalProps {
  show: boolean;
  addForm: LanguageForm;
  addFormErrors: LanguageFormErrors;
  onAddFormChange: (form: LanguageForm) => void;
  selectedCountry: CountryOption | null;
  onCountryChange: (selectedOption: CountryOption | null) => void;
  countries: Country[];
  onSearchCountries: (searchTerm: string) => void;
  loadingCountries: boolean;
  selectedFile: File | null;
  addPreviewUrl: string | null;
  isAdding: boolean;
  isDark: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFieldBlur: (field: "countryCode" | "name" | "description") => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileDrop: (e: React.DragEvent<HTMLLabelElement>) => void;
}

function formatOptionLabel({ label, value }: CountryOption) {
  return (
    <div className="flex items-center">
      <img
        src={`/flags/${value.toLowerCase()}.svg`}
        alt=""
        className="mr-2 h-4 w-6 rounded-sm object-contain"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
      <span className="text-gray-900 dark:text-white">{label}</span>
    </div>
  );
}

export default function AddLanguageModal({
  show,
  addForm,
  addFormErrors,
  onAddFormChange,
  selectedCountry,
  onCountryChange,
  countries,
  onSearchCountries,
  loadingCountries,
  selectedFile,
  addPreviewUrl,
  isAdding,
  isDark,
  onClose,
  onSubmit,
  onNameChange,
  onFieldBlur,
  onFileChange,
  onFileDrop,
}: AddLanguageModalProps) {
  const countryError = Boolean(addFormErrors.countryCode);
  const nameError = Boolean(addFormErrors.name);
  const descriptionError = Boolean(addFormErrors.description);
  const baseSelectStyles = getSelectStyles<CountryOption>(isDark);
  const countrySelectStyles = {
    ...baseSelectStyles,
    control: (
      base: Parameters<NonNullable<typeof baseSelectStyles.control>>[0],
      state: Parameters<NonNullable<typeof baseSelectStyles.control>>[1],
    ) => ({
      ...baseSelectStyles.control!(base, state),
      ...(countryError && {
        borderColor: "#f05252",
        boxShadow: "0 0 0 1px #f05252",
        "&:hover": { borderColor: "#f05252" },
      }),
    }),
    menu: (
      base: Parameters<NonNullable<typeof baseSelectStyles.menu>>[0],
      state: Parameters<NonNullable<typeof baseSelectStyles.menu>>[1],
    ) => ({
      ...baseSelectStyles.menu!(base, state),
      zIndex: 60,
    }),
  };

  return (
    <Modal show={show} onClose={onClose} popup size="md">
      <ModalHeader />
      <ModalBody>
        <form onSubmit={onSubmit} className="space-y-6" noValidate>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white">
            Añadir Nuevo Idioma
          </h3>
          <div>
            <Label
              htmlFor="add-country"
              className={countryError ? "text-red-600 dark:text-red-500" : undefined}
            >
              País *
            </Label>
            <Select
              id="add-country"
              value={selectedCountry}
              onChange={onCountryChange}
              onBlur={() => onFieldBlur("countryCode")}
              onInputChange={(inputValue, { action }) => {
                if (action === "input-change") {
                  onSearchCountries(inputValue);
                }
              }}
              options={countries.map((country) => ({
                value: country.code,
                label: country.name,
              }))}
              placeholder="Busca y selecciona un país..."
              isClearable
              isLoading={loadingCountries}
              isDisabled={isAdding}
              isSearchable
              noOptionsMessage={() =>
                "Escribe al menos 2 caracteres para buscar países"
              }
              loadingMessage={() => "Buscando países..."}
              className="react-select-container"
              classNamePrefix="react-select"
              aria-invalid={countryError}
              formatOptionLabel={(option) =>
                formatOptionLabel(option as CountryOption)
              }
              styles={countrySelectStyles}
              theme={getSelectTheme(isDark)}
            />
            {addFormErrors.countryCode && (
              <HelperText color="failure" className="mt-1">
                {addFormErrors.countryCode}
              </HelperText>
            )}
          </div>
          <div>
            <Label
              htmlFor="add-name"
              className={nameError ? "text-red-600 dark:text-red-500" : undefined}
            >
              Nombre del Idioma *
            </Label>
            <TextInput
              id="add-name"
              value={addForm.name}
              onChange={onNameChange}
              onBlur={() => onFieldBlur("name")}
              placeholder="Ej: Lenguaje de señas Chileno"
              color={nameError ? "failure" : undefined}
              disabled={isAdding}
            />
            {addFormErrors.name && (
              <HelperText color="failure">{addFormErrors.name}</HelperText>
            )}
          </div>
          <div>
            <Label
              htmlFor="add-description"
              className={
                descriptionError ? "text-red-600 dark:text-red-500" : undefined
              }
            >
              Descripción *
            </Label>
            <Textarea
              id="add-description"
              value={addForm.description}
              onChange={(e) =>
                onAddFormChange({ ...addForm, description: e.target.value })
              }
              onBlur={() => onFieldBlur("description")}
              placeholder="Describe brevemente el idioma"
              rows={3}
              color={descriptionError ? "failure" : undefined}
              disabled={isAdding}
            />
            {addFormErrors.description && (
              <HelperText color="failure">
                {addFormErrors.description}
              </HelperText>
            )}
          </div>
          <div>
            <Label htmlFor="add-image">Imagen (Opcional)</Label>
            <div className="mt-1 flex w-full items-center justify-center">
              <Label
                htmlFor="dropzone-file"
                className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                onDrop={onFileDrop}
                onDragOver={handleDragOver}
              >
                <div className="flex flex-col items-center justify-center pb-6 pt-5">
                  {selectedFile || addForm.countryCode ? (
                    <img
                      src={
                        addPreviewUrl ||
                        `/flags/${addForm.countryCode.toLowerCase()}.svg`
                      }
                      alt="Vista previa"
                      className="mb-3 h-12 w-20 rounded object-contain shadow-sm"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <svg
                      className="mb-4 size-8 text-gray-500 dark:text-gray-400"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 20 16"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                      />
                    </svg>
                  )}
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                </div>
                <FileInput
                  id="dropzone-file"
                  className="hidden"
                  accept="image/*"
                  onChange={onFileChange}
                  disabled={isAdding}
                />
              </Label>
            </div>
            {selectedFile && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Archivo seleccionado: {selectedFile.name}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button color="gray" onClick={onClose} disabled={isAdding}>
              Cancelar
            </Button>
            <Button
              type="submit"
              color="blue"
              disabled={isAdding}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {isAdding && <Spinner size="sm" className="mr-2" aria-hidden="true" />}
              {isAdding ? "Creando..." : "Crear Idioma"}
            </Button>
          </div>
        </form>
      </ModalBody>
    </Modal>
  );
}
