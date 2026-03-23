import React, { useState, useEffect } from "react";
import { Spinner, Alert, Pagination } from "flowbite-react";
import { leaderboardApi, languageApi } from "./services/api";
import { BACKEND_BASE_URL } from "./config";
import {
  HiStar,
  HiGlobeAlt,
  HiSortAscending,
  HiSortDescending,
  HiUserGroup,
  HiLightningBolt,
} from "react-icons/hi";

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

  useEffect(() => {
    fetchLanguages();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [currentPage, pageSize, selectedLanguage, orderBy, sortOrder]);

  const fetchLanguages = async () => {
    try {
      const response = await languageApi.getAllLanguages();
      if (response.success) {
        setLanguages(response.data.data || response.data);
      }
    } catch (err) {
      console.error("Error fetching languages:", err);
    }
  };

  const fetchLeaderboard = async () => {
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
  };

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
      {/* Header Section */}
      <div className="mb-10 text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 shadow-xl ring-1 ring-indigo-500/20 dark:text-indigo-400">
          <HiStar className="h-10 w-10" />
        </div>
        <h1 className="mb-3 text-4xl font-black tracking-tight text-gray-900 dark:text-white md:text-5xl">
          Leaderboard
        </h1>
        <p className="mx-auto max-w-xl text-lg font-medium text-gray-500 dark:text-gray-400">
          Descubre quiénes lideran el aprendizaje y únete a la competencia.
          ¡Sigue practicando para subir de nivel!
        </p>
      </div>

      {/* Filters Panel */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl backdrop-blur-md dark:border-gray-700/60 dark:bg-gray-800/90">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl" />

        <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              <HiGlobeAlt className="h-3 w-3" /> Idioma
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => {
                setSelectedLanguage(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-2xl border-gray-200 bg-gray-50 py-3 pl-4 pr-10 text-sm font-bold text-gray-900 transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
            >
              <option value="global">Clasificación Global</option>
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              <HiUserGroup className="h-3 w-3" /> Por página
            </label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full rounded-2xl border-gray-200 bg-gray-50 py-3 pl-4 pr-10 text-sm font-bold text-gray-900 transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
            >
              <option value={10}>10 usuarios</option>
              <option value={25}>25 usuarios</option>
              <option value={50}>50 usuarios</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              <HiSortDescending className="h-3 w-3" /> Ordenar por
            </label>
            <select
              value={orderBy}
              onChange={(e) => {
                setOrderBy(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-2xl border-gray-200 bg-gray-50 py-3 pl-4 pr-10 text-sm font-bold text-gray-900 transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
            >
              <option value="totalScore">Puntuación Total</option>
              <option value="firstName">Nombre</option>
              <option value="lastName">Apellido</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              <HiSortAscending className="h-3 w-3" /> Dirección
            </label>
            <select
              value={sortOrder}
              onChange={(e) => {
                setSortOrder(e.target.value as "ASC" | "DESC");
                setCurrentPage(1);
              }}
              className="w-full rounded-2xl border-gray-200 bg-gray-50 py-3 pl-4 pr-10 text-sm font-bold text-gray-900 transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
            >
              <option value="DESC">Descendente</option>
              <option value="ASC">Ascendente</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <Alert
          color="failure"
          className="mb-6 rounded-2xl border-red-500/20 bg-red-500/10 text-red-900 dark:text-red-200"
        >
          <HiStar className="mr-2 h-5 w-5" /> {error}
        </Alert>
      )}

      {/* Leaderboard Entries */}
      <div className="space-y-3">
        {leaderboardData.length === 0 && !loading && (
          <div className="rounded-3xl border border-gray-200 bg-white/40 p-12 text-center font-medium text-gray-500 dark:border-gray-700/60 dark:bg-gray-800/40 dark:text-gray-400">
            No se encontraron usuarios en esta clasificación.
          </div>
        )}

        {leaderboardData.map((entry, index) => {
          const rank = getRank(index);
          const isTop3 = rank <= 3;

          return (
            <div
              key={entry.userId}
              className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.01] ${
                isTop3
                  ? "border-indigo-500/30 bg-indigo-50/30 shadow-lg shadow-indigo-500/5 dark:bg-gray-800/60 dark:hover:bg-gray-800/80"
                  : "border-gray-100 bg-white dark:border-gray-700/50 dark:bg-gray-800/40 dark:hover:bg-gray-800/60"
              }`}
            >
              {/* Rank Column */}
              <div className="flex w-12 items-center justify-center">
                {rank === 1 && (
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                    <span className="text-lg">🥇</span>
                  </div>
                )}
                {rank === 2 && (
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-400 shadow-[0_0_15px_rgba(156,163,175,0.4)]">
                    <span className="text-lg">🥈</span>
                  </div>
                )}
                {rank === 3 && (
                  <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-800 shadow-[0_0_15px_rgba(146,64,14,0.4)]">
                    <span className="text-lg">🥉</span>
                  </div>
                )}
                {rank > 3 && (
                  <span className="text-lg font-black italic text-gray-300 transition-colors group-hover:text-gray-400 dark:text-gray-600">
                    #{rank}
                  </span>
                )}
              </div>

              {/* User Avatar */}
              <div className="relative h-12 w-12 shrink-0">
                <img
                  src={`${BACKEND_BASE_URL}/images/user/${encodeURIComponent(entry.userId)}?size=sm&v=${Date.now()}`}
                  alt={entry.firstName}
                  className={`h-full w-full rounded-2xl object-cover shadow-inner ring-2 ${
                    isTop3
                      ? "ring-indigo-500/50"
                      : "ring-gray-100 dark:ring-gray-700/40"
                  }`}
                  onError={(e) => {
                    e.currentTarget.src = "/user.svg";
                  }}
                />
                <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500 dark:border-gray-800" />
              </div>

              {/* User Info */}
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-black text-gray-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300">
                  {entry.firstName} {entry.lastName}
                </h3>
              </div>

              {/* Score Badge */}
              <div className="flex flex-col items-end gap-1 px-4">
                <span className="flex items-center gap-1.5 text-lg font-black text-indigo-600 dark:text-indigo-400">
                  {entry.totalScore.toLocaleString()}
                  <HiLightningBolt className="h-4 w-4 animate-pulse text-yellow-400" />
                </span>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-gray-400 dark:text-gray-500">
                  Puntos XP
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Section */}
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
                    icon: "h-5 w-5",
                  },
                  next: {
                    base: "rounded-r-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-50 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white",
                    icon: "h-5 w-5",
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
