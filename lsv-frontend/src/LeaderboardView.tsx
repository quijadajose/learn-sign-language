import React, { useState, useEffect, useCallback } from "react";
import { Spinner, Alert, Pagination } from "flowbite-react";
import { leaderboardApi, languageApi, unwrapApiList } from "./services/api";
import { HiStar } from "react-icons/hi";
import { LeaderboardFiltersPanel } from "./LeaderboardFiltersPanel";
import { LeaderboardEntryRow } from "./LeaderboardEntryRow";

interface LeaderboardEntry {
  userId: string;
  firstName: string;
  lastName: string;
  totalScore: number;
}

interface PaginatedResponse {
  data: LeaderboardEntry[];
  total: number;
  page: number;
  pageSize: number;
}

interface Language {
  id: string;
  name: string;
}

const LeaderboardView: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    [],
  );
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);

  const [selectedLanguage, setSelectedLanguage] = useState<string>("global");
  const [orderBy, setOrderBy] = useState<string>("totalScore");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");

  const fetchLanguages = useCallback(async () => {
    try {
      const response = await languageApi.getAllLanguages();
      if (response.success) {
        setLanguages(unwrapApiList<Language>(response.data));
      }
    } catch (err) {
      console.error("Error fetching languages:", err);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response =
        selectedLanguage === "global"
          ? await leaderboardApi.getLeaderboard(
              currentPage,
              pageSize,
              orderBy,
              sortOrder,
            )
          : await leaderboardApi.getLeaderboardByLanguage(
              selectedLanguage,
              currentPage,
              pageSize,
              orderBy,
              sortOrder,
            );

      if (response.success) {
        const data: PaginatedResponse = response.data;
        setLeaderboardData(data.data);
        setTotalEntries(data.total);
        setTotalPages(Math.ceil(data.total / data.pageSize));
      } else {
        setError(response.message || "Error al cargar el leaderboard");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar el leaderboard",
      );
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, selectedLanguage, orderBy, sortOrder]);

  useEffect(() => {
    void fetchLanguages();
  }, [fetchLanguages]);

  useEffect(() => {
    void fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getRank = (index: number) => (currentPage - 1) * pageSize + index + 1;

  if (loading && leaderboardData.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Spinner size="xl" />
        <p className="animate-pulse text-gray-400">Cargando clasificación...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex size-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 shadow-xl ring-1 ring-indigo-500/20 dark:text-indigo-400">
          <HiStar className="size-10" />
        </div>
        <h1 className="mb-3 text-4xl font-black tracking-tight text-gray-900 dark:text-white md:text-5xl">
          Leaderboard
        </h1>
        <p className="mx-auto max-w-xl text-lg font-medium text-gray-500 dark:text-gray-400">
          Descubre quiénes lideran el aprendizaje y únete a la competencia.
          ¡Sigue practicando para subir de nivel!
        </p>
      </div>

      <LeaderboardFiltersPanel
        languages={languages}
        selectedLanguage={selectedLanguage}
        pageSize={pageSize}
        orderBy={orderBy}
        sortOrder={sortOrder}
        onLanguageChange={(value) => {
          setSelectedLanguage(value);
          setCurrentPage(1);
        }}
        onPageSizeChange={(value) => {
          setPageSize(value);
          setCurrentPage(1);
        }}
        onOrderByChange={(value) => {
          setOrderBy(value);
          setCurrentPage(1);
        }}
        onSortOrderChange={(value) => {
          setSortOrder(value);
          setCurrentPage(1);
        }}
      />

      {error && (
        <Alert
          color="failure"
          className="mb-6 rounded-2xl border-red-500/20 bg-red-500/10 text-red-900 dark:text-red-200"
        >
          <HiStar className="mr-2 size-5" /> {error}
        </Alert>
      )}

      <div className="space-y-3">
        {leaderboardData.length === 0 && !loading && (
          <div className="rounded-3xl border border-gray-200 bg-white/40 p-12 text-center font-medium text-gray-500 dark:border-gray-700/60 dark:bg-gray-800/40 dark:text-gray-400">
            No se encontraron usuarios en esta clasificación.
          </div>
        )}

        {leaderboardData.map((entry, index) => (
          <LeaderboardEntryRow
            key={entry.userId}
            entry={entry}
            rank={getRank(index)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-10 flex flex-col items-center justify-between gap-6 border-t border-gray-100 pt-8 dark:border-gray-800 sm:flex-row">
          <p className="text-sm font-semibold text-gray-400">
            Mostrando{" "}
            <span className="text-gray-700 dark:text-gray-300">
              {(currentPage - 1) * pageSize + 1}
            </span>{" "}
            a{" "}
            <span className="text-gray-700 dark:text-gray-300">
              {Math.min(currentPage * pageSize, totalEntries)}
            </span>{" "}
            de{" "}
            <span className="text-gray-700 dark:text-gray-300">
              {totalEntries}
            </span>{" "}
            leyendas
          </p>
          <div className="flex overflow-x-auto sm:justify-center">
            <Pagination
              layout="pagination"
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              previousLabel="Anterior"
              nextLabel="Siguiente"
              showIcons
              theme={{
                base: "",
                layout: {
                  table: {
                    base: "text-sm text-gray-700 dark:text-gray-400",
                    span: "font-semibold text-gray-900 dark:text-white",
                  },
                },
                pages: {
                  base: "xs:mt-0 mt-2 inline-flex items-center -space-x-px",
                  showIcon: "inline-flex items-center justify-center p-1",
                  previous: {
                    base: "ml-0 rounded-l-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white",
                    icon: "size-5",
                  },
                  next: {
                    base: "rounded-r-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white",
                    icon: "size-5",
                  },
                  selector: {
                    base: "w-10 border-x-[0.5px] border-y border-gray-200 bg-white py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white",
                    active:
                      "z-10 border-indigo-600 bg-indigo-600 !text-white text-white hover:bg-indigo-700",
                    disabled: "cursor-not-allowed opacity-50",
                  },
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardView;
