import { Card, Button, Spinner, Alert, Pagination } from "flowbite-react";
import { useState, useEffect, useRef } from "react";
import { BACKEND_BASE_URL } from "./config";
import { HiExclamationCircle } from "react-icons/hi";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useToast } from "./components/ToastProvider";

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

const ITEMS_PER_PAGE = 8;

interface Props {
  onLanguageSelected: (lang: Language) => void;
}

export default function LanguageSelection({ onLanguageSelected }: Props) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLanguageId, setSelectedLanguageId] = useLocalStorage<
    string | null
  >("selectedLanguageId", null);
  const [enrolling, setEnrolling] = useState(false);
  const [token] = useLocalStorage<string | null>("auth", null);
  const [title, setTitle] = useState("Quiero aprender:");
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
        const enrolledRes = await fetch(
          `${BACKEND_BASE_URL}/users/enrolled-languages`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!enrolledRes.ok) {
          throw new Error("No se pudieron obtener tus idiomas inscritos.");
        }

        const enrolledData: PaginatedEnrolledLanguageResponse =
          await enrolledRes.json();

        if (enrolledData.data.length > 0) {
          if (enrolledData.data.length === 1) {
            const enrolledLanguage = enrolledData.data[0].language;
            addToast("success", `Continuando con ${enrolledLanguage.name}.`);
            onLanguageSelected(enrolledLanguage);
            return;
          } else {
            setTitle("Continuar aprendiendo:");
            setLanguages(enrolledData.data.map((el) => el.language));
            setTotalPages(1);
            setLoading(false);
            return;
          }
        }
        const availableRes = await fetch(
          `${BACKEND_BASE_URL}/languages?page=${currentPage}&limit=${ITEMS_PER_PAGE}&orderBy=name&sortOrder=ASC`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (!availableRes.ok) throw new Error(await availableRes.text());

        const availableData: PaginatedLanguageResponse =
          await availableRes.json();

        if (availableData.total === 1 && availableData.data.length === 1) {
          const singleLanguage = availableData.data[0];
          addToast(
            "info",
            `Inscribiéndote en el único idioma disponible: ${singleLanguage.name}`,
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
  }, [token, currentPage]);

  const handleSelect = (lang: Language) => {
    setSelectedLanguageId(lang.id);
    addToast("success", `Idioma seleccionado: ${lang.name}`);
  };

  const handleNext = async (languageToEnroll?: Language) => {
    const selected =
      languageToEnroll || languages.find((l) => l.id === selectedLanguageId);
    if (!selected) {
      addToast("error", "Por favor selecciona un idioma.");
      return;
    }

    if (!token) {
      addToast("error", "No estás autenticado.");
      return;
    }

    setEnrolling(true);
    try {
      const res = await fetch(`${BACKEND_BASE_URL}/users/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ languageId: selected.id }),
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ message: "Error al inscribirse en el idioma." }));
        throw new Error(errorData.message);
      }
      addToast("success", `Inscrito en ${selected.name} correctamente.`);
      onLanguageSelected(selected);
    } catch (err: any) {
      addToast(
        "error",
        err.message || "Ocurrió un error inesperado al inscribirte.",
      );
    } finally {
      setEnrolling(false);
    }
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

      {!loading && !error && languages.length > 0 && (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {languages.map((lang) => (
              <Card
                key={lang.id}
                onClick={() => handleSelect(lang)}
                className={`cursor-pointer ${selectedLanguageId === lang.id ? "ring-2 ring-blue-500" : ""}`}
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
              isProcessing={enrolling}
            >
              {enrolling ? "Inscribiendo..." : "Siguiente"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
