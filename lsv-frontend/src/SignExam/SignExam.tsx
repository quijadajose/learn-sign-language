import React from "react";
import { Button } from "flowbite-react";
import { HiArrowLeft } from "react-icons/hi";
import { LazyMotion, domAnimation } from "motion/react";
import { useTranslation } from "react-i18next";
import { CMS_CONTENT_LANG } from "../i18n";
import { useSignExam } from "./useSignExam";
import SignExamErrorView from "./SignExamErrorView";
import SignExamCameraView from "./SignExamCameraView";
import SignExamSidebar from "./SignExamSidebar";

const SignExam: React.FC = () => {
  const { t } = useTranslation("learn");
  const {
    videoRef,
    canvasRef,
    signs,
    currentIndex,
    lessonName,
    loadedModelName,
    bufferFill,
    capturePhase,
    stableFramesCount,
    gestureRetryHint,
    dynamicAttempt,
    gestureTooLongHint,
    prediction,
    modelGuess,
    recognitionProgress,
    isLoading,
    isSuccess,
    isFinished,
    allRecognized,
    error,
    isMediaPipeReady,
    minCaptureFrames,
    handleGoBack,
    handleSkip,
  } = useSignExam();

  if (error) {
    return <SignExamErrorView error={error} onGoBack={handleGoBack} />;
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="mx-auto min-h-screen max-w-7xl px-4 py-8">
        <div className="mb-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button color="gray" onClick={handleGoBack} className="w-fit">
            <HiArrowLeft className="mr-2 size-5" aria-hidden />
            {t("practice.exit")}
          </Button>
          <div className="min-w-0 text-center sm:flex-1">
            <h1
              lang={CMS_CONTENT_LANG}
              className="truncate text-2xl font-black text-gray-900 dark:text-white sm:text-3xl"
            >
              {lessonName}
            </h1>
            <p className="text-sm font-bold uppercase tracking-widest text-primary-600">
              {t("practice.interactive")}
            </p>
          </div>
          <div className="hidden w-24 sm:block" />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <SignExamCameraView
              videoRef={videoRef}
              canvasRef={canvasRef}
              isLoading={isLoading}
              isFinished={isFinished}
              isSuccess={isSuccess}
              isMediaPipeReady={isMediaPipeReady}
              allRecognized={allRecognized}
              signs={signs}
              currentIndex={currentIndex}
              prediction={prediction}
              modelGuess={modelGuess}
              capturePhase={capturePhase}
              bufferFill={bufferFill}
              stableFramesCount={stableFramesCount}
              gestureRetryHint={gestureRetryHint}
              gestureTooLongHint={gestureTooLongHint}
              dynamicAttempt={dynamicAttempt}
              recognitionProgress={recognitionProgress}
              minCaptureFrames={minCaptureFrames}
              onGoBack={handleGoBack}
            />
          </div>

          <SignExamSidebar
            signs={signs}
            currentIndex={currentIndex}
            capturePhase={capturePhase}
            dynamicAttempt={dynamicAttempt}
            loadedModelName={loadedModelName}
            isSuccess={isSuccess}
            isFinished={isFinished}
            isLoading={isLoading}
            onSkip={handleSkip}
          />
        </div>

        <style>{`
          .mirror { transform: scaleX(-1); }
        `}</style>
      </div>
    </LazyMotion>
  );
};

export default SignExam;
