import {
  HiGlobeAlt,
  HiSortAscending,
  HiSortDescending,
  HiUserGroup,
} from "react-icons/hi";

interface Language {
  id: string;
  name: string;
}

interface LeaderboardFiltersPanelProps {
  languages: Language[];
  selectedLanguage: string;
  pageSize: number;
  orderBy: string;
  sortOrder: "ASC" | "DESC";
  onLanguageChange: (value: string) => void;
  onPageSizeChange: (value: number) => void;
  onOrderByChange: (value: string) => void;
  onSortOrderChange: (value: "ASC" | "DESC") => void;
}

export function LeaderboardFiltersPanel({
  languages,
  selectedLanguage,
  pageSize,
  orderBy,
  sortOrder,
  onLanguageChange,
  onPageSizeChange,
  onOrderByChange,
  onSortOrderChange,
}: LeaderboardFiltersPanelProps) {
  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl backdrop-blur-md dark:border-gray-700/60 dark:bg-gray-800/90">
      <div className="absolute -right-20 -top-20 size-64 rounded-full bg-indigo-500/5 blur-3xl" />

      <div className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <label
            htmlFor="leaderboard-language"
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300"
          >
            <HiGlobeAlt className="size-3" /> Idioma
          </label>
          <select
            id="leaderboard-language"
            value={selectedLanguage}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="w-full rounded-2xl border-gray-200 bg-gray-50 py-3 pl-4 pr-10 text-sm font-bold text-gray-900 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
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
          <label
            htmlFor="leaderboard-page-size"
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300"
          >
            <HiUserGroup className="size-3" /> Por página
          </label>
          <select
            id="leaderboard-page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="w-full rounded-2xl border-gray-200 bg-gray-50 py-3 pl-4 pr-10 text-sm font-bold text-gray-900 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
          >
            <option value={10}>10 usuarios</option>
            <option value={25}>25 usuarios</option>
            <option value={50}>50 usuarios</option>
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="leaderboard-order-by"
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300"
          >
            <HiSortDescending className="size-3" /> Ordenar por
          </label>
          <select
            id="leaderboard-order-by"
            value={orderBy}
            onChange={(e) => onOrderByChange(e.target.value)}
            className="w-full rounded-2xl border-gray-200 bg-gray-50 py-3 pl-4 pr-10 text-sm font-bold text-gray-900 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
          >
            <option value="totalScore">Puntuación Total</option>
            <option value="firstName">Nombre</option>
            <option value="lastName">Apellido</option>
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="leaderboard-sort-order"
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300"
          >
            <HiSortAscending className="size-3" /> Dirección
          </label>
          <select
            id="leaderboard-sort-order"
            value={sortOrder}
            onChange={(e) => onSortOrderChange(e.target.value as "ASC" | "DESC")}
            className="w-full rounded-2xl border-gray-200 bg-gray-50 py-3 pl-4 pr-10 text-sm font-bold text-gray-900 transition-colors focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
          >
            <option value="DESC">Descendente</option>
            <option value="ASC">Ascendente</option>
          </select>
        </div>
      </div>
    </div>
  );
}
