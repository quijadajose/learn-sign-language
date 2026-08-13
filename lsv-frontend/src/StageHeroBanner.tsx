import { HiChevronDown, HiCheckCircle } from "react-icons/hi";
import { LessonScoreRing } from "./LessonScoreRing";
import type { StageProgress } from "./lessonListTypes";

interface StageHeroBannerProps {
  currentStage: StageProgress;
  progressPercent: number;
  completedCount: number;
  totalCount: number;
  allStages: StageProgress[];
  stageId?: string;
  showStageDropdown: boolean;
  onToggleDropdown: () => void;
  onChangeStage: (id: string) => void;
}

export function StageHeroBanner({
  currentStage,
  progressPercent,
  completedCount,
  totalCount,
  allStages,
  stageId,
  showStageDropdown,
  onToggleDropdown,
  onChangeStage,
}: StageHeroBannerProps) {
  return (
    <div
      className={`relative mb-8 rounded-3xl border border-gray-200 bg-white/70 p-8 shadow-2xl backdrop-blur-md dark:border-gray-700/60 dark:bg-gray-800/90 ${showStageDropdown ? "z-50" : "z-0"}`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 size-64 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 dark:from-indigo-900/10 dark:to-purple-900/10" />
      </div>

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
            Etapa actual
          </span>
          <h1 className="mb-2 text-3xl font-black leading-tight text-gray-900 dark:text-white md:text-4xl">
            {currentStage.name}
          </h1>
          <p className="max-w-2xl text-lg font-medium text-gray-600 dark:text-gray-300">
            {currentStage.description}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-6">
          <LessonScoreRing score={Math.round(progressPercent)} />
          <div className="text-right">
            <p className="text-4xl font-black leading-none text-gray-900 dark:text-white">
              {completedCount}
              <span className="text-xl font-normal text-gray-400">/{totalCount}</span>
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
              lecciones completadas
            </p>
          </div>
        </div>
      </div>

      <div className="relative mt-8">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.3)] transition-[width] duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {allStages.length > 1 && (
        <div className="relative mt-4 flex justify-end">
          <button
            onClick={onToggleDropdown}
            className="flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700/70 dark:text-gray-200 dark:hover:bg-gray-600/80"
          >
            Cambiar Sección
            <HiChevronDown
              className={`size-4 transition-transform ${showStageDropdown ? "rotate-180" : ""}`}
            />
          </button>
          {showStageDropdown && (
            <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-800">
              {allStages.map((stage) => {
                const hasLessons = parseInt(stage.totalLessons || "0", 10) > 0;
                const isCurrent = stage.id === stageId;
                const isDisabled = isCurrent || !hasLessons;

                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => {
                      if (!isDisabled) onChangeStage(stage.id);
                    }}
                    disabled={isDisabled}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                      isCurrent
                        ? "cursor-default bg-blue-50 dark:bg-blue-900/20"
                        : !hasLessons
                          ? "cursor-not-allowed opacity-60"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm font-semibold ${
                            isCurrent
                              ? "text-blue-600 dark:text-blue-400"
                              : !hasLessons
                                ? "text-gray-400 dark:text-gray-500"
                                : "text-gray-800 dark:text-white"
                          }`}
                        >
                          {stage.name}
                        </p>
                        {!hasLessons && (
                          <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-600 dark:bg-amber-500/15 dark:text-amber-400">
                            Próximamente
                          </span>
                        )}
                      </div>
                      <p className="line-clamp-1 text-xs text-gray-500 dark:text-gray-400">
                        {hasLessons
                          ? stage.description
                          : "Esta sección aún no tiene lecciones."}
                      </p>
                    </div>
                    {isCurrent && (
                      <HiCheckCircle className="size-4 shrink-0 text-blue-500" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
