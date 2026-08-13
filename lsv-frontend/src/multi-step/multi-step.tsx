import type { ReactNode } from "react";
import type { MotionProps } from "motion/react";
import type { Next, Back, GetState, SetState } from "@formity/react";

import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "motion/react";

import { MultiStepContext } from "./multi-step-context";
import type { MultiStepValue } from "./multi-step-value";

interface MultiStepProps<T extends Record<string, unknown>> {
  step: string;
  next: Next<T>;
  back: Back<T>;
  getState: GetState<T>;
  setState: SetState;
  children: ReactNode;
}

export function MultiStep<T extends Record<string, unknown>>({
  step,
  next,
  back,
  getState,
  setState,
  children,
}: MultiStepProps<T>) {
  const [animate, setAnimate] = useState<"next" | "back" | false>(false);

  const handleNext = useCallback<Next<T>>(
    (fields) => {
      setAnimate("next");
      setTimeout(() => next(fields), 0);
    },
    [next],
  );

  const handleBack = useCallback<Back<T>>(
    (fields) => {
      setAnimate("back");
      setTimeout(() => back(fields), 0);
    },
    [back],
  );

  const value = useMemo(
    () =>
      ({ next: handleNext, back: handleBack, getState, setState }) as MultiStepValue,
    [handleNext, handleBack, getState, setState],
  );

  return (
    <LazyMotion features={domAnimation}>
      <AnimatePresence
        mode="popLayout"
        initial={false}
        onExitComplete={() => setAnimate(false)}
      >
        <m.div
          key={step}
          inherit={Boolean(animate)}
          animate={{
            x: 0,
            opacity: 1,
            transition: { delay: 0.25, duration: 0.25 },
          }}
          {...motionProps(animate)}
          className="h-full"
        >
          <MultiStepContext.Provider value={value}>
            {children}
          </MultiStepContext.Provider>
        </m.div>
      </AnimatePresence>
    </LazyMotion>
  );
}

function motionProps(animate: "next" | "back" | false): MotionProps {
  switch (animate) {
    case "next":
      return {
        initial: { x: 100, opacity: 0 },
        exit: {
          x: -100,
          opacity: 0,
          transition: { delay: 0, duration: 0.25 },
        },
      };
    case "back":
      return {
        initial: { x: -100, opacity: 0 },
        exit: {
          x: 100,
          opacity: 0,
          transition: { delay: 0, duration: 0.25 },
        },
      };
    default:
      return {};
  }
}
