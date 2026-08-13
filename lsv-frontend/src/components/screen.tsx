import type { ReactNode } from "react";

import { LazyMotion, domAnimation, m } from "motion/react";

interface ScreenProps {
  progress: { total: number; current: number };
  children: ReactNode;
}

export default function Screen({ progress, children }: ScreenProps) {
  return (
    <LazyMotion features={domAnimation}>
      <div className="relative w-full bg-gray-50 dark:bg-gray-900">
        <Progress total={progress.total} current={progress.current} />
        <div>{children}</div>
      </div>
    </LazyMotion>
  );
}

interface ProgressProps {
  total: number;
  current: number;
}

function Progress({ total, current }: ProgressProps) {
  const ratio = total > 0 ? current / total : 0;

  return (
    <div className="absolute inset-x-0 top-0 h-1 bg-blue-500/50">
      <m.div
        className="h-full origin-left bg-blue-700"
        style={{ width: "100%" }}
        animate={{ scaleX: ratio }}
        initial={false}
      />
    </div>
  );
}
