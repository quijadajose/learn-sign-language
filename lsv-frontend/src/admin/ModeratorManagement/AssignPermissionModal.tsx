import { useEffect, useState } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Label,
  Select,
  Button,
  Spinner,
} from "flowbite-react";
import AsyncSelect from "react-select/async";
import { SingleValue } from "react-select";
import { PermissionScope } from "../../types/user";
import {
  getSelectStyles,
  getSelectTheme,
} from "../RegionManagement/selectHelpers";
import {
  Language,
  loadUserOptions,
  Region,
  UserSelectOption,
} from "./types";

interface AssignPermissionModalProps {
  show: boolean;
  isSubmitting: boolean;
  selectedUser: UserSelectOption | null;
  selectedScope: PermissionScope | "";
  selectedTargetId: string;
  selectedLanguageId: string;
  languages: Language[];
  regions: Region[];
  onClose: () => void;
  onSubmit: () => void;
  onUserChange: (option: SingleValue<UserSelectOption>) => void;
  onScopeChange: (scope: PermissionScope) => void;
  onTargetIdChange: (targetId: string) => void;
  onLanguageIdChange: (languageId: string) => void;
}

export default function AssignPermissionModal({
  show,
  isSubmitting,
  selectedUser,
  selectedScope,
  selectedTargetId,
  selectedLanguageId,
  languages,
  regions,
  onClose,
  onSubmit,
  onUserChange,
  onScopeChange,
  onTargetIdChange,
  onLanguageIdChange,
}: AssignPermissionModalProps) {
  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <Modal show={show} onClose={onClose} size="md">
      <ModalHeader>Invitar moderador</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Elige un usuario registrado y el alcance: todo un lenguaje o solo
            una región.
          </p>
          <div>
            <Label htmlFor="user-select">Usuario</Label>
            <AsyncSelect
              id="user-select"
              value={selectedUser}
              onChange={onUserChange}
              loadOptions={loadUserOptions}
              placeholder="Escribe para buscar por email o nombre..."
              isClearable
              isDisabled={isSubmitting}
              noOptionsMessage={({ inputValue }) =>
                inputValue.length < 2
                  ? "Escribe al menos 2 caracteres para buscar"
                  : "No se encontraron usuarios"
              }
              loadingMessage={() => "Buscando usuarios..."}
              defaultOptions={false}
              cacheOptions={false}
              className="react-select-container"
              classNamePrefix="react-select"
              styles={getSelectStyles<UserSelectOption>(isDarkMode)}
              theme={getSelectTheme(isDarkMode)}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Escribe el email o nombre del usuario para buscar (mínimo 2
              caracteres)
            </p>
          </div>

          <div>
            <Label htmlFor="scope">Alcance</Label>
            <Select
              id="scope"
              value={selectedScope}
              onChange={(e) =>
                onScopeChange(e.target.value as PermissionScope)
              }
              disabled={isSubmitting || !selectedUser}
            >
              <option value="">Selecciona un alcance</option>
              <option value="language">Lenguaje completo</option>
              <option value="region">Solo una región</option>
            </Select>
          </div>

          {selectedScope === "language" && (
            <div>
              <Label htmlFor="language-select">Lenguaje</Label>
              <Select
                id="language-select"
                value={selectedTargetId}
                onChange={(e) => onTargetIdChange(e.target.value)}
                disabled={isSubmitting || !selectedUser}
              >
                <option value="">Selecciona un lenguaje</option>
                {languages.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {selectedScope === "region" && (
            <>
              <div>
                <Label htmlFor="language-for-region-select">Lenguaje</Label>
                <Select
                  id="language-for-region-select"
                  value={selectedLanguageId}
                  onChange={(e) => {
                    onLanguageIdChange(e.target.value);
                    onTargetIdChange("");
                  }}
                  disabled={isSubmitting || !selectedUser}
                >
                  <option value="">Selecciona un lenguaje primero</option>
                  {languages.map((language) => (
                    <option key={language.id} value={language.id}>
                      {language.name}
                    </option>
                  ))}
                </Select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Primero selecciona el lenguaje para ver sus regiones
                </p>
              </div>
              {selectedLanguageId && (
                <div>
                  <Label htmlFor="region-select">Región</Label>
                  <Select
                    id="region-select"
                    value={selectedTargetId}
                    onChange={(e) => onTargetIdChange(e.target.value)}
                    disabled={
                      isSubmitting || !selectedUser || !selectedLanguageId
                    }
                  >
                    <option value="">Selecciona una región</option>
                    {regions.flatMap((region) =>
                      region.languageId === selectedLanguageId ? (
                        <option key={region.id} value={region.id}>
                          {region.name}
                        </option>
                      ) : (
                        []
                      ),
                    )}
                  </Select>
                </div>
              )}
            </>
          )}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button color="light" onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          color="blue"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={onSubmit}
          disabled={
            isSubmitting || !selectedUser || !selectedScope || !selectedTargetId
          }
        >
          {isSubmitting && <Spinner size="sm" className="mr-2" aria-hidden="true" />}
          Asignar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
