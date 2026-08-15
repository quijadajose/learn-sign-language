import { useState, useEffect, useCallback } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { clearStageSelectionForLanguage } from "../../utils/learningStorage";
import { useToast } from "../ToastProvider";
import { languageApi, regionApi } from "../../services/api";
import type {
  EnrolledLanguage,
  EnrolledRegion,
  Language,
  LanguageSwitcherTab,
  PaginatedEnrolledLanguageResponse,
  PaginatedEnrolledRegionResponse,
  PaginatedLanguageResponse,
  PaginatedRegionResponse,
  Region,
} from "./types";

/** 0 = Mis idiomas (regions), 1 = Inscribirme (enroll) */
function tabIndexFromInitial(tab: LanguageSwitcherTab): number {
  return tab === "enroll" ? 1 : 0;
}

const TAB_MY_LANGUAGES = 0;
const TAB_ENROLL = 1;

export function useLanguageSwitcher(
  isOpen: boolean,
  onClose: () => void,
  onLanguageChanged: (language: Language) => void,
  initialTab: LanguageSwitcherTab = "enroll",
) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [enrolledLanguagesData, setEnrolledLanguagesData] = useState<
    EnrolledLanguage[]
  >([]);
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguageId, setSelectedLanguageId] = useLocalStorage<
    string | null
  >("selectedLanguageId", null);
  const [selectedRegionId, setSelectedRegionId] = useLocalStorage<
    string | null
  >("selectedRegionId", null);
  const [switching, setSwitching] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollingRegion, setEnrollingRegion] = useState(false);
  const [showRegionSelection, setShowRegionSelection] = useState(false);
  const [selectedLanguageForEnroll, setSelectedLanguageForEnroll] =
    useState<Language | null>(null);
  const [selectedLanguageForRegion, setSelectedLanguageForRegion] =
    useState<Language | null>(null);
  const [activeTab, setActiveTab] = useState(() =>
    tabIndexFromInitial(initialTab),
  );
  const [showRegionSelectionForSwitch, setShowRegionSelectionForSwitch] =
    useState(false);
  const [showRegionEnrollment, setShowRegionEnrollment] = useState(false);
  const [regionIdBeforeEnrollment, setRegionIdBeforeEnrollment] = useState<
    string | null
  >(null);
  const addToast = useToast();

  const loadEnrolledLanguages = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await languageApi.getEnrolledLanguages();

      if (!response.success) {
        throw new Error(
          response.message || "No se pudieron obtener tus idiomas inscritos.",
        );
      }

      const enrolledData: PaginatedEnrolledLanguageResponse = response.data;
      setEnrolledLanguagesData(enrolledData.data);
      const enrolledLangs = enrolledData.data.map((el) => el.language);
      setLanguages(enrolledLangs);
      return enrolledLangs;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Ha ocurrido un error";
      setError(message);
      addToast("error", message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const loadAvailableLanguages = useCallback(async () => {
    try {
      const response = await languageApi.getAvailableLanguages(1, 100);

      if (!response.success) {
        throw new Error(
          response.message || "No se pudieron obtener los idiomas disponibles.",
        );
      }

      const availableData: PaginatedLanguageResponse = response.data;
      setAvailableLanguages(availableData.data);
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        console.error("Error loading available languages:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(tabIndexFromInitial(initialTab));
      void loadEnrolledLanguages();
      void loadAvailableLanguages();
    }
  }, [isOpen, initialTab, loadEnrolledLanguages, loadAvailableLanguages]);

  const resetModalState = useCallback(() => {
    setShowRegionSelection(false);
    setShowRegionEnrollment(false);
    setShowRegionSelectionForSwitch(false);
    setSelectedLanguageForEnroll(null);
    setSelectedLanguageForRegion(null);
    setRegions([]);
  }, []);

  const handleClose = useCallback(() => {
    if (showRegionEnrollment) {
      setSelectedRegionId(regionIdBeforeEnrollment);
    }
    setRegionIdBeforeEnrollment(null);
    resetModalState();
    onClose();
  }, [
    onClose,
    resetModalState,
    showRegionEnrollment,
    regionIdBeforeEnrollment,
    setSelectedRegionId,
  ]);

  const getFilteredAvailableLanguages = () => {
    const enrolledLanguageIds = new Set(languages.map((lang) => lang.id));
    return availableLanguages.filter((lang) => !enrolledLanguageIds.has(lang.id));
  };

  const loadRegions = async (
    languageId: string,
    forEnrollment: boolean = false,
  ) => {
    try {
      setLoading(true);

      let regionsToSet: Region[] = [];

      if (forEnrollment) {
        const response = await regionApi.getRegions(1, 100, languageId);
        if (!response.success) {
          throw new Error(
            response.message || "No se pudieron obtener las regiones.",
          );
        }
        const regionData: PaginatedRegionResponse = response.data;
        regionsToSet = regionData.data;
      } else {
        const response = await languageApi.getEnrolledRegions(
          1,
          100,
          languageId,
        );
        if (!response.success) {
          throw new Error(
            response.message ||
              "No se pudieron obtener tus regiones inscritas.",
          );
        }
        const enrolledRegionData: PaginatedEnrolledRegionResponse =
          response.data;
        regionsToSet = enrolledRegionData.data.map((er) => er.region);
      }

      setRegions(regionsToSet);

      if (regionsToSet.length === 1) {
        setSelectedRegionId(regionsToSet[0].id);
        addToast(
          "info",
          `Región automáticamente seleccionada: ${regionsToSet[0].name}`,
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al cargar regiones";
      addToast("error", message);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (languageId: string) => {
    setSelectedLanguageId(languageId);
    setSelectedRegionId(null);

    if (languageId) {
      await loadRegions(languageId, false);
      setShowRegionSelectionForSwitch(true);
    }
  };

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguageForEnroll(language);
    addToast("success", `Idioma seleccionado: ${language.name}`);
  };

  const handleRegionSelect = (region: Region) => {
    setSelectedRegionId(region.id);
    addToast("success", `Región seleccionada: ${region.name}`);
  };

  const handleEnroll = async () => {
    if (!selectedLanguageForEnroll) {
      addToast("error", "Por favor selecciona un idioma.");
      return;
    }

    setEnrolling(true);

    try {
      const languageIdToSave = selectedLanguageForEnroll.id;
      const languageNameToSave = selectedLanguageForEnroll.name;
      const languageToSave = selectedLanguageForEnroll;
      const regionIdToSave = selectedRegionId;

      const response = await languageApi.enrollInLanguage(
        selectedLanguageForEnroll.id,
        regionIdToSave || undefined,
      );

      if (response.success) {
        setSelectedLanguageId(languageIdToSave);
        if (regionIdToSave) {
          setSelectedRegionId(regionIdToSave);
        }

        window.dispatchEvent(new CustomEvent("userDataUpdated"));

        const enrolledLangs = await loadEnrolledLanguages();
        await loadAvailableLanguages();

        const newLanguage = enrolledLangs.find(
          (lang) => lang.id === languageIdToSave,
        );

        setSelectedLanguageForEnroll(null);
        setSelectedRegionId(null);
        setShowRegionSelection(false);
        setRegions([]);

        addToast(
          "success",
          `¡Perfecto! Te has inscrito en ${languageNameToSave} correctamente.`,
        );

        if (newLanguage) {
          onLanguageChanged(newLanguage);
        } else {
          onLanguageChanged(languageToSave);
        }
        handleClose();
      } else {
        addToast(
          "error",
          response.message || "Ocurrió un error inesperado al inscribirte.",
        );
      }
    } catch (err: unknown) {
      addToast("error", "Error al inscribirse en el idioma.");
    } finally {
      setEnrolling(false);
    }
  };

  const handleBack = () => {
    setShowRegionSelection(false);
    setSelectedRegionId(null);
    setRegions([]);
    setActiveTab(TAB_ENROLL);
  };

  const handleBackForSwitch = () => {
    setShowRegionSelectionForSwitch(false);
    setSelectedRegionId(null);
    setRegions([]);
    setActiveTab(TAB_MY_LANGUAGES);
  };

  const handleSwitchWithRegion = async () => {
    if (!selectedLanguageId) {
      addToast("error", "Por favor selecciona un idioma.");
      return;
    }

    const selectedLanguage = languages.find(
      (lang) => lang.id === selectedLanguageId,
    );
    if (!selectedLanguage) {
      addToast("error", "Idioma seleccionado no válido.");
      return;
    }

    setSwitching(true);

    try {
      setSelectedLanguageId(selectedLanguage.id);
      if (selectedRegionId) {
        setSelectedRegionId(selectedRegionId);
      }

      window.dispatchEvent(new CustomEvent("userDataUpdated"));

      addToast("success", `Idioma cambiado a: ${selectedLanguage.name}`);
      onLanguageChanged(selectedLanguage);
      handleClose();
    } catch (err: unknown) {
      addToast("error", "Error al cambiar idioma.");
    } finally {
      setSwitching(false);
    }
  };

  const handleSwitchLanguage = async () => {
    if (!selectedLanguageId) {
      addToast("error", "Por favor selecciona un idioma.");
      return;
    }

    const selectedLanguage = languages.find(
      (lang) => lang.id === selectedLanguageId,
    );
    if (!selectedLanguage) {
      addToast("error", "Idioma seleccionado no válido.");
      return;
    }

    setSwitching(true);

    try {
      setSelectedLanguageId(selectedLanguage.id);
      window.dispatchEvent(new CustomEvent("userDataUpdated"));

      addToast("success", `Idioma cambiado a: ${selectedLanguage.name}`);
      onLanguageChanged(selectedLanguage);
      handleClose();
    } catch (err: unknown) {
      addToast("error", "Error al cambiar idioma.");
    } finally {
      setSwitching(false);
    }
  };

  const handleEnrollInRegion = async (language: Language) => {
    setRegionIdBeforeEnrollment(selectedRegionId);
    setSelectedLanguageForRegion(language);
    setSelectedRegionId(null);
    await loadRegions(language.id, true);
    setShowRegionEnrollment(true);
    setActiveTab(TAB_MY_LANGUAGES);
  };

  const handleEnrollRegion = async () => {
    if (!selectedLanguageForRegion || !selectedRegionId) {
      addToast("error", "Por favor selecciona una región.");
      return;
    }

    setEnrollingRegion(true);

    try {
      const newRegionId = selectedRegionId;
      const response = await languageApi.enrollInRegion(newRegionId);

      if (response.success) {
        addToast("success", `Te has inscrito en la región correctamente.`);
        await loadEnrolledLanguages();
        setShowRegionEnrollment(false);
        setSelectedLanguageForRegion(null);
        setSelectedRegionId(newRegionId);
        setRegionIdBeforeEnrollment(null);
        setRegions([]);
        setActiveTab(TAB_MY_LANGUAGES);
        window.dispatchEvent(new CustomEvent("userDataUpdated"));
      } else {
        addToast(
          "error",
          response.message || "Error al inscribirse en la región.",
        );
      }
    } catch (err: unknown) {
      addToast("error", "Error al inscribirse en la región.");
    } finally {
      setEnrollingRegion(false);
    }
  };

  const handleSwitchRegion = async (regionId: string) => {
    setSelectedRegionId(regionId);
    window.dispatchEvent(new CustomEvent("userDataUpdated"));
    addToast("success", "Región cambiada correctamente.");
    handleClose();
  };

  const getEnrolledRegionsForLanguage = (
    languageId: string,
  ): EnrolledRegion[] => {
    const enrolledLang = enrolledLanguagesData.find(
      (el) => el.language.id === languageId,
    );
    return enrolledLang?.enrolledRegions || [];
  };

  const handleUnenrollLanguage = async (languageId: string) => {
    if (
      !confirm("¿Estás seguro de que deseas desinscribirte de este idioma?")
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await languageApi.unenrollFromLanguage(languageId);
      if (response.success) {
        addToast("success", "Te has desinscrito del idioma exitosamente.");
        await loadEnrolledLanguages();
        clearStageSelectionForLanguage(languageId);
        if (selectedLanguageId === languageId) {
          setSelectedLanguageId(null);
          setSelectedRegionId(null);
        }
        window.dispatchEvent(new CustomEvent("userDataUpdated"));
      } else {
        addToast(
          "error",
          response.message || "Error al desinscribirse del idioma.",
        );
      }
    } catch (err: unknown) {
      addToast(
        "error",
        err instanceof Error
          ? err.message
          : "Error al desinscribirse del idioma.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUnenrollRegion = async (regionId: string) => {
    if (
      !confirm("¿Estás seguro de que deseas desinscribirte de esta región?")
    ) {
      return;
    }

    setLoading(true);
    try {
      const response = await languageApi.unenrollFromRegion(regionId);
      if (response.success) {
        addToast("success", "Te has desinscrito de la región exitosamente.");
        await loadEnrolledLanguages();
        if (selectedRegionId === regionId) {
          setSelectedRegionId(null);
        }
        window.dispatchEvent(new CustomEvent("userDataUpdated"));
      } else {
        addToast(
          "error",
          response.message || "Error al desinscribirse de la región.",
        );
      }
    } catch (err: unknown) {
      addToast(
        "error",
        err instanceof Error
          ? err.message
          : "Error al desinscribirse de la región.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToEnrollRegionSelection = async () => {
    if (!selectedLanguageForEnroll) return;
    await loadRegions(selectedLanguageForEnroll.id, true);
    setShowRegionSelection(true);
    setActiveTab(TAB_ENROLL);
  };

  const handleBackFromRegionEnrollment = () => {
    setShowRegionEnrollment(false);
    setSelectedLanguageForRegion(null);
    setSelectedRegionId(regionIdBeforeEnrollment);
    setRegionIdBeforeEnrollment(null);
    setRegions([]);
    setActiveTab(TAB_MY_LANGUAGES);
  };

  const handleBackFromRegionEnrollmentNoRegions = () => {
    setShowRegionEnrollment(false);
    setSelectedLanguageForRegion(null);
    setSelectedRegionId(regionIdBeforeEnrollment);
    setRegionIdBeforeEnrollment(null);
    setRegions([]);
    setActiveTab(TAB_MY_LANGUAGES);
  };

  const currentLanguage = languages.find(
    (lang) => lang.id === selectedLanguageId,
  );

  return {
    languages,
    regions,
    loading,
    error,
    selectedLanguageId,
    selectedRegionId,
    switching,
    enrolling,
    enrollingRegion,
    showRegionSelection,
    selectedLanguageForEnroll,
    selectedLanguageForRegion,
    activeTab,
    setActiveTab,
    showRegionSelectionForSwitch,
    showRegionEnrollment,
    currentLanguage,
    getFilteredAvailableLanguages,
    getEnrolledRegionsForLanguage,
    handleClose,
    handleLanguageChange,
    handleLanguageSelect,
    handleRegionSelect,
    handleEnroll,
    handleBack,
    handleBackForSwitch,
    handleSwitchWithRegion,
    handleSwitchLanguage,
    handleEnrollInRegion,
    handleEnrollRegion,
    handleSwitchRegion,
    handleUnenrollLanguage,
    handleUnenrollRegion,
    handleProceedToEnrollRegionSelection,
    handleBackFromRegionEnrollment,
    handleBackFromRegionEnrollmentNoRegions,
    setSelectedLanguageForEnroll,
  };
}

export type UseLanguageSwitcherReturn = ReturnType<typeof useLanguageSwitcher>;
