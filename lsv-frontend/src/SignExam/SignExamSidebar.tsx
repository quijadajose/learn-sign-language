import React from "react";
import { Button, Card } from "flowbite-react";
import { HiFastForward, HiSparkles } from "react-icons/hi";
import {
  MAX_DYNAMIC_EXAM_ATTEMPTS,
  type SignDetectionType,
  type UiCapturePhase,
} from "../utils/signDetection";

type SignExamSidebarProps = {
  signs: { id: string; name: string; detectionType?: SignDetectionType }[];
  currentIndex: number;
  capturePhase: UiCapturePhase;
  dynamicAttempt: number;
  loadedModelName: string;
  isSuccess: boolean;
  isFinished: boolean;
  isLoading: boolean;
  onSkip: () => void;
};

const SignExamSidebar: React.FC<SignExamSidebarProps> = ({
  signs,
  currentIndex,
  capturePhase,
  dynamicAttempt,
  loadedModelName,
  isSuccess,
  isFinished,
  isLoading,
  onSkip,
}) => {
  return (
    <div className="space-y-6">
      <Card className="border-none bg-white shadow-xl dark:bg-gray-800">
        <div className="mb-4 border-b pb-4 dark:border-gray-700">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Progreso
          </h3>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-4xl font-black text-primary-600">{currentIndex + 1}</span>
            <span className="text-xl font-bold text-gray-500 dark:text-gray-400">/ {signs.length}</span>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Realiza la seña para:</p>
          <div className="rounded-2xl bg-primary-50 p-6 text-center dark:bg-primary-900/20">
            <h2 className="text-5xl font-black text-primary-700 dark:text-primary-400">
              {signs[currentIndex]?.name || "..."}
            </h2>
          </div>

          <div className="mt-6 flex flex-col space-y-3">
            {(signs[currentIndex]?.detectionType ?? "static") === "dynamic" ? (
              <div className="rounded-xl border border-primary-100 bg-primary-50/80 p-3 text-xs dark:border-primary-800 dark:bg-primary-900/20">
                <p className="mb-2 font-bold uppercase tracking-wide text-primary-700 dark:text-primary-300">
                  Protocolo dinámico
                </p>
                <ol className="space-y-1 text-gray-600 dark:text-gray-300">
                  <li className={capturePhase === "arming" || capturePhase === "waiting" ? "font-bold text-primary-600" : ""}>
                    1. Manos en reposo
                  </li>
                  <li className={capturePhase === "collecting" ? "font-bold text-primary-600" : ""}>
                    2. Haz la seña
                  </li>
                  <li className={capturePhase === "closing" ? "font-bold text-primary-600" : ""}>
                    3. Vuelve a reposo
                  </li>
                </ol>
                <p className="mt-2 text-[10px] text-gray-600 dark:text-gray-400">
                  Intento {Math.min(dynamicAttempt + 1, MAX_DYNAMIC_EXAM_ATTEMPTS)}/
                  {MAX_DYNAMIC_EXAM_ATTEMPTS} (one-shot + 1 reintento)
                </p>
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                <HiSparkles className="mr-1 inline text-yellow-400" />
                Forma la seña completa, manténla firme 1–2 segundos y espera a que aparezca el análisis.
              </p>
            )}
            {loadedModelName && (
              <p className="text-[10px] text-gray-600 dark:text-gray-400">
                Modelo: <span className="font-medium">{loadedModelName}</span>
              </p>
            )}
            <Button
              color="light"
              size="sm"
              onClick={onSkip}
              disabled={isSuccess || isFinished || isLoading}
            >
              <HiFastForward className="mr-2 size-4" />
              Omitir esta seña
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SignExamSidebar;
