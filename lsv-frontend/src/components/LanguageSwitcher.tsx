import { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Spinner,
  Alert,
  Select,
  Tabs,
  Card,
} from "flowbite-react";
import {
  HiExclamationCircle,
  HiTranslate,
  HiPlus,
  HiCheckCircle,
  HiXCircle,
  HiLocationMarker,
  HiTrash,
} from "react-icons/hi";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useToast } from "./ToastProvider";
import { languageApi, regionApi } from "../services/api";

interface Language {
  id: string;
  name: string;
  description: string;
  countryCode?: string;
  createdAt: string;
  updatedAt: string;
}

interface EnrolledLanguage {
  language: Language;
  enrolledRegions?: EnrolledRegion[];
}

interface PaginatedEnrolledLanguageResponse {
  data: EnrolledLanguage[];
}

interface PaginatedLanguageResponse {
  data: Language[];
  total: number;
  page: number;
  pageSize: number;
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

interface PaginatedEnrolledRegionResponse {
  data: EnrolledRegion[];
  total: number;
  page: number;
  pageSize: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLanguageChanged: (language: Language) => void;
}

export default function LanguageSwitcher({
  isOpen,
  onClose,
  onLanguageChanged,
}: Props) {
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
  const [activeTab, setActiveTab] = useState(0);
  const [showRegionSelectionForSwitch, setShowRegionSelectionForSwitch] =
    useState(false);
  const [showRegionEnrollment, setShowRegionEnrollment] = useState(false);
  const addToast = useToast();

  useEffect(() => {
    if (isOpen) {
      loadEnrolledLanguages();
      loadAvailableLanguages();
      // Resetear estados internos cuando se abre el modal
      setShowRegionSelection(false);
      setShowRegionEnrollment(false);
      setShowRegionSelectionForSwitch(false);
      setSelectedLanguageForEnroll(null);
      setSelectedLanguageForRegion(null);
    }
  }, [isOpen]);

  const loadEnrolledLanguages = async () => {
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
    } catch (err: any) {
      setError(err.message);
      addToast("error", err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableLanguages = async () => {
    try {
      const response = await languageApi.getAvailableLanguages(1, 100);

      if (!response.success) {
        throw new Error(
          response.message || "No se pudieron obtener los idiomas disponibles.",
        );
      }

      const availableData: PaginatedLanguageResponse = response.data;
      setAvailableLanguages(availableData.data);
    } catch (err: any) {
      if (import.meta.env.DEV) {
        console.error("Error loading available languages:", err);
      }
    }
  };

  const getFilteredAvailableLanguages = () => {
    const enrolledLanguageIds = languages.map((lang) => lang.id);
    // Solo filtrar los idiomas en los que ya está inscrito
    // Permitir inscribirse en cualquier otro idioma disponible
    return availableLanguages.filter(
      (lang) => !enrolledLanguageIds.includes(lang.id),
    );
  };

  const loadRegions = async (
    languageId: string,
    forEnrollment: boolean = false,
  ) => {
    try {
      setLoading(true);

      let regionsToSet: Region[] = [];

      if (forEnrollment) {
        // Para inscripción: obtener todas las regiones disponibles del idioma
        const response = await regionApi.getRegions(1, 100, languageId);
        if (!response.success) {
          throw new Error(
            response.message || "No se pudieron obtener las regiones.",
          );
        }
        const regionData: PaginatedRegionResponse = response.data;
        regionsToSet = regionData.data;
      } else {
        // Para cambiar idioma: obtener solo las regiones inscritas del usuario para ese idioma
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
    } catch (err: any) {
      addToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = async (languageId: string) => {
    setSelectedLanguageId(languageId);
    setSelectedRegionId(null);

    if (languageId) {
      // Para cambiar idioma: usar regiones inscritas (forEnrollment = false)
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
      // Guardar los datos del idioma antes de limpiar el estado
      const languageIdToSave = selectedLanguageForEnroll.id;
      const languageNameToSave = selectedLanguageForEnroll.name;
      const languageToSave = selectedLanguageForEnroll;
      const regionIdToSave = selectedRegionId;

      const response = await languageApi.enrollInLanguage(
        selectedLanguageForEnroll.id,
        regionIdToSave || undefined,
      );

      if (response.success) {
        // Actualizar el idioma y región seleccionados en localStorage
        setSelectedLanguageId(languageIdToSave);
        if (regionIdToSave) {
          setSelectedRegionId(regionIdToSave);
        }

        // Disparar evento para actualizar el dashboard
        window.dispatchEvent(new CustomEvent("userDataUpdated"));

        // Recargar idiomas inscritos para obtener el idioma completo
        const enrolledLangs = await loadEnrolledLanguages();
        await loadAvailableLanguages();

        // Buscar el idioma recién inscrito en la lista actualizada
        const newLanguage = enrolledLangs.find(
          (lang) => lang.id === languageIdToSave,
        );

        // Limpiar el estado del formulario
        setSelectedLanguageForEnroll(null);
        setSelectedRegionId(null);
        setShowRegionSelection(false);
        setRegions([]);

        addToast(
          "success",
          `¡Perfecto! Te has inscrito en ${languageNameToSave} correctamente.`,
        );

        // Notificar al componente padre y cerrar el modal
        if (newLanguage) {
          onLanguageChanged(newLanguage);
        } else {
          // Si no encontramos el idioma, usar el que guardamos
          onLanguageChanged(languageToSave);
        }
        onClose();
      } else {
        addToast(
          "error",
          response.message || "Ocurrió un error inesperado al inscribirte.",
        );
      }
    } catch (err: any) {
      addToast("error", "Error al inscribirse en el idioma.");
    } finally {
      setEnrolling(false);
    }
  };

  const handleBack = () => {
    setShowRegionSelection(false);
    setSelectedRegionId(null);
    setRegions([]);
    // Mantener la pestaña activa
    setActiveTab(1);
  };

  const handleBackForSwitch = () => {
    setShowRegionSelectionForSwitch(false);
    setSelectedRegionId(null);
    setRegions([]);
    // Mantener la pestaña activa
    setActiveTab(0);
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
      onClose();
    } catch (err: any) {
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
      onClose();
    } catch (err: any) {
      addToast("error", "Error al cambiar idioma.");
    } finally {
      setSwitching(false);
    }
  };

  const handleEnrollInRegion = async (language: Language) => {
    setSelectedLanguageForRegion(language);
    await loadRegions(language.id, true);
    setShowRegionEnrollment(true);
    // Mantener la pestaña activa
    setActiveTab(2);
  };

  const handleEnrollRegion = async () => {
    if (!selectedLanguageForRegion || !selectedRegionId) {
      addToast("error", "Por favor selecciona una región.");
      return;
    }

    setEnrollingRegion(true);

    try {
      const response = await languageApi.enrollInRegion(selectedRegionId);

      if (response.success) {
        addToast("success", `Te has inscrito en la región correctamente.`);
        await loadEnrolledLanguages();
        setShowRegionEnrollment(false);
        setSelectedLanguageForRegion(null);
        setSelectedRegionId(null);
        setRegions([]);
        // Mantener la pestaña activa después de inscribirse
        setActiveTab(2);
      } else {
        addToast(
          "error",
          response.message || "Error al inscribirse en la región.",
        );
      }
    } catch (err: any) {
      addToast("error", "Error al inscribirse en la región.");
    } finally {
      setEnrollingRegion(false);
    }
  };

  const handleSwitchRegion = async (regionId: string) => {
    setSelectedRegionId(regionId);
    window.dispatchEvent(new CustomEvent("userDataUpdated"));
    addToast("success", "Región cambiada correctamente.");
    onClose();
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
        // Si el idioma eliminado era el seleccionado, limpiar la selección
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
    } catch (err: any) {
      addToast("error", err.message || "Error al desinscribirse del idioma.");
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
        // Si la región eliminada era la seleccionada, limpiar la selección
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
    } catch (err: any) {
      addToast("error", err.message || "Error al desinscribirse de la región.");
    } finally {
      setLoading(false);
    }
  };

  const currentLanguage = languages.find(
    (lang) => lang.id === selectedLanguageId,
  );

  return (
    <Modal show={isOpen} onClose={onClose} size="lg">
      <Modal.Header>
        <div className="flex items-center gap-2">
          <HiTranslate className="size-5 text-gray-600 dark:text-gray-400" />
          Gestión de Idiomas
        </div>
      </Modal.Header>

      <Modal.Body>
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
            <span className="ml-2">Cargando...</span>
          </div>
        )}

        {error && (
          <Alert color="failure" icon={HiExclamationCircle} className="mb-4">
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <Tabs aria-label="Language management tabs">
            <Tabs.Item
              title="Cambiar Idioma"
              icon={HiTranslate}
              active={activeTab === 0}
              onClick={() => setActiveTab(0)}
            >
              <div className="space-y-4">
                {languages.length > 0 ? (
                  <>
                    {!showRegionSelectionForSwitch ? (
                      <>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Selecciona un idioma:
                          </label>
                          <Select
                            value={selectedLanguageId || ""}
                            onChange={(e) =>
                              handleLanguageChange(e.target.value)
                            }
                          >
                            <option value="" disabled>
                              Selecciona un idioma
                            </option>
                            {languages.map((language) => (
                              <option key={language.id} value={language.id}>
                                {language.name}
                              </option>
                            ))}
                          </Select>
                        </div>

                        {currentLanguage && (
                          <>
                            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                              <div className="flex items-start justify-between">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                  <span className="font-medium">
                                    Descripción:
                                  </span>{" "}
                                  {currentLanguage.description}
                                </p>
                                {languages.length > 1 && (
                                  <button
                                    onClick={() =>
                                      handleUnenrollLanguage(currentLanguage.id)
                                    }
                                    className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                    title="Desinscribirse de este idioma"
                                    disabled={loading}
                                  >
                                    <HiTrash className="size-5" />
                                  </button>
                                )}
                              </div>
                            </div>
                            {(() => {
                              const enrolledRegions =
                                getEnrolledRegionsForLanguage(
                                  currentLanguage.id,
                                );
                              if (enrolledRegions.length > 0) {
                                return (
                                  <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
                                    <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Regiones Inscritas (
                                      {enrolledRegions.length}):
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                      {enrolledRegions.map((enrolledRegion) => {
                                        const isActive =
                                          enrolledRegion.region.id ===
                                          selectedRegionId;
                                        return (
                                          <span
                                            key={enrolledRegion.region.id}
                                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                                              isActive
                                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                            }`}
                                          >
                                            {enrolledRegion.region.name}
                                            {isActive && (
                                              <HiCheckCircle className="size-3" />
                                            )}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleUnenrollRegion(
                                                  enrolledRegion.region.id,
                                                );
                                              }}
                                              className="ml-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                              title="Desinscribirse de esta región"
                                              disabled={loading}
                                            >
                                              <HiTrash className="size-3" />
                                            </button>
                                          </span>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </>
                        )}

                        <div className="flex justify-end gap-2 pt-4">
                          <Button
                            color="gray"
                            onClick={onClose}
                            disabled={switching}
                          >
                            Cerrar
                          </Button>
                          <Button
                            onClick={handleSwitchLanguage}
                            disabled={!selectedLanguageId || switching}
                            isProcessing={switching}
                          >
                            {switching ? "Cambiando..." : "Cambiar Idioma"}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="mb-4">
                          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                            Selecciona tu Región
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Idioma:{" "}
                            <span className="font-semibold">
                              {currentLanguage?.name}
                            </span>
                          </p>
                        </div>

                        {regions.length > 0 ? (
                          <>
                            {(() => {
                              const currentRegion = regions.find(
                                (r) => r.id === selectedRegionId,
                              );
                              const otherRegions = regions.filter(
                                (r) => r.id !== selectedRegionId,
                              );

                              return (
                                <>
                                  {currentRegion && (
                                    <div className="mb-4">
                                      <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Tu Región Actual
                                      </h4>
                                      <Card
                                        onClick={() =>
                                          handleRegionSelect(currentRegion)
                                        }
                                        className={`cursor-pointer bg-blue-50 ring-2 ring-blue-500 transition-colors dark:bg-blue-900/20`}
                                      >
                                        <div className="p-3">
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2">
                                                <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                  {currentRegion.name}
                                                </h5>
                                                <HiCheckCircle className="size-5 text-green-500" />
                                              </div>
                                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {currentRegion.description}
                                              </p>
                                              <p className="text-xs text-gray-500 dark:text-gray-500">
                                                Código: {currentRegion.code}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      </Card>
                                    </div>
                                  )}

                                  {otherRegions.length > 0 && (
                                    <div className="mb-4">
                                      <h4 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {currentRegion
                                          ? "Otras Regiones Disponibles"
                                          : "Regiones Disponibles"}
                                      </h4>
                                      <div className="grid max-h-60 grid-cols-1 gap-3 overflow-y-auto">
                                        {otherRegions.map((region) => (
                                          <Card
                                            key={region.id}
                                            onClick={() =>
                                              handleRegionSelect(region)
                                            }
                                            className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                              selectedRegionId === region.id
                                                ? "bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-900/20"
                                                : ""
                                            }`}
                                          >
                                            <div className="p-3">
                                              <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                  <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    {region.name}
                                                  </h5>
                                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {region.description}
                                                  </p>
                                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                                    Código: {region.code}
                                                  </p>
                                                </div>
                                                {!currentRegion && (
                                                  <HiXCircle className="ml-2 size-5 flex-shrink-0 text-gray-400" />
                                                )}
                                              </div>
                                            </div>
                                          </Card>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </>
                              );
                            })()}

                            <div className="flex justify-between gap-2 pt-4">
                              <Button
                                color="gray"
                                onClick={handleBackForSwitch}
                                disabled={switching}
                              >
                                Atrás
                              </Button>
                              <Button
                                onClick={handleSwitchWithRegion}
                                disabled={!selectedRegionId || switching}
                                isProcessing={switching}
                              >
                                {switching ? "Cambiando..." : "Cambiar Idioma"}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="py-8 text-center">
                            <p className="mb-4 text-gray-500 dark:text-gray-400">
                              No hay regiones disponibles para este idioma.
                            </p>
                            <div className="flex justify-between gap-2">
                              <Button
                                color="gray"
                                onClick={handleBackForSwitch}
                                disabled={switching}
                              >
                                Atrás
                              </Button>
                              <Button
                                onClick={handleSwitchWithRegion}
                                disabled={switching}
                                isProcessing={switching}
                              >
                                {switching
                                  ? "Cambiando..."
                                  : "Continuar sin Región"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      No tienes idiomas inscritos.
                    </p>
                  </div>
                )}
              </div>
            </Tabs.Item>

            <Tabs.Item
              title="Inscribirse en Nuevo Idioma"
              icon={HiPlus}
              active={activeTab === 1}
              onClick={() => setActiveTab(1)}
            >
              <div className="space-y-4">
                {!showRegionSelection ? (
                  <>
                    {getFilteredAvailableLanguages().length > 0 ? (
                      <>
                        <div className="mb-4">
                          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                            Idiomas Disponibles
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Selecciona un idioma para inscribirte
                          </p>
                        </div>

                        <div className="grid max-h-60 grid-cols-1 gap-3 overflow-y-auto">
                          {getFilteredAvailableLanguages().map((language) => (
                            <Card
                              key={language.id}
                              onClick={() => handleLanguageSelect(language)}
                              className={`cursor-pointer transition-colors ${
                                selectedLanguageForEnroll?.id === language.id
                                  ? "bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-900/20"
                                  : "hover:bg-gray-50 dark:hover:bg-gray-700"
                              }`}
                            >
                              <div className="p-3">
                                <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {language.name}
                                </h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {language.description}
                                </p>
                              </div>
                            </Card>
                          ))}
                        </div>

                        {selectedLanguageForEnroll && (
                          <div className="flex justify-end gap-2 pt-4">
                            <Button
                              color="gray"
                              onClick={() => setSelectedLanguageForEnroll(null)}
                              disabled={enrolling}
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={async () => {
                                // Para inscripción: usar todas las regiones disponibles (forEnrollment = true)
                                await loadRegions(
                                  selectedLanguageForEnroll.id,
                                  true,
                                );
                                setShowRegionSelection(true);
                                // Mantener la pestaña activa
                                setActiveTab(1);
                              }}
                              disabled={enrolling}
                            >
                              Siguiente
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400">
                          No hay idiomas disponibles para inscribirse.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                        Selecciona tu Región
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Idioma:{" "}
                        <span className="font-semibold">
                          {selectedLanguageForEnroll?.name}
                        </span>
                      </p>
                    </div>

                    {regions.length > 0 ? (
                      <>
                        <div className="mb-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Selecciona una región para este nuevo idioma. Podrás
                            cambiar de región más adelante.
                          </p>
                        </div>
                        <div className="grid max-h-60 grid-cols-1 gap-3 overflow-y-auto">
                          {regions.map((region) => (
                            <Card
                              key={region.id}
                              onClick={() => handleRegionSelect(region)}
                              className={`cursor-pointer transition-colors ${
                                selectedRegionId === region.id
                                  ? "bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-900/20"
                                  : "hover:bg-gray-50 dark:hover:bg-gray-700"
                              }`}
                            >
                              <div className="p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                                      {region.name}
                                    </h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {region.description}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                      Código: {region.code}
                                    </p>
                                  </div>
                                  {selectedRegionId !== region.id && (
                                    <HiXCircle className="ml-2 size-5 flex-shrink-0 text-gray-400" />
                                  )}
                                  {selectedRegionId === region.id && (
                                    <HiCheckCircle className="ml-2 size-5 flex-shrink-0 text-green-500" />
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>

                        <div className="flex justify-between gap-2 pt-4">
                          <Button
                            color="gray"
                            onClick={handleBack}
                            disabled={enrolling}
                          >
                            Atrás
                          </Button>
                          <Button
                            onClick={handleEnroll}
                            disabled={!selectedRegionId || enrolling}
                            isProcessing={enrolling}
                          >
                            {enrolling ? "Inscribiendo..." : "Inscribirse"}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="mb-4 text-gray-500 dark:text-gray-400">
                          No hay regiones disponibles para este idioma.
                        </p>
                        <div className="flex justify-between gap-2">
                          <Button
                            color="gray"
                            onClick={handleBack}
                            disabled={enrolling}
                          >
                            Atrás
                          </Button>
                          <Button
                            onClick={handleEnroll}
                            disabled={enrolling}
                            isProcessing={enrolling}
                          >
                            {enrolling
                              ? "Inscribiendo..."
                              : "Continuar sin Región"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Tabs.Item>

            <Tabs.Item
              title="Gestionar Regiones"
              icon={HiLocationMarker}
              active={activeTab === 2}
              onClick={() => setActiveTab(2)}
            >
              <div className="space-y-4">
                {!showRegionEnrollment ? (
                  <>
                    {languages.length > 0 ? (
                      <>
                        <div className="mb-4">
                          <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                            Tus Idiomas y Regiones
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Gestiona las regiones de tus idiomas inscritos
                          </p>
                        </div>

                        <div className="space-y-4">
                          {languages.map((language) => {
                            const enrolledRegions =
                              getEnrolledRegionsForLanguage(language.id);

                            return (
                              <Card key={language.id} className="p-4">
                                <div className="mb-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {language.name}
                                      </h4>
                                      <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {language.description}
                                      </p>
                                    </div>
                                    {languages.length > 1 && (
                                      <button
                                        onClick={() =>
                                          handleUnenrollLanguage(language.id)
                                        }
                                        className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                        title="Desinscribirse de este idioma"
                                        disabled={loading}
                                      >
                                        <HiTrash className="size-5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {enrolledRegions.length > 0 ? (
                                  <div className="mb-3">
                                    <h5 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                      Regiones Inscritas (
                                      {enrolledRegions.length})
                                    </h5>
                                    <div className="space-y-2">
                                      {enrolledRegions.map((enrolledRegion) => {
                                        const isActive =
                                          enrolledRegion.region.id ===
                                          selectedRegionId;
                                        return (
                                          <div
                                            key={enrolledRegion.region.id}
                                            className={`flex items-center justify-between rounded-lg border p-3 ${
                                              isActive
                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                                                : "border-gray-200 dark:border-gray-700"
                                            }`}
                                          >
                                            <div className="flex-1">
                                              <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                  {enrolledRegion.region.name}
                                                </span>
                                                {isActive && (
                                                  <HiCheckCircle className="size-4 text-green-500" />
                                                )}
                                              </div>
                                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {
                                                  enrolledRegion.region
                                                    .description
                                                }
                                              </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {!isActive && (
                                                <Button
                                                  size="xs"
                                                  onClick={() =>
                                                    handleSwitchRegion(
                                                      enrolledRegion.region.id,
                                                    )
                                                  }
                                                  disabled={switching}
                                                >
                                                  Activar
                                                </Button>
                                              )}
                                              <button
                                                onClick={() =>
                                                  handleUnenrollRegion(
                                                    enrolledRegion.region.id,
                                                  )
                                                }
                                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                title="Desinscribirse de esta región"
                                                disabled={loading}
                                              >
                                                <HiTrash className="size-4" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mb-3 rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                      No tienes regiones inscritas para este
                                      idioma.
                                    </p>
                                  </div>
                                )}

                                <Button
                                  size="sm"
                                  color="light"
                                  onClick={() => handleEnrollInRegion(language)}
                                  disabled={loading}
                                >
                                  <HiPlus className="mr-2 size-4" />
                                  Inscribirse en Nueva Región
                                </Button>
                              </Card>
                            );
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400">
                          No tienes idiomas inscritos.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">
                        Selecciona una Nueva Región
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Idioma:{" "}
                        <span className="font-semibold">
                          {selectedLanguageForRegion?.name}
                        </span>
                      </p>
                    </div>

                    {regions.length > 0 ? (
                      <>
                        <div className="grid max-h-60 grid-cols-1 gap-3 overflow-y-auto">
                          {regions.map((region) => (
                            <Card
                              key={region.id}
                              onClick={() => handleRegionSelect(region)}
                              className={`cursor-pointer transition-colors ${
                                selectedRegionId === region.id
                                  ? "bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-900/20"
                                  : "hover:bg-gray-50 dark:hover:bg-gray-700"
                              }`}
                            >
                              <div className="p-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                                      {region.name}
                                    </h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {region.description}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500">
                                      Código: {region.code}
                                    </p>
                                  </div>
                                  {selectedRegionId === region.id ? (
                                    <HiCheckCircle className="ml-2 size-5 flex-shrink-0 text-green-500" />
                                  ) : (
                                    <HiXCircle className="ml-2 size-5 flex-shrink-0 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>

                        <div className="flex justify-between gap-2 pt-4">
                          <Button
                            color="gray"
                            onClick={() => {
                              setShowRegionEnrollment(false);
                              setSelectedLanguageForRegion(null);
                              setSelectedRegionId(null);
                              setRegions([]);
                              // Mantener la pestaña activa
                              setActiveTab(2);
                            }}
                            disabled={enrollingRegion}
                          >
                            Atrás
                          </Button>
                          <Button
                            onClick={handleEnrollRegion}
                            disabled={!selectedRegionId || enrollingRegion}
                            isProcessing={enrollingRegion}
                          >
                            {enrollingRegion
                              ? "Inscribiendo..."
                              : "Inscribirse"}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="mb-4 text-gray-500 dark:text-gray-400">
                          No hay regiones disponibles para inscribirse en este
                          idioma.
                        </p>
                        <div className="flex justify-between gap-2">
                          <Button
                            color="gray"
                            onClick={() => {
                              setShowRegionEnrollment(false);
                              setSelectedLanguageForRegion(null);
                              setRegions([]);
                              // Mantener la pestaña activa
                              setActiveTab(2);
                            }}
                            disabled={enrollingRegion}
                          >
                            Atrás
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Tabs.Item>
          </Tabs>
        )}
      </Modal.Body>
    </Modal>
  );
}
