import { useState, useEffect } from "react";
import {
  Button,
  Card,
  Label,
  Modal,
  Table,
  Textarea,
  Toast,
  Alert,
  Badge,
  Spinner,
} from "flowbite-react";
import { HiPlus, HiPencil, HiTrash, HiEye } from "react-icons/hi";
import Select, { SingleValue } from "react-select";
import AsyncSelect from "react-select/async";
import { regionApi, countryDivisionApi } from "../services/api";

interface Region {
  id: string;
  name: string;
  code: string;
  description: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Country {
  code: string;
  name: string;
}

interface Division {
  code: string;
  name: string;
  country: Country;
}

interface ToastMessage {
  id: number;
  type: "success" | "error";
  message: string;
}

interface SelectOption {
  value: string;
  label: string;
}

interface CountryOption extends SelectOption {
  data: Country;
}

interface DivisionOption extends SelectOption {
  data: Division;
}

export default function RegionManagement() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRegions, setTotalRegions] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [countries, setCountries] = useState<Country[]>([]);
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(
    null,
  );
  const [selectedDivision, setSelectedDivision] =
    useState<DivisionOption | null>(null);
  const [isCountryLocked, setIsCountryLocked] = useState(false);

  const [editSelectedCountry, setEditSelectedCountry] =
    useState<CountryOption | null>(null);
  const [editSelectedDivision, setEditSelectedDivision] =
    useState<DivisionOption | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  const [createForm, setCreateForm] = useState({
    name: "",
    code: "",
    description: "",
    isDefault: false,
  });

  const [editForm, setEditForm] = useState({
    name: "",
    code: "",
    description: "",
    isDefault: false,
  });

  const loadCountries = async () => {
    try {
      const response = await countryDivisionApi.getCountries();
      if (response.success) {
        setCountries(response.data);
        const options = response.data.map((country: Country) => ({
          value: country.code,
          label: country.name,
          data: country,
        }));
        setCountryOptions(options);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error loading countries:", error);
      }
    }
  };

  const loadDivisionsByLanguage = async () => {
    try {
      const languageId = localStorage.getItem("selectedLanguageId");

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"}/languages/${languageId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth")}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const language = await response.json();
        if (language.countryCode) {
          const country = countries.find(
            (c) => c.code === language.countryCode,
          );
          if (country) {
            const countryOption = {
              value: country.code,
              label: country.name,
              data: country,
            };
            setSelectedCountry(countryOption);
            setIsCountryLocked(true);
          }
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error loading divisions by language:", error);
      }
    }
  };

  const loadAllDivisions = async () => {
    if (!selectedCountry) {
      return;
    }

    try {
      const response = await countryDivisionApi.getDivisionsByCountry(
        selectedCountry.value,
      );
      if (response.success) {
        const divisionOptions = response.data.map((division: Division) => ({
          value: division.code,
          label: division.name,
          data: division,
        }));
        return divisionOptions;
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error loading divisions:", error);
      }
    }
    return [];
  };

  const loadDivisionOptions = async (
    inputValue: string,
  ): Promise<DivisionOption[]> => {
    if (!selectedCountry || inputValue.length < 2) {
      return [];
    }

    try {
      const response = await countryDivisionApi.searchDivisions({
        search: inputValue,
        countryCode: selectedCountry.value,
        limit: 10,
      });

      if (response.success) {
        return response.data.data.map((division: Division) => ({
          value: division.code,
          label: division.name,
          data: division,
        }));
      }
      return [];
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error searching divisions:", error);
      }
      return [];
    }
  };

  const handleCountryChange = async (
    selectedOption: SingleValue<CountryOption>,
  ) => {
    if (isCountryLocked) {
      return;
    }

    setSelectedCountry(selectedOption);
    setSelectedDivision(null);

    setCreateForm((prev) => ({
      ...prev,
      name: "",
      code: "",
    }));

    if (selectedOption) {
      await loadAllDivisions();
    }
  };

  const handleDivisionChange = (
    selectedOption: SingleValue<DivisionOption>,
  ) => {
    setSelectedDivision(selectedOption);

    if (selectedOption) {
      setCreateForm((prev) => ({
        ...prev,
        name: selectedOption.data.name,
        code: selectedOption.data.code,
      }));
    } else {
      setCreateForm((prev) => ({
        ...prev,
        name: "",
        code: "",
      }));
    }
  };

  const handleEditCountryChange = async () => {
    return;
  };

  const handleEditDivisionChange = (
    selectedOption: SingleValue<DivisionOption>,
  ) => {
    setEditSelectedDivision(selectedOption);

    if (selectedOption) {
      setEditForm((prev) => ({
        ...prev,
        name: selectedOption.data.name,
        code: selectedOption.data.code,
      }));
    } else {
      setEditForm((prev) => ({
        ...prev,
        name: "",
        code: "",
      }));
    }
  };

  const getSelectStyles = () => ({
    control: (base: any, state: any) => ({
      ...base,
      minHeight: "42px",
      border: `1px solid ${isDarkMode ? "#4b5563" : "#d1d5db"}`,
      borderRadius: "0.375rem",
      backgroundColor: isDarkMode ? "#374151" : "transparent",
      color: isDarkMode ? "#f3f4f6" : "inherit",
      "&:hover": {
        borderColor: isDarkMode ? "#6b7280" : "#9ca3af",
      },
      ...(state.isFocused && {
        borderColor: "#3b82f6",
        boxShadow: "0 0 0 1px #3b82f6",
      }),
    }),
    placeholder: (base: any) => ({
      ...base,
      color: isDarkMode ? "#9ca3af" : "#9ca3af",
    }),
    singleValue: (base: any) => ({
      ...base,
      color: isDarkMode ? "#f3f4f6" : "inherit",
    }),
    input: (base: any) => ({
      ...base,
      color: isDarkMode ? "#f3f4f6" : "inherit",
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: isDarkMode ? "#374151" : "white",
      border: `1px solid ${isDarkMode ? "#4b5563" : "#e5e7eb"}`,
      borderRadius: "0.375rem",
      boxShadow: isDarkMode
        ? "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)"
        : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected
        ? "#3b82f6"
        : state.isFocused
          ? isDarkMode
            ? "#4b5563"
            : "#f3f4f6"
          : "transparent",
      color: state.isSelected ? "white" : isDarkMode ? "#f3f4f6" : "inherit",
      "&:hover": {
        backgroundColor: state.isSelected
          ? "#3b82f6"
          : isDarkMode
            ? "#4b5563"
            : "#f3f4f6",
      },
    }),
  });

  const getSelectTheme = () => ({
    borderRadius: 6,
    spacing: {
      baseUnit: 4,
      controlHeight: 42,
      menuGutter: 8,
    },
    colors: {
      primary: "#3b82f6",
      primary75: "#60a5fa",
      primary50: "#93c5fd",
      primary25: "#dbeafe",
      danger: "#ef4444",
      dangerLight: "#fecaca",
      neutral0: isDarkMode ? "#374151" : "white",
      neutral5: isDarkMode ? "#1f2937" : "#f9fafb",
      neutral10: isDarkMode ? "#374151" : "#f3f4f6",
      neutral20: isDarkMode ? "#4b5563" : "#e5e7eb",
      neutral30: isDarkMode ? "#6b7280" : "#d1d5db",
      neutral40: isDarkMode ? "#9ca3af" : "#9ca3af",
      neutral50: isDarkMode ? "#d1d5db" : "#6b7280",
      neutral60: isDarkMode ? "#e5e7eb" : "#4b5563",
      neutral70: isDarkMode ? "#f3f4f6" : "#374151",
      neutral80: isDarkMode ? "#f9fafb" : "#1f2937",
      neutral90: isDarkMode ? "#ffffff" : "#111827",
    },
  });

  const addToast = (type: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const loadRegions = async () => {
    try {
      setLoading(true);
      setError(null);

      const languageId = localStorage.getItem("selectedLanguageId");

      const response = await regionApi.getRegions(
        currentPage,
        10,
        languageId || undefined,
      );

      if (response.success) {
        setRegions(response.data.data || []);
        setTotalRegions(response.data.total || 0);
        setTotalPages(Math.ceil((response.data.total || 0) / 10));
      } else {
        setError(response.message || "Error al cargar las regiones");
        addToast("error", response.message || "Error al cargar las regiones");
      }
    } catch (err) {
      const errorMessage = "Error de conexión al cargar las regiones";
      setError(errorMessage);
      addToast("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegions();
    loadCountries();
  }, [currentPage]);

  useEffect(() => {
    const handleLanguageChange = () => {
      loadRegions();
    };

    window.addEventListener("storage", (e) => {
      if (e.key === "selectedLanguageId") {
        handleLanguageChange();
      }
    });

    window.addEventListener("userDataUpdated", handleLanguageChange);

    return () => {
      window.removeEventListener("storage", handleLanguageChange);
      window.removeEventListener("userDataUpdated", handleLanguageChange);
    };
  }, []);

  useEffect(() => {
    if (countries.length > 0) {
      loadDivisionsByLanguage();
    }
  }, [countries]);

  useEffect(() => {
    const checkDarkMode = () => {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const handleCreateRegion = async () => {
    if (!selectedDivision) {
      addToast("error", "Debes seleccionar una división");
      return;
    }

    if (!createForm.description.trim()) {
      addToast("error", "La descripción es obligatoria");
      return;
    }

    const languageId = localStorage.getItem("selectedLanguageId");
    if (!languageId) {
      addToast("error", "No se encontró el idioma seleccionado");
      return;
    }

    try {
      setCreateLoading(true);
      const regionData = {
        ...createForm,
        languageId: languageId,
      };
      const response = await regionApi.createRegion(regionData);

      if (response.success) {
        addToast("success", "Región creada exitosamente");
        setIsCreateModalOpen(false);
        setCreateForm({
          name: "",
          code: "",
          description: "",
          isDefault: false,
        });
        setSelectedCountry(null);
        setSelectedDivision(null);
        loadRegions();
      } else {
        addToast("error", response.message || "Error al crear la región");
      }
    } catch (err) {
      addToast("error", "Error de conexión al crear la región");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditRegion = async () => {
    if (!selectedRegion) {
      addToast("error", "No se encontró la región a editar");
      return;
    }

    if (!editSelectedDivision) {
      addToast("error", "Debes seleccionar una división");
      return;
    }

    if (!editForm.description.trim()) {
      addToast("error", "La descripción es obligatoria");
      return;
    }

    try {
      setEditLoading(true);
      const response = await regionApi.updateRegion(
        selectedRegion.id,
        editForm,
      );

      if (response.success) {
        addToast("success", "Región actualizada exitosamente");
        setIsEditModalOpen(false);
        setSelectedRegion(null);
        loadRegions();
      } else {
        addToast("error", response.message || "Error al actualizar la región");
      }
    } catch (err) {
      addToast("error", "Error de conexión al actualizar la región");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteRegion = async () => {
    if (!selectedRegion) return;

    try {
      setDeleteLoading(true);
      const response = await regionApi.deleteRegion(selectedRegion.id);

      if (response.success) {
        addToast("success", "Región eliminada exitosamente");
        setIsDeleteModalOpen(false);
        setSelectedRegion(null);
        loadRegions();
      } else {
        addToast("error", response.message || "Error al eliminar la región");
      }
    } catch (err) {
      addToast("error", "Error de conexión al eliminar la región");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditModal = async (region: Region) => {
    setSelectedRegion(region);
    setEditForm({
      name: region.name,
      code: region.code,
      description: region.description,
      isDefault: region.isDefault,
    });

    await loadEditDivisionsByLanguage();

    setIsEditModalOpen(true);
  };

  const loadEditDivisionsByLanguage = async () => {
    try {
      const languageId = localStorage.getItem("selectedLanguageId");
      if (!languageId) {
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"}/languages/${languageId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth")}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const language = await response.json();
        if (language.countryCode) {
          const country = countries.find(
            (c) => c.code === language.countryCode,
          );
          if (country) {
            const countryOption = {
              value: country.code,
              label: country.name,
              data: country,
            };
            setEditSelectedCountry(countryOption);
          }
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error loading divisions by language for edit:", error);
      }
    }
  };

  const openDeleteModal = (region: Region) => {
    setSelectedRegion(region);
    setIsDeleteModalOpen(true);
  };

  const openViewModal = (region: Region) => {
    setSelectedRegion(region);
    setIsViewModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestión de Regiones
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra las regiones para variantes regionales del lenguaje de
            señas
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <HiPlus className="mr-2 h-4 w-4" />
          Nueva Región
        </Button>
      </div>

      {error && (
        <Alert color="failure" onDismiss={() => setError(null)}>
          <span className="font-medium">Error!</span> {error}
        </Alert>
      )}

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <Table.Head>
              <Table.HeadCell>Nombre</Table.HeadCell>
              <Table.HeadCell>Código</Table.HeadCell>
              <Table.HeadCell>Descripción</Table.HeadCell>
              <Table.HeadCell>Tipo</Table.HeadCell>
              <Table.HeadCell>Acciones</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {regions.map((region) => (
                <Table.Row
                  key={region.id}
                  className="bg-white dark:border-gray-700 dark:bg-gray-800"
                >
                  <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {region.name}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap text-gray-900 dark:text-white">
                    {region.code}
                  </Table.Cell>
                  <Table.Cell className="text-gray-900 dark:text-white">
                    {region.description.length > 50
                      ? `${region.description.substring(0, 50)}...`
                      : region.description}
                  </Table.Cell>
                  <Table.Cell>
                    {region.isDefault ? (
                      <Badge color="blue">Base</Badge>
                    ) : (
                      <Badge color="gray">Regional</Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        color="light"
                        onClick={() => openViewModal(region)}
                      >
                        <HiEye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        color="light"
                        onClick={() => openEditModal(region)}
                      >
                        <HiPencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        color="failure"
                        onClick={() => openDeleteModal(region)}
                      >
                        <HiTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-400">
              Mostrando {regions.length} de {totalRegions} regiones
            </div>
            <div className="flex space-x-2">
              <Button
                size="sm"
                color="light"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Anterior
              </Button>
              <span className="px-3 py-1 text-sm text-gray-700 dark:text-gray-400">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                size="sm"
                color="light"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        show={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setSelectedCountry(null);
          setSelectedDivision(null);
          setIsCountryLocked(false);
        }}
      >
        <Modal.Header>Crear Nueva Región</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-country" value="País" />
              <Select
                id="create-country"
                value={selectedCountry}
                onChange={handleCountryChange}
                options={countryOptions}
                placeholder="Seleccionar país..."
                isSearchable={!isCountryLocked}
                isClearable={!isCountryLocked}
                isDisabled={isCountryLocked}
                className="react-select-container"
                classNamePrefix="react-select"
                styles={getSelectStyles()}
                theme={getSelectTheme()}
              />
              {isCountryLocked && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  País seleccionado automáticamente basado en el idioma
                </p>
              )}
            </div>

            {selectedCountry && (
              <div>
                <Label htmlFor="create-division" value="División/Estado" />
                <AsyncSelect
                  id="create-division"
                  value={selectedDivision}
                  onChange={handleDivisionChange}
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
                  styles={getSelectStyles()}
                  theme={getSelectTheme()}
                />
              </div>
            )}

            {selectedDivision && (
              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>División seleccionada:</strong>{" "}
                  {selectedDivision.label} ({selectedDivision.value})
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="create-description" value="Descripción" />
              <Textarea
                id="create-description"
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                placeholder="Descripción de la región..."
                rows={3}
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="create-default"
                checked={createForm.isDefault}
                onChange={(e) =>
                  setCreateForm({ ...createForm, isDefault: e.target.checked })
                }
                className="mr-2"
              />
              <Label htmlFor="create-default" value="Región Nacional (Base)" />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={handleCreateRegion}
            disabled={createLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Crear Región
          </Button>
          <Button color="gray" onClick={() => setIsCreateModalOpen(false)}>
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditSelectedCountry(null);
          setEditSelectedDivision(null);
        }}
      >
        <Modal.Header>Editar Región</Modal.Header>
        <Modal.Body>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-country" value="País" />
              <Select
                id="edit-country"
                value={editSelectedCountry}
                onChange={handleEditCountryChange}
                options={countryOptions}
                placeholder="Seleccionar país..."
                isSearchable={false}
                isClearable={false}
                isDisabled={true}
                className="react-select-container"
                classNamePrefix="react-select"
                styles={getSelectStyles()}
                theme={getSelectTheme()}
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                País determinado por el idioma seleccionado (no se puede
                cambiar)
              </p>
            </div>

            {editSelectedCountry && (
              <div>
                <Label htmlFor="edit-division" value="División/Estado" />
                <AsyncSelect
                  id="edit-division"
                  value={editSelectedDivision}
                  onChange={handleEditDivisionChange}
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
                  styles={getSelectStyles()}
                  theme={getSelectTheme()}
                />
              </div>
            )}

            {editSelectedDivision && (
              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>División seleccionada:</strong>{" "}
                  {editSelectedDivision.label} ({editSelectedDivision.value})
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="edit-description" value="Descripción" />
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="Descripción de la región..."
                rows={3}
                required
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="edit-default"
                checked={editForm.isDefault}
                onChange={(e) =>
                  setEditForm({ ...editForm, isDefault: e.target.checked })
                }
                className="mr-2"
              />
              <Label htmlFor="edit-default" value="Región Nacional (Base)" />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={handleEditRegion}
            disabled={editLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {editLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Actualizar Región
          </Button>
          <Button color="gray" onClick={() => setIsEditModalOpen(false)}>
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={isViewModalOpen} onClose={() => setIsViewModalOpen(false)}>
        <Modal.Header>Detalles de la Región</Modal.Header>
        <Modal.Body>
          {selectedRegion && (
            <div className="space-y-4">
              <div>
                <Label value="Nombre" />
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedRegion.name}
                </p>
              </div>
              <div>
                <Label value="Código" />
                <p className="text-gray-900 dark:text-white">
                  {selectedRegion.code}
                </p>
              </div>
              <div>
                <Label value="Descripción" />
                <p className="text-gray-900 dark:text-white">
                  {selectedRegion.description}
                </p>
              </div>
              <div>
                <Label value="Tipo" />
                <p className="text-gray-900 dark:text-white">
                  {selectedRegion.isDefault
                    ? "Región Nacional (Base)"
                    : "Región Regional"}
                </p>
              </div>
              <div>
                <Label value="Fecha de Creación" />
                <p className="text-gray-900 dark:text-white">
                  {new Date(selectedRegion.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button color="gray" onClick={() => setIsViewModalOpen(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal
        show={isDeleteModalOpen}
        size="md"
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <Modal.Header>Confirmar Eliminación</Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              ¿Estás seguro de que quieres eliminar la región{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {selectedRegion?.name}
              </span>
              ?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Esta acción no se puede deshacer. Se eliminarán también todas las
              variantes regionales asociadas.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            color="failure"
            onClick={handleDeleteRegion}
            disabled={deleteLoading}
          >
            {deleteLoading ? <Spinner size="sm" className="mr-2" /> : null}
            Sí, eliminar
          </Button>
          <Button color="gray" onClick={() => setIsDeleteModalOpen(false)}>
            Cancelar
          </Button>
        </Modal.Footer>
      </Modal>

      <div className="fixed right-4 top-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id}>
            <div
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                toast.type === "success"
                  ? "bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200"
                  : "bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200"
              }`}
            >
              {toast.type === "success" ? "✓" : "✕"}
            </div>
            <div className="ml-3 text-sm font-normal">{toast.message}</div>
            <Toast.Toggle />
          </Toast>
        ))}
      </div>
    </div>
  );
}
