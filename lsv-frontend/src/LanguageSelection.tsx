import { Card, Button, Spinner, Alert, Pagination } from "flowbite-react";
import { useState, useEffect, useRef } from "react";
import { HiExclamationCircle } from "react-icons/hi";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useToast } from "./components/ToastProvider";
import { languageApi, regionApi } from "./services/api";
import { useAuth } from "./context/AuthContext";

interface Language {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

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

interface Region {
  id: string;
  name: string;
  code: string;
  description: string;
  isDefault: boolean;
  language: Language;
  createdAt: string;
  updatedAt: string;
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

interface Props {
  onLanguageSelected: (lang: Language) => void;
}

export default function LanguageSelection({ onLanguageSelected }: Props) {
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
  const effectRan = useRef(false);
  const addToast = useToast();

  useEffect(() => {
    if (effectRan.current === true) return;
    const initialize = async () => {
      if (!token) {
        setError("No estás autenticado.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Verificar si el usuario tiene idiomas y regiones inscritos
        const enrolledResponse = await languageApi.getEnrolledLanguages();

        if (!enrolledResponse.success) {
          throw new Error(
            enrolledResponse.message ||
              "No se pudieron obtener tus idiomas inscritos.",
          );
        }

        const enrolledData: PaginatedEnrolledLanguageResponse =
          enrolledResponse.data;

        if (enrolledData.data.length > 0) {
          // Ya no necesitamos leer manualmente de localStorage
          const storedLanguageId = selectedLanguageId;
          const storedRegionId = selectedRegionId;

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

              setSelectedLanguageId(selectedLanguage.id);
              setSelectedRegionId(selectedRegion.id);
              addToast(
                "success",
                `Continuando con ${selectedLanguage.name} - ${selectedRegion.name}.`,
              );
              onLanguageSelected(selectedLanguage);
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

          if (
            enrolledRegionsResponse.success &&
            enrolledRegionsResponse.data.data.length > 0
          ) {
            // El usuario tiene idioma y región inscritos
            // Precargar sin mostrar el panel
            const firstRegion = enrolledRegionsResponse.data.data[0].region;
            setSelectedLanguageId(firstLanguage.id);
            setSelectedRegionId(firstRegion.id);
            addToast(
              "success",
              `Continuando con ${firstLanguage.name} - ${firstRegion.name}.`,
            );
            onLanguageSelected(firstLanguage);
            return;
          }

          // Si tiene idioma pero no región, mostrar el panel de selección de región
          if (enrolledData.data.length === 1) {
            const enrolledLanguage = enrolledData.data[0].language;
            setSelectedLanguageId(enrolledLanguage.id);
            // Cargar regiones para este idioma y mostrar el panel de selección
            await loadRegions(enrolledLanguage.id);
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

        if (!availableResponse.success) {
          throw new Error(
            availableResponse.message ||
              "No se pudieron obtener los idiomas disponibles.",
          );
        }

        const availableData: PaginatedLanguageResponse = availableResponse.data;

        if (availableData.total === 1 && availableData.data.length === 1) {
          const singleLanguage = availableData.data[0];
          addToast(
            "info",
            `Inscribiéndote en el único idioma disponible: ${singleLanguage.name} `,
          );
          setSelectedLanguageId(singleLanguage.id);
          await handleNext(singleLanguage);
        } else {
          setLanguages(availableData.data);
          setTotalPages(
            Math.max(1, Math.ceil(availableData.total / ITEMS_PER_PAGE)),
          );
        }
      } catch (err: any) {
        setError(err.message);
        addToast("error", err.message);
      } finally {
        setLoading(false);
      }
    };

    initialize().then(() => {
      effectRan.current = true;
    });
  }, [token, currentPage, selectedRegionId]);

  useEffect(() => {
    if (showRegionSelection && selectedRegionId && !enrolling) {
      handleNext();
    }
  }, [showRegionSelection, selectedRegionId, enrolling]);

  const handleSelect = (lang: Language) => {
    setSelectedLanguageId(lang.id);
    setSelectedLanguage(lang);
    addToast("success", `Idioma seleccionado: ${lang.name} `);
  };

  const handleRegionSelect = (region: Region) => {
    setSelectedRegionId(region.id);
    addToast("success", `Región seleccionada: ${region.name} `);
  };

  const loadRegions = async (languageId: string) => {
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
        setShowRegionSelection(false);
        setEnrolling(true);

        // Inscribir sin región si no hay regiones disponibles
        const response = await languageApi.enrollInLanguage(languageId);

        if (response.success) {
          setSelectedLanguageId(languageId);
          addToast(
            "success",
            `Inscrito en ${selectedLanguage?.name} correctamente.`,
          );
          onLanguageSelected(selectedLanguage!);
        } else {
          addToast(
            "error",
            response.message || "Ocurrió un error inesperado al inscribirte.",
          );
        }

        setEnrolling(false);
        return;
      }

      setRegions(languageRegions);

      if (languageRegions.length === 1) {
        setSelectedRegionId(languageRegions[0].id);
        addToast(
          "info",
          `Región automáticamente seleccionada: ${languageRegions[0].name} `,
        );
      }
    } catch (err: any) {
      setError(err.message);
      addToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async (languageToEnroll?: Language) => {
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
      setIsLanguageFromEnrollment(false); // El idioma fue seleccionado en el asistente
      await loadRegions(selected.id);
      setShowRegionSelection(true);
      setTitle("Selecciona tu región:");
      return;
    }

    setEnrolling(true);

    // Inscribir en el idioma con la región seleccionada (si existe)
    const response = await languageApi.enrollInLanguage(
      selected.id,
      selectedRegionId || undefined,
    );

    if (response.success) {
      setSelectedLanguageId(selected.id);
      if (selectedRegionId) {
        setSelectedRegionId(selectedRegionId);
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

  const handleBack = () => {
    setShowRegionSelection(false);
    setSelectedRegionId(null);
    setRegions([]);
    setIsLanguageFromEnrollment(false);
    setTitle("Quiero aprender:");
  };

  return (
    <div className="mx-auto w-full max-w-6xl p-6">
      <h1 className="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-white">
        {title}
      </h1>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Spinner size="xl" />
        </div>
      )}
      {error && (
        <Alert color="failure" icon={HiExclamationCircle}>
          {error}
        </Alert>
      )}

      {!loading && !error && languages.length > 0 && !showRegionSelection && (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {languages.map((lang) => (
              <Card
                key={lang.id}
                onClick={() => handleSelect(lang)}
                className={`cursor - pointer ${selectedLanguageId === lang.id ? "ring-2 ring-blue-500" : ""} `}
              >
                <h5 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {lang.name}
                </h5>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {lang.description}
                </p>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}

          <div className="mt-8 flex justify-center">
            <Button
              onClick={() => handleNext()}
              disabled={!selectedLanguageId || enrolling}
            >
              {enrolling && <Spinner size="sm" className="mr-2" />}
              {enrolling ? "Inscribiendo..." : "Siguiente"}
            </Button>
          </div>
        </>
      )}

      {!loading && !error && showRegionSelection && regions.length > 0 && (
        <>
          {!isLanguageFromEnrollment && (
            <div className="mb-4 text-center">
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Idioma seleccionado:{" "}
                <span className="font-semibold">{selectedLanguage?.name}</span>
              </p>
            </div>
          )}

          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {regions.map((region) => (
              <Card
                key={region.id}
                onClick={() => handleRegionSelect(region)}
                className={`cursor - pointer ${selectedRegionId === region.id ? "ring-2 ring-blue-500" : ""} `}
              >
                <h5 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {region.name}
                </h5>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {region.description}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Código: {region.code}
                </p>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <Button onClick={handleBack} color="gray" disabled={enrolling}>
              Atrás
            </Button>
            <Button
              onClick={() => handleNext()}
              disabled={!selectedRegionId || enrolling}
            >
              {enrolling && <Spinner size="sm" className="mr-2" />}
              {enrolling ? "Inscribiendo..." : "Continuar"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
