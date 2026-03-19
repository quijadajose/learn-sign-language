import { HiArrowRight, HiCheckCircle, HiCollection } from "react-icons/hi";

interface StageProgress {
  id: string;
  name: string;
  description: string;
  totalLessons: string;
  completedLessons: string;
  progress: string | null;
}

interface Props {
  stages: StageProgress[];
  selectedStageId: string;
  onSelectStage: (stageId: string) => void;
}

function StageMiniCard({
  stage,
  onSelect,
}: {
  stage: StageProgress;
  onSelect: (id: string) => void;
}) {
  const progressPercent = parseFloat(stage.progress || "0");
  const isComplete = progressPercent === 100;

  return (
    <div
      onClick={() => onSelect(stage.id)}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-300 hover:border-indigo-500/50 hover:bg-gray-50 hover:shadow-xl hover:shadow-indigo-500/5 dark:border-gray-700/60 dark:bg-gray-800/40 dark:hover:bg-gray-800 dark:hover:shadow-indigo-500/10"
    >
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-indigo-500 transition-colors group-hover:bg-indigo-500 group-hover:text-white dark:bg-gray-700 dark:text-indigo-400">
          <HiCollection className="h-6 w-6" />
        </div>
        {isComplete && (
          <div className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-600 dark:bg-green-500/20 dark:text-green-400">
            <HiCheckCircle className="h-3 w-3" />
            COMPLETADO
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="mb-1 text-lg font-black text-gray-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400">
          {stage.name}
        </h4>
        <p className="mb-4 line-clamp-2 text-xs font-medium leading-relaxed text-gray-500 dark:text-gray-400">
          {stage.description}
        </p>
      </div>

      <div className="mt-auto border-t border-gray-100 pt-4 dark:border-gray-700/50">
        <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          <span>Progreso</span>
          <span className="text-gray-900 dark:text-gray-300">
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              isComplete
                ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"
                : "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-4 flex -translate-x-2 items-center gap-1 text-xs font-black text-indigo-500 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 dark:text-indigo-400">
          Seleccionar sección <HiArrowRight className="h-3 w-3" />
        </div>
      </div>
    </div>
  );
}

export default function StageSelector({
  stages,
  selectedStageId,
  onSelectStage,
}: Props) {
  const otherStages = stages.filter((s) => s.id !== selectedStageId);

  if (otherStages.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <div className="mb-6 flex items-center gap-3">
        <h3 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
          Otras Secciones
        </h3>
        <div className="h-px grow bg-gray-200 dark:bg-gray-700/50" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {otherStages.map((stage) => (
          <StageMiniCard
            key={stage.id}
            stage={stage}
            onSelect={onSelectStage}
          />
        ))}
      </div>
    </div>
  );
}
