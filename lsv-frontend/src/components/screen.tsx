import type { ReactNode } from "react";

import { motion } from "framer-motion";

interface ScreenProps {
  progress: { total: number; current: number };
  children: ReactNode;
}

export default function Screen({ progress, children }: ScreenProps) {
  return (
    <div className="relative w-full bg-gray-50 dark:bg-gray-900">
      <Progress total={progress.total} current={progress.current} />
      <div>
        {children}
      </div>
    </div>
  );
}

interface ProgressProps {
  total: number;
  current: number;
}

function Progress({ total, current }: ProgressProps) {
  return (
    <div className="absolute inset-x-0 top-0 h-1 bg-blue-500/50">
      <motion.div
        className="h-full bg-blue-700"
        animate={{ width: `${(current / total) * 100}%` }}
        initial={false}
      />
    </div>
  );
}
