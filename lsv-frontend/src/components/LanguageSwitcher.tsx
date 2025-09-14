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
import { HiExclamationCircle, HiTranslate, HiPlus } from "react-icons/hi";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useToast } from "./ToastProvider";
import { languageApi, regionApi } from "../services/api";

interface Language {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface EnrolledLanguage {
  language: Language;
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
  const [showRegionSelection, setShowRegionSelection] = useState(false);
  const [selectedLanguageForEnroll, setSelectedLanguageForEnroll] =
    useState<Language | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [showRegionSelectionForSwitch, setShowRegionSelectionForSwitch] =
    useState(false);
  const addToast = useToast();

  useEffect(() => {
    if (isOpen) {
      loadEnrolledLanguages();
      loadAvailableLanguages();
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
      setLanguages(enrolledData.data.map((el) => el.language));
    } catch (err: any) {
      setError(err.message);
      addToast("error", err.message);
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
    return availableLanguages.filter(
      (lang) => !enrolledLanguageIds.includes(lang.id),
    );
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
      setRegions(regionData.data);

      if (regionData.data.length === 1) {
        setSelectedRegionId(regionData.data[0].id);
        addToast(
          "info",
          `Región automáticamente seleccionada: ${regionData.data[0].name}`,
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
      await loadRegions(languageId);
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
      const response = await languageApi.enrollInLanguage(
        selectedLanguageForEnroll.id,
      );

      if (response.success) {
        addToast(
          "success",
          `Inscrito en ${selectedLanguageForEnroll.name} correctamente.`,
        );
        await loadEnrolledLanguages();
        await loadAvailableLanguages();

        setSelectedLanguageForEnroll(null);
        setSelectedRegionId(null);
        setShowRegionSelection(false);
        setRegions([]);

        setSelectedLanguageId(selectedLanguageForEnroll.id);

        setActiveTab(0);

        addToast(
          "success",
          `¡Perfecto! Te has inscrito en ${selectedLanguageForEnroll.name}. Ahora puedes cambiarlo desde la pestaña "Cambiar Idioma".`,
        );
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
  };

  const handleBackForSwitch = () => {
    setShowRegionSelectionForSwitch(false);
    setSelectedRegionId(null);
    setRegions([]);
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
                          <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              <span className="font-medium">Descripción:</span>{" "}
                              {currentLanguage.description}
                            </p>
                          </div>
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
                                </Card>
                              ))}
                            </div>

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
                              onClick={() => {
                                loadRegions(selectedLanguageForEnroll.id);
                                setShowRegionSelection(true);
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
          </Tabs>
        )}
      </Modal.Body>
    </Modal>
  );
}
