import { Card, Button, Spinner, Alert, Toast, Pagination } from "flowbite-react";
import { useState, useEffect } from "react";
import { BACKEND_BASE_URL } from "./config";
import { HiExclamationCircle, HiCheck, HiX } from "react-icons/hi";
import { useNavigate } from "react-router-dom";

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

const ITEMS_PER_PAGE = 8;

export default function LanguageCards() {
  const navigate = useNavigate();
  const [toastMessages, setToastMessages] = useState<
    { id: number; type: "success" | "error"; message: string }[]
  >([]);

  const addToast = (type: "success" | "error", message: string) => {
    const id = Date.now();
    setToastMessages((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToastMessages((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    const fetchLanguages = async () => {
      const token = localStorage.getItem("auth");
      if (!token || token === "undefined") {
        setError("No estás autenticado. Redirigiendo al login...");
        addToast("error", "No estás autenticado. Redirigiendo al login...");
        setLoading(false);
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      setLoading(true);
      setError(null);

      const apiUrl = `${BACKEND_BASE_URL}/languages?page=${currentPage}&limit=${ITEMS_PER_PAGE}&orderBy=name&sortOrder=ASC`;

      try {
        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          let errorMsg = `Error ${response.status}: ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorMsg;
          } catch (jsonError) { /* Ignora */ }
          throw new Error(errorMsg);
        }

        const responseData: PaginatedLanguageResponse = await response.json();        
        setLanguages(responseData.data);

        const calculatedTotalPages = Math.ceil(responseData.total / ITEMS_PER_PAGE);
        setTotalPages(calculatedTotalPages > 0 ? calculatedTotalPages : 1);

        if (responseData.page !== currentPage && responseData.total > 0) {
             console.warn(`API returned page ${responseData.page} but expected ${currentPage}. Adjusting.`);
        }


      } catch (err: any) {
        console.error("Error fetching languages:", err);
        setError(err.message || "Ocurrió un error al cargar los idiomas.");
        addToast("error", err.message || "Ocurrió un error al cargar los idiomas.");
        setLanguages([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, [currentPage, navigate]);

  const onPageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectLanguage = (languageId: string) => {
    setSelectedLanguageId(languageId);
    addToast("success", `Idioma seleccionado: ${name}`);
  };

  const handleNext = () => {
    if (!selectedLanguageId) {
      addToast("error", "Por favor, selecciona un idioma antes de continuar.");
      return;
    }
    setIsSaving(true);
    try {
      localStorage.setItem("selectedLanguageId", selectedLanguageId);
      addToast("success", `Idioma seleccionado guardado localmente.`);
    } catch (saveError) {
      console.error("Error al guardar en localStorage:", saveError);
      setError("No se pudo guardar la selección.");
      addToast("error", "No se pudo guardar la selección.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed right-5 top-5 z-50 flex flex-col gap-3">
        {toastMessages.map((toast) => (
          <Toast key={toast.id}>
            <div
              className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${
                toast.type === "success"
                  ? "bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200"
                  : "bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200"
              }`}
            >
              {toast.type === "success" ? <HiCheck className="size-5" /> : <HiX className="size-5" />}
            </div>
            <div className="ml-3 text-sm font-normal">{toast.message}</div>
            <Toast.Toggle onDismiss={() => setToastMessages((prev) => prev.filter((t) => t.id !== toast.id))} />
          </Toast>
        ))}
      </div>

      <div className="mx-auto w-full max-w-6xl p-6">
        <h1 className="mb-8 text-center text-2xl font-bold text-gray-700 dark:text-gray-300">
          Quiero aprender:
        </h1>

        {loading && (
          <div className="py-10 text-center">
            <Spinner size="xl" aria-label="Cargando idiomas..." />
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Cargando idiomas...
            </p>
          </div>
        )}

        {error && !loading && (
          <Alert color="failure" icon={HiExclamationCircle} className="mb-4">
            <span className="font-medium">Error!</span> {error}
          </Alert>
        )}
        
        {!loading && !error && languages.length > 0 && (
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {languages.map((lang) => (
              <Card
                key={lang.id}
                className={`cursor-pointer text-center transition-all duration-200 ease-in-out hover:shadow-lg dark:hover:bg-gray-700
                           ${
                             selectedLanguageId === lang.id
                               ? "border-transparent ring-2 ring-blue-500 dark:ring-blue-400"
                               : "border border-gray-200 dark:border-gray-700"
                           }`}
                onClick={() => handleSelectLanguage(lang.id)}
              >
                <h5 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                  {lang.name}
                </h5>
                 <p className="text-sm text-gray-500 dark:text-gray-400">{lang.description}</p>
              </Card>
            ))}
          </div>
        )}

        {!loading && !error && languages.length === 0 && (
          <div className="py-10 text-center text-gray-500 dark:text-gray-400">
            No se encontraron idiomas.
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              showIcons
            />
          </div>
        )}

        {!loading && !error && languages.length > 0 && (
          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleNext}
              disabled={!selectedLanguageId || isSaving}
              isProcessing={isSaving}
              color="blue"
            >
              {isSaving ? "Guardando..." : "Siguiente"}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
