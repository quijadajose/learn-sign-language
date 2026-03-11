import React, { useState, useEffect } from "react";
import { Table, Spinner, Alert, Pagination, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from "flowbite-react";
import { leaderboardApi, languageApi } from "./services/api";
import { BACKEND_BASE_URL } from "./config";

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
      if (import.meta.env.DEV) {
        console.error("Error fetching languages:", err);
      }
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleLanguageChange = (languageId: string) => {
    setSelectedLanguage(languageId);
    setCurrentPage(1);
  };

  const handleSortChange = (field: string) => {
    if (orderBy === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setOrderBy(field);
      setSortOrder("DESC");
    }
    setCurrentPage(1);
  };

  const getRank = (index: number) => {
    return (currentPage - 1) * pageSize + index + 1;
  };



  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500 tracking-tight dark:from-primary-400 dark:to-accent-400 animate-fade-in-up">
            🏆 Leaderboard
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 font-light max-w-2xl mx-auto animate-fade-in-up delay-100">
            Descubre quiénes lideran el aprendizaje y únete a la competencia.
          </p>
        </div>

        <div className="glass-panel p-6 mb-8 animate-fade-in-up delay-200">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="relative">
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Idioma
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full rounded-xl border-gray-200 bg-gray-50/50 backdrop-blur-sm px-4 py-3 text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800/50 dark:text-white transition-all hover:bg-white dark:hover:bg-gray-800"
              >
                <option value="global">🌍 Global</option>
                {languages.map((language) => (
                  <option key={language.id} value={language.id}>
                    {language.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Por página
              </label>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="w-full rounded-xl border-gray-200 bg-gray-50/50 backdrop-blur-sm px-4 py-3 text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800/50 dark:text-white transition-all hover:bg-white dark:hover:bg-gray-800"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Ordenar por
              </label>
              <select
                value={orderBy}
                onChange={(e) => setOrderBy(e.target.value)}
                className="w-full rounded-xl border-gray-200 bg-gray-50/50 backdrop-blur-sm px-4 py-3 text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800/50 dark:text-white transition-all hover:bg-white dark:hover:bg-gray-800"
              >
                <option value="totalScore">Puntuación Total</option>
                <option value="firstName">Nombre</option>
                <option value="lastName">Apellido</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Dirección
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "ASC" | "DESC")}
                className="w-full rounded-xl border-gray-200 bg-gray-50/50 backdrop-blur-sm px-4 py-3 text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-800/50 dark:text-white transition-all hover:bg-white dark:hover:bg-gray-800"
              >
                <option value="DESC">Descendente</option>
                <option value="ASC">Ascendente</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <Alert color="failure" className="mb-6 rounded-xl border-l-4 border-red-500 shadow-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-lg font-bold">Error</h3>
                <div className="text-sm opacity-90">{error}</div>
              </div>
            </div>
          </Alert>
        )}

        <div className="glass-panel overflow-hidden animate-fade-in-up delay-300">
          <Table hoverable theme={{ root: { shadow: "none" } }}>
            <TableHead className="bg-gray-50/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 uppercase text-xs tracking-wider">
              <TableHeadCell>Posición</TableHeadCell>
              <TableHeadCell
                className="cursor-pointer hover:text-primary-600 transition-colors py-4 font-bold"
                onClick={() => handleSortChange("firstName")}
              >
                <div className="flex items-center gap-1">
                  Nombre
                  {orderBy === "firstName" && (
                    <span className="text-primary-500">{sortOrder === "ASC" ? "↑" : "↓"}</span>
                  )}
                </div>
              </TableHeadCell>
              <TableHeadCell
                className="cursor-pointer hover:text-primary-600 transition-colors py-4 font-bold"
                onClick={() => handleSortChange("lastName")}
              >
                <div className="flex items-center gap-1">
                  Apellido
                  {orderBy === "lastName" && (
                    <span className="text-primary-500">{sortOrder === "ASC" ? "↑" : "↓"}</span>
                  )}
                </div>
              </TableHeadCell>
              <TableHeadCell
                className="cursor-pointer hover:text-primary-600 transition-colors py-4 font-bold"
                onClick={() => handleSortChange("totalScore")}
              >
                <div className="flex items-center gap-1">
                  XP
                  {orderBy === "totalScore" && (
                    <span className="text-primary-500">{sortOrder === "ASC" ? "↑" : "↓"}</span>
                  )}
                </div>
              </TableHeadCell>
            </TableHead>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-700">
              {leaderboardData.map((entry, index) => {
                const rank = getRank(index);
                const isTop3 = rank <= 3;

                return (
                  <TableRow
                    key={entry.userId}
                    className="bg-transparent hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors duration-200"
                  >
                    <TableCell className="whitespace-nowrap font-medium text-gray-900 dark:text-white py-4">
                      <div className="flex items-center gap-3">
                        {isTop3 ? (
                          <div className={`
                            flex items-center justify-center w-10 h-10 rounded-full text-xl shadow-sm
                            ${rank === 1 ? 'bg-yellow-100 text-yellow-600 ring-2 ring-yellow-400' : ''}
                            ${rank === 2 ? 'bg-gray-100 text-gray-500 ring-2 ring-gray-300' : ''}
                            ${rank === 3 ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-400' : ''}
                          `}>
                            {rank === 1 && '🥇'}
                            {rank === 2 && '🥈'}
                            {rank === 3 && '🥉'}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 font-bold text-sm">
                            #{rank}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-900 dark:text-white font-medium">
                      <div className="flex items-center gap-3">
                        <div className="relative group">
                          <img
                            src={`${BACKEND_BASE_URL}/images/user/${entry.userId}?size=sm&v=${Date.now()}`}
                            alt={`${entry.firstName} ${entry.lastName}`}
                            className={`h-10 w-10 rounded-full object-cover shadow-sm transition-transform group-hover:scale-110 ${isTop3 ? 'ring-2 ring-white dark:ring-gray-800' : ''}`}
                            onError={(e) => {
                              e.currentTarget.src = "/user.svg";
                            }}
                          />
                          {isTop3 && <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>}
                        </div>
                        <span className="text-base">{entry.firstName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-300">
                      {entry.lastName}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shadow-sm">
                        {entry.totalScore.toLocaleString()} XP
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {totalPages > 1 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando{" "}
                  <span className="font-medium">
                    {(currentPage - 1) * pageSize + 1}
                  </span>{" "}
                  a{" "}
                  <span className="font-medium">
                    {Math.min(currentPage * pageSize, totalEntries)}
                  </span>{" "}
                  de <span className="font-medium">{totalEntries}</span>{" "}
                  resultados
                </p>
              </div>
            </div>
            <div className="flex overflow-x-auto sm:justify-center">
              <Pagination
                layout="pagination"
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                previousLabel="Anterior"
                nextLabel="Siguiente"
                showIcons
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaderboardView;
