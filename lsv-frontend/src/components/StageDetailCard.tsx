import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { HiBookOpen, HiLightningBolt } from "react-icons/hi";

interface StageProgress {
  id: string;
  name: string;
  description: string;
  totalLessons: string;
  completedLessons: string;
  progress: string | null;
}

interface Props {
  stage: StageProgress;
}

function ProgressRing({ progress }: { progress: number }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      <svg className="absolute -rotate-90" width="64" height="64">
        <circle
          cx="32"
          cy="32"
          r={radius}
          strokeWidth="4"
          stroke="currentColor"
          className="text-gray-200 dark:text-gray-700/50"
          fill="none"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          strokeWidth="4"
          stroke="#818cf8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="relative z-10 text-center">
        <span className="text-sm font-black text-gray-900 dark:text-white">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

export default function StageDetailCard({ stage }: Props) {
  const navigate = useNavigate();
  const [selectedLanguageId] = useLocalStorage<string | null>(
    "selectedLanguageId",
    null,
  );
  const [selectedRegionId] = useLocalStorage<string | null>(
    "selectedRegionId",
    null,
  );
  const [, setPersistedStageId] = useLocalStorage<string | null>(
    `selectedStageId_${selectedLanguageId}`,
    null,
  );

  const handleViewLessons = () => {
    if (selectedLanguageId) {
      setPersistedStageId(stage.id);
    }
    navigate(`/lessons/stage/${stage.id}`, {
      state: {
        languageId: selectedLanguageId,
        regionId: selectedRegionId,
      },
    });
  };

  const progressPercent = parseFloat(stage.progress || "0");

  return (
    <div className="relative z-0 mb-10 overflow-hidden rounded-3xl border border-gray-200/50 bg-white/70 p-8 shadow-2xl backdrop-blur-md dark:border-gray-700/60 dark:bg-gray-800/90">
      {/* Visual Decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 dark:from-indigo-900/10 dark:to-purple-900/10" />
      </div>

      <div className="relative flex flex-col gap-8 md:flex-row md:items-center">
        {/* Progress Visual */}
        <div className="flex flex-shrink-0 items-center justify-center">
          <ProgressRing progress={progressPercent} />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            <span className="flex items-center gap-1 rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
              <HiLightningBolt className="h-3 w-3" />
              Continuar Aprendiendo
            </span>
          </div>
          <h2 className="mb-2 text-3xl font-black tracking-tight text-gray-900 dark:text-white md:text-4xl">
            {stage.name}
          </h2>
          <p className="max-w-2xl text-lg font-medium text-gray-600 dark:text-gray-300">
            {stage.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                Completado
              </span>
              <span className="text-xl font-black text-gray-900 dark:text-white">
                {stage.completedLessons}{" "}
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  /{stage.totalLessons} lecciones
                </span>
              </span>
            </div>

            <div className="hidden h-10 w-px bg-gray-200 dark:bg-gray-700 sm:block" />

            <div className="grow sm:max-w-xs">
              <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                <span>Progreso General</span>
                <span className="text-gray-900 dark:text-gray-300">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_10px_rgba(99,102,241,0.3)] transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-shrink-0 flex-col gap-3">
          <button
            onClick={handleViewLessons}
            className="group flex items-center justify-center gap-3 rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40 active:scale-[0.98]"
          >
            <HiBookOpen className="h-5 w-5 transition-transform group-hover:rotate-12" />
            Ver Lecciones
          </button>
        </div>
      </div>
    </div>
  );
}
