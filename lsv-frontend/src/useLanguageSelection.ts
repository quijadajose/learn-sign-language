import { useState, useEffect, useRef } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useToast } from "./components/ToastProvider";
import { languageApi, regionApi } from "./services/api";
import { useAuth } from "./context/AuthContext";
import type { Language, Region } from "./LanguageSelectionGrids";

interface PaginatedLanguageResponse {
  data: Language[];
  total: number;
  page: number;
  pageSize: number;
}

interface EnrolledLanguage {
  language: Language;
}
interface PaginatedEnrolledLanguageResponse {
  data: EnrolledLanguage[];
}

interface PaginatedRegionResponse {
  data: Region[];
  total: number;
  page: number;
  pageSize: number;
}

interface EnrolledRegion {
  region: Region;
}

const ITEMS_PER_PAGE = 8;


export function useLanguageSelection(onLanguageSelected: (lang: Language) => void) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLanguageId, setSelectedLanguageId] = useLocalStorage<
    string | null
  >("selectedLanguageId", null);
  const [selectedRegionId, setSelectedRegionId] = useLocalStorage<
    string | null
  >("selectedRegionId", null);
  const [enrolling, setEnrolling] = useState(false);
  const { token } = useAuth();
  const [title, setTitle] = useState("Quiero aprender:");
  const [showRegionSelection, setShowRegionSelection] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(
    null,
  );
  const [isLanguageFromEnrollment, setIsLanguageFromEnrollment] =
    useState(false);
  const addToast = useToast();

  // Snapshot values the init effect reads-then-writes. Putting them in the
  // dependency array would re-fetch (and toast "Continuando con…") on every
  // language/region change. loadRegions is recreated each render.
  const selectedLanguageIdRef = useRef(selectedLanguageId);
  const selectedRegionIdRef = useRef(selectedRegionId);
  const setSelectedLanguageIdRef = useRef(setSelectedLanguageId);
  const setSelectedRegionIdRef = useRef(setSelectedRegionId);
  const loadRegionsRef = useRef<
    (languageId: string) => Promise<"empty" | Region | null>
  >(async () => null);
  selectedLanguageIdRef.current = selectedLanguageId;
  selectedRegionIdRef.current = selectedRegionId;
  setSelectedLanguageIdRef.current = setSelectedLanguageId;
  setSelectedRegionIdRef.current = setSelectedRegionId;

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      if (!token) {
        if (active) {
          setError("No estás autenticado.");
          setLoading(false);
        }
        return;
      }

      if (active) setLoading(true);
      try {
        // Verificar si el usuario tiene idiomas y regiones inscritos
        const enrolledResponse = await languageApi.getEnrolledLanguages();

        if (!active) return;

        if (!enrolledResponse.success) {
          throw new Error(
            enrolledResponse.message ||
              "No se pudieron obtener tus idiomas inscritos.",
          );
        }

        const enrolledData: PaginatedEnrolledLanguageResponse =
          enrolledResponse.data;

        if (enrolledData.data.length > 0) {
          const storedLanguageId = selectedLanguageIdRef.current;
          const storedRegionId = selectedRegionIdRef.current;

          // Buscar el idioma seleccionado en los idiomas inscritos
          let selectedLanguage = null;
          if (storedLanguageId) {
            selectedLanguage = enrolledData.data.find(
              (el) => el.language.id === storedLanguageId,
            )?.language;
          }

          // Si hay un idioma seleccionado válido, verificar si tiene regiones
          if (selectedLanguage) {
            const enrolledRegionsResponse =
              await languageApi.getEnrolledRegions(1, 100, selectedLanguage.id);

            if (!active) return;

            if (
              enrolledRegionsResponse.success &&
              enrolledRegionsResponse.data.data.length > 0
            ) {
              // El usuario tiene el idioma seleccionado y tiene regiones inscritas
              // Si hay una región almacenada y está en las regiones del idioma, usarla
              let selectedRegion = enrolledRegionsResponse.data.data[0].region;
              if (storedRegionId) {
                const storedEnrolledRegion =
                  enrolledRegionsResponse.data.data.find(
                    (er: EnrolledRegion) => er.region.id === storedRegionId,
                  );
                if (storedEnrolledRegion) {
                  selectedRegion = storedEnrolledRegion.region;
                }
              }

              setSelectedLanguageIdRef.current(selectedLanguage.id);
              setSelectedRegionIdRef.current(selectedRegion.id);
              addToast(
                "success",
                `Continuando con ${selectedLanguage.name} - ${selectedRegion.name}.`,
              );
              setLoading(false);
              return;
            }
          }

          // Si no hay idioma seleccionado válido o no tiene regiones, usar el primer idioma
          const firstLanguage = enrolledData.data[0].language;
          const enrolledRegionsResponse = await languageApi.getEnrolledRegions(
            1,
            100,
            firstLanguage.id,
          );

          if (!active) return;

          if (
            enrolledRegionsResponse.success &&
            enrolledRegionsResponse.data.data.length > 0
          ) {
            // El usuario tiene idioma y región inscritos
            // Precargar sin mostrar el panel
            const firstRegion = enrolledRegionsResponse.data.data[0].region;
            setSelectedLanguageIdRef.current(firstLanguage.id);
            setSelectedRegionIdRef.current(firstRegion.id);
            addToast(
              "success",
              `Continuando con ${firstLanguage.name} - ${firstRegion.name}.`,
            );
            return;
          }

          // Si tiene idioma pero no región, mostrar el panel de selección de región
          if (enrolledData.data.length === 1) {
            const enrolledLanguage = enrolledData.data[0].language;
            setSelectedLanguageIdRef.current(enrolledLanguage.id);
            // Cargar regiones para este idioma y mostrar el panel de selección
            await loadRegionsRef.current(enrolledLanguage.id);
            if (!active) return;
            setShowRegionSelection(true);
            setTitle("Selecciona tu región:");
            setLoading(false);
            return;
          } else {
            // Múltiples idiomas inscritos: mostrar selector solo si no hay idioma válido seleccionado
            setTitle("Continuar aprendiendo:");
            setLanguages(enrolledData.data.map((el) => el.language));
            setTotalPages(1);
            setLoading(false);
            return;
          }
        }
        const availableResponse = await languageApi.getAvailableLanguages(
          currentPage,
          ITEMS_PER_PAGE,
        );

        if (!active) return;

        if (!availableResponse.success) {
          throw new Error(
            availableResponse.message ||
              "No se pudieron obtener los idiomas disponibles.",
          );
        }

        const availableData: PaginatedLanguageResponse = availableResponse.data;

        if (availableData.total === 1 && availableData.data.length === 1) {
          const singleLanguage = availableData.data[0];
          setLanguages([singleLanguage]);
          setSelectedLanguageIdRef.current(singleLanguage.id);
          setSelectedLanguage(singleLanguage);
          setTotalPages(1);
          addToast(
            "info",
            `Único idioma disponible: ${singleLanguage.name}. Selecciónalo para continuar.`,
          );
        } else {
          setLanguages(availableData.data);
          setTotalPages(
            Math.max(1, Math.ceil(availableData.total / ITEMS_PER_PAGE)),
          );
        }
      } catch (err: unknown) {
        if (!active) return;
        const message =
          err instanceof Error ? err.message : "Error al cargar idiomas";
        setError(message);
        addToast("error", message);
      } finally {
        if (active) setLoading(false);
      }
    };

    void initialize();

    return () => {
      active = false;
    };
  }, [token, currentPage, addToast]);

  const handleSelect = (lang: Language) => {
    setSelectedLanguageId(lang.id);
    setSelectedLanguage(lang);
    addToast("success", `Idioma seleccionado: ${lang.name} `);
  };

  const handleRegionSelect = (region: Region) => {
    setSelectedRegionId(region.id);
    addToast("success", `Región seleccionada: ${region.name} `);
    if (showRegionSelection && !enrolling) {
      void handleNext(undefined, region.id);
    }
  };

  const loadRegions = async (
    languageId: string,
  ): Promise<"empty" | Region | null> => {
    try {
      setLoading(true);
      const response = await regionApi.getRegions(1, 100, languageId);
      if (!response.success) {
        throw new Error(
          response.message || "No se pudieron obtener las regiones.",
        );
      }

      const regionData: PaginatedRegionResponse = response.data;
      const languageRegions = regionData.data;

      if (languageRegions.length === 0) {
        addToast(
          "info",
          "No hay regiones disponibles. Puedes continuar sin seleccionar región.",
        );
        setRegions([]);
        return "empty";
      }

      setRegions(languageRegions);

      if (languageRegions.length === 1) {
        const onlyRegion = languageRegions[0];
        setSelectedRegionId(onlyRegion.id);
        addToast(
          "info",
          `Región automáticamente seleccionada: ${onlyRegion.name} `,
        );
        return onlyRegion;
      }
      return null;
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al cargar regiones";
      setError(message);
      addToast("error", message);
      return null;
    } finally {
      setLoading(false);
    }
  };
  loadRegionsRef.current = loadRegions;

  const enrollLanguage = async (
    selected: Language,
    regionId?: string | null,
  ) => {
    setEnrolling(true);
    const response = await languageApi.enrollInLanguage(
      selected.id,
      regionId || undefined,
    );

    if (response.success) {
      setSelectedLanguageId(selected.id);
      if (regionId) {
        setSelectedRegionId(regionId);
      }
      addToast("success", `Inscrito en ${selected.name} correctamente.`);
      onLanguageSelected(selected);
    } else {
      addToast(
        "error",
        response.message || "Ocurrió un error inesperado al inscribirte.",
      );
    }
    setEnrolling(false);
  };

  const handleNext = async (
    languageToEnroll?: Language,
    regionIdOverride?: string,
  ) => {
    let selected: Language | undefined;

    if (showRegionSelection) {
      selected = selectedLanguage || undefined;
    } else {
      selected =
        languageToEnroll || languages.find((l) => l.id === selectedLanguageId);
    }

    if (!selected) {
      addToast("error", "Por favor selecciona un idioma.");
      return;
    }

    if (!token) {
      addToast("error", "No estás autenticado.");
      return;
    }

    if (!showRegionSelection) {
      setSelectedLanguage(selected);
      setIsLanguageFromEnrollment(false);
      const loadResult = await loadRegions(selected.id);

      if (loadResult === "empty") {
        await enrollLanguage(selected, null);
        return;
      }

      setShowRegionSelection(true);
      setTitle("Selecciona tu región:");

      if (loadResult) {
        await enrollLanguage(selected, loadResult.id);
      }
      return;
    }

    const regionId = regionIdOverride ?? selectedRegionId;
    await enrollLanguage(selected, regionId);
  };

  const handleBack = () => {
    setShowRegionSelection(false);
    setSelectedRegionId(null);
    setRegions([]);
    setIsLanguageFromEnrollment(false);
    setTitle("Quiero aprender:");
  };

  return {
    languages,
    regions,
    loading,
    error,
    currentPage,
    setCurrentPage,
    totalPages,
    selectedLanguageId,
    selectedRegionId,
    enrolling,
    title,
    showRegionSelection,
    selectedLanguage,
    isLanguageFromEnrollment,
    handleNext,
    handleSelect,
    handleRegionSelect,
    handleBack,
  };
}
