import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Label,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Table,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
  Textarea,
  Toast,
  ToastToggle,
  Alert,
  Badge,
  Spinner,
} from "flowbite-react";
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiEye,
  HiChevronDown,
  HiChevronRight,
} from "react-icons/hi";
import Select, { SingleValue } from "react-select";
import AsyncSelect from "react-select/async";
import { regionApi, countryDivisionApi, adminApi } from "../services/api";
import { usePermissions } from "../hooks/usePermissions";
import { useLocalStorage } from "../hooks/useLocalStorage";

interface Region {
  id: string;
  name: string;
  code: string;
  description: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  divisionCode?: string;
  language?: {
    id: string;
    name: string;
    countryCode: string;
  };
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

interface GroupedRegion {
  countryCode: string;
  countryName: string;
  languages: {
    languageId: string;
    languageName: string;
    regions: Region[];
  }[];
}

export default function RegionManagement() {
  const { hasRegionPermission, hasLanguagePermission, isAdmin } =
    usePermissions();
  const [selectedLanguageId] = useLocalStorage<string | null>(
    "selectedLanguageId",
    null,
  );
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalRegions, setTotalRegions] = useState(0);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set(),
  );
  const [expandedLanguages, setExpandedLanguages] = useState<Set<string>>(
    new Set(),
  );

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
      if (!selectedLanguageId) {
        return;
      }

      const response = await adminApi.getLanguage(selectedLanguageId);

      if (response.success && response.data) {
        const language = response.data;
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

  const loadEditDivisionOptions = async (
    inputValue: string,
  ): Promise<DivisionOption[]> => {
    if (!editSelectedCountry || inputValue.length < 2) {
      return [];
    }

    try {
      const response = await countryDivisionApi.searchDivisions({
        search: inputValue,
        countryCode: editSelectedCountry.value,
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
        console.error("Error searching divisions for edit:", error);
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

      const languageId = isAdmin ? undefined : selectedLanguageId;

      // Cargar todas las regiones haciendo paginación hasta obtener todas
      let allRegions: Region[] = [];
      let currentPage = 1;
      const pageSize = 100;
      let hasMore = true;
      let total = 0;

      while (hasMore) {
        const response = await regionApi.getRegions(
          currentPage,
          pageSize,
          languageId || undefined,
        );

        if (response.success && response.data) {
          const pageData = response.data.data || [];
          allRegions = [...allRegions, ...pageData];
          total = response.data.total || 0;

          // Si hay más páginas, continuar cargando
          const totalPages = Math.ceil(total / pageSize);
          hasMore = currentPage < totalPages;
          currentPage++;
        } else {
          hasMore = false;
          if (!response.success) {
            setError(response.message || "Error al cargar las regiones");
            addToast(
              "error",
              response.message || "Error al cargar las regiones",
            );
          }
        }
      }

      setRegions(allRegions);
      setTotalRegions(total);
    } catch (err) {
      const errorMessage = "Error de conexión al cargar las regiones";
      setError(errorMessage);
      addToast("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Función para agrupar regiones por país e idioma
  const groupRegionsByCountryAndLanguage = (): GroupedRegion[] => {
    const grouped = new Map<string, GroupedRegion>();

    regions.forEach((region) => {
      if (!region.language) return;

      const hasCountry = !!region.language!.countryCode;
      // Si tiene país, agrupamos por código de país. Si no, usamos el ID del idioma (pseudopaís)
      const groupKey = hasCountry
        ? region.language!.countryCode
        : region.language!.id;

      let groupName = "";
      if (hasCountry) {
        const country = countries.find(
          (c) => c.code === region.language!.countryCode,
        );
        groupName = country?.name || region.language!.countryCode;
      } else {
        groupName = region.language!.name;
      }

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          countryCode: groupKey,
          countryName: groupName,
          languages: [],
        });
      }

      const countryGroup = grouped.get(groupKey)!;
      let languageGroup = countryGroup.languages.find(
        (l) => l.languageId === region.language!.id,
      );

      if (!languageGroup) {
        languageGroup = {
          languageId: region.language!.id,
          languageName: region.language!.name,
          regions: [],
        };
        countryGroup.languages.push(languageGroup);
      }

      languageGroup.regions.push(region);
    });

    // Ordenar idiomas dentro de cada país
    grouped.forEach((countryGroup) => {
      countryGroup.languages.sort((a, b) =>
        a.languageName.localeCompare(b.languageName),
      );
    });

    // Ordenar por nombre de grupo (País o Idioma)
    return Array.from(grouped.values()).sort((a, b) =>
      a.countryName.localeCompare(b.countryName),
    );
  };

  const toggleCountry = (countryCode: string) => {
    setExpandedCountries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(countryCode)) {
        newSet.delete(countryCode);
      } else {
        newSet.add(countryCode);
      }
      return newSet;
    });
  };

  const toggleLanguage = (languageKey: string) => {
    setExpandedLanguages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(languageKey)) {
        newSet.delete(languageKey);
      } else {
        newSet.add(languageKey);
      }
      return newSet;
    });
  };

  const groupedRegions = groupRegionsByCountryAndLanguage();

  useEffect(() => {
    loadRegions();
    loadCountries();
  }, []);

  // Expandir todos los países por defecto cuando se cargan las regiones
  // Solo expandir idiomas si hay múltiples idiomas por país
  useEffect(() => {
    if (regions.length > 0 && countries.length > 0) {
      const countrySet = new Set<string>();
      const languageSet = new Set<string>();

      // Agrupar regiones por país para ver cuántos idiomas hay por país
      const languagesByCountry = new Map<string, Set<string>>();

      regions.forEach((region) => {
        if (region.language) {
          const countryCode = region.language.countryCode;
          countrySet.add(countryCode);

          if (!languagesByCountry.has(countryCode)) {
            languagesByCountry.set(countryCode, new Set());
          }
          languagesByCountry.get(countryCode)!.add(region.language.id);
        }
      });

      // Solo expandir idiomas si hay múltiples idiomas en el país
      languagesByCountry.forEach((languageIds, countryCode) => {
        if (languageIds.size > 1) {
          languageIds.forEach((languageId) => {
            languageSet.add(`${countryCode}-${languageId}`);
          });
        }
      });

      setExpandedCountries(countrySet);
      setExpandedLanguages(languageSet);
    }
  }, [regions, countries]);

  useEffect(() => {
    const handleLanguageChange = () => {
      loadRegions();
    };

    // window.addEventListener("storage", ... handled by useLocalStorage

    window.addEventListener("userDataUpdated", handleLanguageChange);

    return () => {
      window.removeEventListener("userDataUpdated", handleLanguageChange);
    };
  }, [selectedLanguageId]);

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

    if (!selectedLanguageId) {
      addToast("error", "No se encontró el idioma seleccionado");
      return;
    }

    try {
      setCreateLoading(true);
      const regionData = {
        ...createForm,
        languageId: selectedLanguageId,
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

    // Only require division if a country is selected (via language) and we don't have a division code
    if (
      editSelectedCountry &&
      !editSelectedDivision &&
      !selectedRegion.divisionCode
    ) {
      addToast("error", "Debes seleccionar una división");
      return;
    }

    if (!editForm.description.trim()) {
      addToast("error", "La descripción es obligatoria");
      return;
    }

    try {
      setEditLoading(true);
      const regionData = {
        ...editForm,
        divisionCode: editSelectedDivision
          ? editSelectedDivision.value
          : selectedRegion.divisionCode || undefined,
      };
      const response = await regionApi.updateRegion(
        selectedRegion.id,
        regionData,
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
    // Resetear primero
    setEditSelectedCountry(null);
    setEditSelectedDivision(null);
    setSelectedRegion(region);
    setEditForm({
      name: region.name,
      code: region.code,
      description: region.description,
      isDefault: region.isDefault,
    });

    setIsEditModalOpen(true);

    // Cargar la división después de abrir el modal
    await loadEditDivisionsByLanguage(region);
  };

  const loadEditDivisionsByLanguage = async (region: Region) => {
    try {
      const languageId = region.language?.id || selectedLanguageId;
      if (!languageId) {
        return;
      }

      const response = await adminApi.getLanguage(languageId);

      if (response.success && response.data) {
        const language = response.data;
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

            // Si la región tiene divisionCode, cargar esa división
            if (region.divisionCode) {
              try {
                const divisionResponse =
                  await countryDivisionApi.getDivisionsByCountry(country.code);

                if (divisionResponse.success && divisionResponse.data) {
                  // Buscar la división exacta por código
                  const division = divisionResponse.data.find(
                    (d: Division) => d.code === region.divisionCode,
                  );

                  if (division) {
                    const divisionOption = {
                      value: division.code,
                      label: division.name,
                      data: division,
                    };
                    setEditSelectedDivision(divisionOption);
                    if (import.meta.env.DEV) {
                      console.log(
                        "División cargada para edición:",
                        divisionOption,
                      );
                    }
                  } else {
                    if (import.meta.env.DEV) {
                      console.warn(
                        "No se encontró la división con código:",
                        region.divisionCode,
                        "en el país:",
                        country.code,
                      );
                    }
                  }
                }
              } catch (error) {
                if (import.meta.env.DEV) {
                  console.error("Error loading division for edit:", error);
                }
              }
            } else {
              if (import.meta.env.DEV) {
                console.warn("La región no tiene divisionCode:", region);
              }
            }
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
        <div className="mb-4 text-sm text-gray-700 dark:text-gray-400">
          Mostrando {totalRegions} regiones agrupadas por país e idioma
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableHeadCell>Nombre</TableHeadCell>
              <TableHeadCell>Código</TableHeadCell>
              <TableHeadCell>Descripción</TableHeadCell>
              <TableHeadCell>Tipo</TableHeadCell>
              <TableHeadCell>Acciones</TableHeadCell>
            </TableHead>
            <TableBody className="divide-y">
              {groupedRegions.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-gray-500 dark:text-gray-400"
                  >
                    No hay regiones disponibles
                  </TableCell>
                </TableRow>
              ) : (
                groupedRegions.map((countryGroup) => {
                  const isCountryExpanded = expandedCountries.has(
                    countryGroup.countryCode,
                  );
                  const countryKey = countryGroup.countryCode;

                  return (
                    <React.Fragment key={countryKey}>
                      {/* Fila de País */}
                      <TableRow className="bg-gray-100 dark:bg-gray-700">
                        <TableCell
                          colSpan={5}
                          className="font-semibold text-gray-900 dark:text-white"
                        >
                          <button
                            onClick={() => toggleCountry(countryKey)}
                            className="flex items-center space-x-2 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            {isCountryExpanded ? (
                              <HiChevronDown className="h-5 w-5" />
                            ) : (
                              <HiChevronRight className="h-5 w-5" />
                            )}
                            <span>
                              {countryGroup.languages.length === 1
                                ? countryGroup.languages[0].languageName
                                : `${countryGroup.countryName} (${countryGroup.countryCode})`}
                            </span>
                            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                              (
                              {countryGroup.languages.length === 1
                                ? countryGroup.languages[0].regions.length
                                : countryGroup.languages.length}{" "}
                              {countryGroup.languages.length === 1
                                ? countryGroup.languages[0].regions.length === 1
                                  ? "región"
                                  : "regiones"
                                : countryGroup.languages.length === 1
                                  ? "idioma"
                                  : "idiomas"}
                              )
                            </span>
                          </button>
                        </TableCell>
                      </TableRow>

                      {/* Filas de Idiomas y Regiones */}
                      {isCountryExpanded &&
                        (countryGroup.languages.length === 1
                          ? // Si solo hay un idioma, mostrar regiones directamente sin nivel de idioma
                            countryGroup.languages[0].regions.map((region) => (
                              <TableRow
                                key={region.id}
                                className="bg-white dark:border-gray-700 dark:bg-gray-900"
                              >
                                <TableCell className="whitespace-nowrap pl-8 font-medium text-gray-900 dark:text-white">
                                  {region.name}
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-gray-900 dark:text-white">
                                  {region.code}
                                </TableCell>
                                <TableCell className="text-gray-900 dark:text-white">
                                  {region.description.length > 50
                                    ? `${region.description.substring(0, 50)}...`
                                    : region.description}
                                </TableCell>
                                <TableCell>
                                  {region.isDefault ? (
                                    <Badge color="blue">Base</Badge>
                                  ) : (
                                    <Badge color="gray">Regional</Badge>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      color="light"
                                      onClick={() => openViewModal(region)}
                                    >
                                      <HiEye className="h-4 w-4" />
                                    </Button>
                                    {hasRegionPermission(region.id) && (
                                      <>
                                        <Button
                                          size="sm"
                                          color="light"
                                          onClick={() => openEditModal(region)}
                                        >
                                          <HiPencil className="h-4 w-4" />
                                        </Button>
                                        {hasLanguagePermission(
                                          region.language?.id || "",
                                        ) && (
                                          <Button
                                            size="sm"
                                            color="failure"
                                            onClick={() =>
                                              openDeleteModal(region)
                                            }
                                          >
                                            <HiTrash className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          : // Si hay múltiples idiomas, mostrar el nivel de idioma
                            countryGroup.languages.map((languageGroup) => {
                              const languageKey = `${countryKey}-${languageGroup.languageId}`;
                              const isLanguageExpanded =
                                expandedLanguages.has(languageKey);

                              return (
                                <React.Fragment key={languageKey}>
                                  {/* Fila de Idioma */}
                                  <TableRow className="bg-gray-50 dark:bg-gray-800">
                                    <TableCell
                                      colSpan={5}
                                      className="pl-8 font-medium text-gray-800 dark:text-gray-200"
                                    >
                                      <button
                                        onClick={() =>
                                          toggleLanguage(languageKey)
                                        }
                                        className="flex items-center space-x-2 hover:text-blue-600 dark:hover:text-blue-400"
                                      >
                                        {isLanguageExpanded ? (
                                          <HiChevronDown className="h-4 w-4" />
                                        ) : (
                                          <HiChevronRight className="h-4 w-4" />
                                        )}
                                        <span>
                                          {languageGroup.languageName}
                                        </span>
                                        <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                                          ({languageGroup.regions.length}{" "}
                                          {languageGroup.regions.length === 1
                                            ? "región"
                                            : "regiones"}
                                          )
                                        </span>
                                      </button>
                                    </TableCell>
                                  </TableRow>

                                  {/* Filas de Regiones */}
                                  {isLanguageExpanded &&
                                    languageGroup.regions.map((region) => (
                                      <TableRow
                                        key={region.id}
                                        className="bg-white dark:border-gray-700 dark:bg-gray-900"
                                      >
                                        <TableCell className="whitespace-nowrap pl-12 font-medium text-gray-900 dark:text-white">
                                          {region.name}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-gray-900 dark:text-white">
                                          {region.code}
                                        </TableCell>
                                        <TableCell className="text-gray-900 dark:text-white">
                                          {region.description.length > 50
                                            ? `${region.description.substring(0, 50)}...`
                                            : region.description}
                                        </TableCell>
                                        <TableCell>
                                          {region.isDefault ? (
                                            <Badge color="blue">Base</Badge>
                                          ) : (
                                            <Badge color="gray">Regional</Badge>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex space-x-2">
                                            <Button
                                              size="sm"
                                              color="light"
                                              onClick={() =>
                                                openViewModal(region)
                                              }
                                            >
                                              <HiEye className="h-4 w-4" />
                                            </Button>
                                            {hasRegionPermission(region.id) && (
                                              <>
                                                <Button
                                                  size="sm"
                                                  color="light"
                                                  onClick={() =>
                                                    openEditModal(region)
                                                  }
                                                >
                                                  <HiPencil className="h-4 w-4" />
                                                </Button>
                                                {hasLanguagePermission(
                                                  region.language?.id || "",
                                                ) && (
                                                  <Button
                                                    size="sm"
                                                    color="failure"
                                                    onClick={() =>
                                                      openDeleteModal(region)
                                                    }
                                                  >
                                                    <HiTrash className="h-4 w-4" />
                                                  </Button>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                </React.Fragment>
                              );
                            }))}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
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
        <ModalHeader>Crear Nueva Región</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-country">País</Label>
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
                <Label htmlFor="create-division">División/Estado</Label>
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
              <Label htmlFor="create-description">Descripción</Label>
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
              <Label htmlFor="create-default">Región Nacional (Base)</Label>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
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
        </ModalFooter>
      </Modal>

      <Modal
        show={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          // No resetear aquí porque puede estar en proceso de carga
          // Se reseteará cuando se abra el modal de nuevo
        }}
      >
        <ModalHeader>Editar Región</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {editSelectedCountry && (
              <div>
                <Label htmlFor="edit-division">División/Estado</Label>
                <AsyncSelect
                  id="edit-division"
                  value={editSelectedDivision}
                  onChange={handleEditDivisionChange}
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
              <Label htmlFor="edit-description">Descripción</Label>
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
              <Label htmlFor="edit-default">Región Nacional (Base)</Label>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
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
        </ModalFooter>
      </Modal>

      <Modal show={isViewModalOpen} onClose={() => setIsViewModalOpen(false)}>
        <ModalHeader>Detalles de la Región</ModalHeader>
        <ModalBody>
          {selectedRegion && (
            <div className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedRegion.name}
                </p>
              </div>
              <div>
                <Label>Código</Label>
                <p className="text-gray-900 dark:text-white">
                  {selectedRegion.code}
                </p>
              </div>
              <div>
                <Label>Descripción</Label>
                <p className="text-gray-900 dark:text-white">
                  {selectedRegion.description}
                </p>
              </div>
              <div>
                <Label>Tipo</Label>
                <p className="text-gray-900 dark:text-white">
                  {selectedRegion.isDefault
                    ? "Región Nacional (Base)"
                    : "Región Regional"}
                </p>
              </div>
              <div>
                <Label>Fecha de Creación</Label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(selectedRegion.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="gray" onClick={() => setIsViewModalOpen(false)}>
            Cerrar
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        show={isDeleteModalOpen}
        size="md"
        onClose={() => setIsDeleteModalOpen(false)}
      >
        <ModalHeader>Confirmar Eliminación</ModalHeader>
        <ModalBody>
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
        </ModalBody>
        <ModalFooter>
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
        </ModalFooter>
      </Modal>

      <div className="fixed right-4 top-4 z-[100] space-y-2">
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
            <ToastToggle />
          </Toast>
        ))}
      </div>
    </div>
  );
}
