import { useState, useEffect, useCallback, useRef } from "react";
import { SingleValue } from "react-select";
import {
  regionApi,
  countryDivisionApi,
  adminApi,
  unwrapApiList,
} from "../../services/api";
import { usePermissions } from "../../hooks/usePermissions";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import {
  Country,
  CountryOption,
  Division,
  DivisionOption,
  LanguageListItem,
  LanguageOption,
  Region,
  RegionForm,
  ToastMessage,
} from "./types";
import { groupRegionsByCountryAndLanguage } from "./utils";
const emptyRegionForm: RegionForm = {
  name: "",
  code: "",
  description: "",
  isDefault: false,
};

export function useRegionManagement() {
  const [allLanguages, setAllLanguages] = useState<LanguageListItem[]>([]);
  const createLanguageIdRef = useRef<string | null>(null);
  const { hasRegionPermission, hasLanguagePermission, isAdmin } =
    usePermissions();
  const [selectedLanguageId, setSelectedLanguageId] = useLocalStorage<
    string | null
  >("selectedLanguageId", null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(
    new Set(),
  );
  const [expandedLanguages, setExpandedLanguages] = useState<Set<string>>(
    new Set(),
  );

  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(
    null,
  );
  const [selectedDivision, setSelectedDivision] =
    useState<DivisionOption | null>(null);

  const [editSelectedCountry, setEditSelectedCountry] =
    useState<CountryOption | null>(null);
  const [editSelectedDivision, setEditSelectedDivision] =
    useState<DivisionOption | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLanguageOption, setSelectedLanguageOption] =
    useState<LanguageOption | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);

  const [createForm, setCreateForm] = useState<RegionForm>(emptyRegionForm);
  const [editForm, setEditForm] = useState<RegionForm>(emptyRegionForm);

  const loadCountries = useCallback(async () => {
    try {
      const response = await countryDivisionApi.getCountries();
      if (response.success) {
        setCountries(response.data);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error loading countries:", error);
      }
    }
  }, []);

  const loadAllLanguages = useCallback(async () => {
    try {
      const response = await adminApi.getLanguages();
      if (response.success && response.data) {
        setAllLanguages(unwrapApiList<LanguageListItem>(response.data));
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error loading all languages:", error);
      }
    }
  }, []);

  const loadDivisionsByLanguage = useCallback(async () => {
    try {
      if (!selectedLanguageId) {
        return;
      }

      const response = await adminApi.getLanguage(selectedLanguageId);

      if (!response.success) {
        if (import.meta.env.DEV) {
          console.warn(
            "El idioma seleccionado no existe en la base de datos. Limpiando selección...",
          );
        }
        setSelectedLanguageId(null);
        setError(
          "El idioma previamente seleccionado ya no existe. Por favor, selecciona un idioma de nuevo.",
        );
        return;
      }

      if (response.data) {
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
          }
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error loading divisions by language:", error);
      }
    }
  }, [selectedLanguageId, setSelectedLanguageId, countries]);

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
        return unwrapApiList<Division>(response.data).map((division) => ({
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
        return unwrapApiList<Division>(response.data).map((division) => ({
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

  const languageHasBaseRegion = (languageId: string | null | undefined) =>
    Boolean(
      languageId &&
        regions.some(
          (region) => region.language?.id === languageId && region.isDefault,
        ),
    );

  const handleLanguageSelectChange = async (
    selectedOption: SingleValue<LanguageOption>,
  ) => {
    setSelectedLanguageOption(selectedOption);
    setSelectedCountry(null);
    setSelectedDivision(null);

    const hasBase = languageHasBaseRegion(selectedOption?.value);

    setCreateForm((prev) => ({
      ...prev,
      name: "",
      code: "",
      // Only one base region per language: force regional when base already exists.
      isDefault: hasBase ? false : prev.isDefault,
    }));

    if (selectedOption) {
      const countryCode = selectedOption.countryCode;
      const country = countries.find((c) => c.code === countryCode);

      if (country) {
        setSelectedCountry({
          value: country.code,
          label: country.name,
          data: country,
        });
        setTimeout(() => loadAllDivisions(), 100);
      }

      createLanguageIdRef.current = selectedOption.value;
    } else {
      createLanguageIdRef.current = null;
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

  const addToast = useCallback((type: "success" | "error", message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const loadRegions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const languageId = isAdmin ? undefined : selectedLanguageId;

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
          const pageData = unwrapApiList<Region>(response.data);
          allRegions = [...allRegions, ...pageData];
          total =
            typeof response.data === "object" &&
            response.data !== null &&
            "total" in response.data
              ? Number((response.data as { total?: number }).total) || 0
              : 0;

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
    } catch (err) {
      const errorMessage = "Error de conexión al cargar las regiones";
      setError(errorMessage);
      addToast("error", errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, selectedLanguageId, addToast]);

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

  useEffect(() => {
    void loadRegions();
    void loadCountries();
    void loadAllLanguages();
  }, [loadRegions, loadCountries, loadAllLanguages]);

  useEffect(() => {
    if (regions.length > 0 && countries.length > 0) {
      const countrySet = new Set<string>();
      const languageSet = new Set<string>();
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
      void loadRegions();
    };

    window.addEventListener("userDataUpdated", handleLanguageChange);

    return () => {
      window.removeEventListener("userDataUpdated", handleLanguageChange);
    };
  }, [loadRegions]);

  useEffect(() => {
    if (countries.length > 0) {
      void loadDivisionsByLanguage();
    }
  }, [countries, loadDivisionsByLanguage]);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
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

    const languageId = createLanguageIdRef.current || selectedLanguageId;

    if (!languageId) {
      addToast(
        "error",
        "No hay un idioma seleccionado válido. Por favor, asegúrate de haber seleccionado un país con un idioma existente o selecciona un idioma.",
      );
      return;
    }

    try {
      setCreateLoading(true);

      const langCheck = await adminApi.getLanguage(languageId);
      if (!langCheck.success) {
        if (languageId === selectedLanguageId) {
          setSelectedLanguageId(null);
        }
        addToast(
          "error",
          "El idioma seleccionado ya no existe. Por favor, selecciona uno nuevo.",
        );
        setCreateLoading(false);
        return;
      }

      const regionData = {
        ...createForm,
        isDefault: languageHasBaseRegion(languageId)
          ? false
          : createForm.isDefault,
        languageId: languageId,
      };
      const response = await regionApi.createRegion(regionData);

      if (response.success) {
        addToast("success", "Región creada exitosamente");
        setIsCreateModalOpen(false);
        setCreateForm(emptyRegionForm);
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
      const languageId = selectedRegion.language?.id;
      const hasOtherBase = Boolean(
        languageId &&
          regions.some(
            (region) =>
              region.language?.id === languageId &&
              region.isDefault &&
              region.id !== selectedRegion.id,
          ),
      );
      const regionData = {
        ...editForm,
        isDefault: hasOtherBase ? false : editForm.isDefault,
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

            if (region.divisionCode) {
              try {
                const divisionResponse =
                  await countryDivisionApi.getDivisionsByCountry(country.code);

                if (divisionResponse.success && divisionResponse.data) {
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

  const openEditModal = async (region: Region) => {
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

    await loadEditDivisionsByLanguage(region);
  };

  const openDeleteModal = (region: Region) => {
    setSelectedRegion(region);
    setIsDeleteModalOpen(true);
  };

  const openViewModal = (region: Region) => {
    setSelectedRegion(region);
    setIsViewModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setSelectedCountry(null);
    setSelectedDivision(null);
  };

  const focusLanguage =
    allLanguages.find((language) => language.id === selectedLanguageId) ??
    allLanguages[0] ??
    null;

  const focusedRegions = selectedLanguageId
    ? regions.filter((region) => region.language?.id === selectedLanguageId)
    : regions;

  const focusedGroupedRegions = groupRegionsByCountryAndLanguage(
    focusedRegions,
    countries,
  );

  useEffect(() => {
    if (allLanguages.length === 0) return;
    const stillValid =
      selectedLanguageId &&
      allLanguages.some((language) => language.id === selectedLanguageId);
    if (!stillValid) {
      setSelectedLanguageId(allLanguages[0].id);
    }
  }, [allLanguages, selectedLanguageId, setSelectedLanguageId]);

  const handleFocusLanguageChange = (languageId: string) => {
    setSelectedLanguageId(languageId);
  };

  const openCreateModal = async () => {
    const language =
      allLanguages.find((item) => item.id === selectedLanguageId) ??
      allLanguages[0];
    if (language) {
      await handleLanguageSelectChange({
        value: language.id,
        label: language.name,
        countryCode: language.countryCode ?? "",
      });
    }
    setIsCreateModalOpen(true);
  };

  const createLanguageId =
    selectedLanguageOption?.value ?? selectedLanguageId ?? null;
  const createLanguageHasBaseRegion = languageHasBaseRegion(createLanguageId);

  const editLanguageId = selectedRegion?.language?.id ?? null;
  const editLanguageHasOtherBase = Boolean(
    editLanguageId &&
      selectedRegion &&
      regions.some(
        (region) =>
          region.language?.id === editLanguageId &&
          region.isDefault &&
          region.id !== selectedRegion.id,
      ),
  );

  return {
    loading,
    error,
    setError,
    totalRegions: focusedRegions.length,
    toasts,
    isDarkMode,
    groupedRegions: focusedGroupedRegions,
    createLanguageHasBaseRegion,
    editLanguageHasOtherBase,
    expandedCountries,
    expandedLanguages,
    toggleCountry,
    toggleLanguage,
    hasRegionPermission,
    hasLanguagePermission,
    isCreateModalOpen,
    setIsCreateModalOpen,
    openCreateModal,
    closeCreateModal,
    selectedLanguageOption,
    handleLanguageSelectChange,
    allLanguages,
    selectedLanguageId,
    focusLanguage,
    handleFocusLanguageChange,
    selectedCountry,
    selectedDivision,
    handleDivisionChange,
    loadDivisionOptions,
    createForm,
    setCreateForm,
    handleCreateRegion,
    createLoading,
    isEditModalOpen,
    setIsEditModalOpen,
    editSelectedCountry,
    editSelectedDivision,
    handleEditDivisionChange,
    loadEditDivisionOptions,
    editForm,
    setEditForm,
    handleEditRegion,
    editLoading,
    isViewModalOpen,
    setIsViewModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    selectedRegion,
    handleDeleteRegion,
    deleteLoading,
    openEditModal,
    openDeleteModal,
    openViewModal,
  };
}
