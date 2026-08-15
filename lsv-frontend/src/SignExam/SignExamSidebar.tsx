import React from "react";
import { Button, Card } from "flowbite-react";
import { HiFastForward, HiSparkles } from "react-icons/hi";
import { useTranslation } from "react-i18next";
import { CMS_CONTENT_LANG } from "../i18n";
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
  const { t } = useTranslation("learn");

  return (
    <div className="space-y-6">
      <Card className="border-none bg-white shadow-xl dark:bg-gray-800">
        <div className="mb-4 border-b pb-4 dark:border-gray-700">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
            {t("practice.progress")}
          </h3>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-4xl font-black text-primary-600">{currentIndex + 1}</span>
            <span className="text-xl font-bold text-gray-500 dark:text-gray-400">/ {signs.length}</span>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-base font-medium text-gray-600 dark:text-gray-300">
            {t("practice.performFor")}
          </p>
          <div className="rounded-2xl bg-primary-50 p-6 text-center dark:bg-primary-900/20">
            <h2
              lang={CMS_CONTENT_LANG}
              className="text-5xl font-black text-primary-700 dark:text-primary-400"
            >
              {signs[currentIndex]?.name || "..."}
            </h2>
          </div>

          <div className="mt-6 flex flex-col space-y-3">
            {(signs[currentIndex]?.detectionType ?? "static") === "dynamic" ? (
              <div className="rounded-xl border border-primary-100 bg-primary-50/80 p-3 text-sm dark:border-primary-800 dark:bg-primary-900/20">
                <p className="mb-2 font-bold uppercase tracking-wide text-primary-700 dark:text-primary-300">
                  {t("practice.dynamicProtocol")}
                </p>
                <ol className="space-y-1 text-gray-600 dark:text-gray-300">
                  <li className={capturePhase === "arming" || capturePhase === "waiting" ? "font-bold text-primary-600" : ""}>
                    1. {t("practice.restHands")}
                  </li>
                  <li className={capturePhase === "collecting" ? "font-bold text-primary-600" : ""}>
                    2. {t("practice.doSign")}
                  </li>
                  <li className={capturePhase === "closing" ? "font-bold text-primary-600" : ""}>
                    3. {t("practice.backToRest")}
                  </li>
                </ol>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {t("practice.attempt", {
                    current: Math.min(dynamicAttempt + 1, MAX_DYNAMIC_EXAM_ATTEMPTS),
                    total: MAX_DYNAMIC_EXAM_ATTEMPTS,
                  })}
                </p>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                <HiSparkles className="mr-1 inline text-yellow-400" aria-hidden />
                {t("practice.staticHint")}
              </p>
            )}
            {loadedModelName && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("practice.model", { name: loadedModelName })}
              </p>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("practice.keyboardHint")}
            </p>
            <Button
              color="light"
              size="sm"
              onClick={onSkip}
              disabled={isSuccess || isFinished || isLoading}
            >
              <HiFastForward className="mr-2 size-4" aria-hidden />
              {t("practice.skip")}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SignExamSidebar;
