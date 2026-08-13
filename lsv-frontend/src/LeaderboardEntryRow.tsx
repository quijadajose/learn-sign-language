import { HiLightningBolt } from "react-icons/hi";
import { BACKEND_BASE_URL } from "./config";

interface LeaderboardEntry {
  userId: string;
  firstName: string;
  lastName: string;
  totalScore: number;
}

interface LeaderboardEntryRowProps {
  entry: LeaderboardEntry;
  rank: number;
}

export function LeaderboardEntryRow({ entry, rank }: LeaderboardEntryRowProps) {
  const isTop3 = rank <= 3;

  return (
    <div
      className={`group relative flex items-center gap-4 overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.01] ${
        isTop3
          ? "border-indigo-500/30 bg-indigo-50/30 shadow-lg shadow-indigo-500/5 dark:bg-gray-800/60 dark:hover:bg-gray-800/80"
          : "border-gray-100 bg-white dark:border-gray-700/50 dark:bg-gray-800/40 dark:hover:bg-gray-800/60"
      }`}
    >
      <div className="flex w-12 items-center justify-center">
        {rank === 1 && (
          <div className="relative flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-[0_0_15px_rgba(234,179,8,0.4)]">
            <span className="text-lg">🥇</span>
          </div>
        )}
        {rank === 2 && (
          <div className="relative flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-200 to-gray-400 shadow-[0_0_15px_rgba(156,163,175,0.4)]">
            <span className="text-lg">🥈</span>
          </div>
        )}
        {rank === 3 && (
          <div className="relative flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-800 shadow-[0_0_15px_rgba(146,64,14,0.4)]">
            <span className="text-lg">🥉</span>
          </div>
        )}
        {rank > 3 && (
          <span className="text-lg font-black italic text-gray-500 transition-colors group-hover:text-gray-600 dark:text-gray-400">
            #{rank}
          </span>
        )}
      </div>

      <div className="relative size-12 shrink-0">
        <img
          src={`${BACKEND_BASE_URL}/images/user/${encodeURIComponent(entry.userId)}?size=sm&v=${Date.now()}`}
          alt={entry.firstName}
          className={`size-full rounded-2xl object-cover shadow-inner ring-2 ${
            isTop3 ? "ring-indigo-500/50" : "ring-gray-100 dark:ring-gray-700/40"
          }`}
          onError={(e) => {
            e.currentTarget.src = "/user.svg";
          }}
        />
        <div className="absolute -bottom-1 -right-1 size-3.5 rounded-full border-2 border-white bg-green-500 dark:border-gray-800" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-base font-black text-gray-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-300">
          {entry.firstName} {entry.lastName}
        </h3>
      </div>

      <div className="flex flex-col items-end gap-1 px-4">
        <span className="flex items-center gap-1.5 text-lg font-black text-indigo-600 dark:text-indigo-400">
          {entry.totalScore.toLocaleString()}
          <HiLightningBolt className="size-4 animate-pulse text-yellow-400" />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-tighter text-gray-400 dark:text-gray-500">
          Puntos XP
        </span>
      </div>
    </div>
  );
}
