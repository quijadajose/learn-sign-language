import React, { useState, useEffect } from "react";
import { Card, Table, Spinner, Alert, Pagination } from "flowbite-react";
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
      console.error("Error fetching leaderboard:", err);
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

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-900 dark:text-white">
            🏆 Leaderboard
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Clasificación de los mejores estudiantes
          </p>
        </div>

        <Card className="mb-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Idioma
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Por página
              </label>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Ordenar por
              </label>
              <select
                value={orderBy}
                onChange={(e) => setOrderBy(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="totalScore">Puntuación Total</option>
                <option value="firstName">Nombre</option>
                <option value="lastName">Apellido</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Dirección
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "ASC" | "DESC")}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="DESC">Descendente</option>
                <option value="ASC">Ascendente</option>
              </select>
            </div>
          </div>
        </Card>

        {error && (
          <Alert color="failure" className="mb-6">
            <div>
              <h3 className="text-sm font-medium">
                Error al cargar el leaderboard
              </h3>
              <div className="mt-2 text-sm">{error}</div>
            </div>
          </Alert>
        )}

        <Card>
          <Table hoverable>
            <Table.Head>
              <Table.HeadCell>Posición</Table.HeadCell>
              <Table.HeadCell
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSortChange("firstName")}
              >
                Nombre{" "}
                {orderBy === "firstName" && (sortOrder === "ASC" ? "↑" : "↓")}
              </Table.HeadCell>
              <Table.HeadCell
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSortChange("lastName")}
              >
                Apellido{" "}
                {orderBy === "lastName" && (sortOrder === "ASC" ? "↑" : "↓")}
              </Table.HeadCell>
              <Table.HeadCell
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSortChange("totalScore")}
              >
                XP{" "}
                {orderBy === "totalScore" && (sortOrder === "ASC" ? "↑" : "↓")}
              </Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {leaderboardData.map((entry, index) => {
                const rank = getRank(index);
                const medal = getMedalEmoji(rank);

                return (
                  <Table.Row
                    key={entry.userId}
                    className="bg-white dark:border-gray-700 dark:bg-gray-800"
                  >
                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <span className="mr-2 text-lg">{medal}</span>
                        <span
                          className={`text-sm font-medium ${
                            rank <= 3
                              ? "font-bold text-yellow-600"
                              : "text-gray-900 dark:text-white"
                          }`}
                        >
                          #{rank}
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <img
                          src={`${BACKEND_BASE_URL}/images/user/${entry.userId}?size=sm&v=${Date.now()}`}
                          alt={`${entry.firstName} ${entry.lastName}`}
                          className="mr-3 h-8 w-8 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/user.svg";
                          }}
                        />
                        {entry.firstName}
                      </div>
                    </Table.Cell>
                    <Table.Cell className="text-gray-900 dark:text-white">
                      {entry.lastName}
                    </Table.Cell>
                    <Table.Cell>
                      <strong>{entry.totalScore} XP</strong>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table>
        </Card>
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
