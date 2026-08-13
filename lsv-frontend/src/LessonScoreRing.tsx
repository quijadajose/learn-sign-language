export function LessonScoreRing({ score }: { score: number }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score === 100
      ? "#22c55e"
      : score >= 80
        ? "#eab308"
        : score > 0
          ? "#3b82f6"
          : "#6b7280";

  return (
    <div className="relative flex size-14 items-center justify-center">
      <svg className="absolute -rotate-90" width="56" height="56">
        <circle
          cx="28"
          cy="28"
          r={radius}
          strokeWidth="4"
          stroke="currentColor"
          className="text-gray-200 dark:text-gray-700"
          fill="none"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          strokeWidth="4"
          stroke={color}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className="relative z-10 text-xs font-bold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}
