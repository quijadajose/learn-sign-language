import React, { useState } from "react";
import { Spinner } from "flowbite-react";
import { HierarchyFilters } from "./HierarchyFilters";
import { SignChipsBar } from "./SignChipsBar";
import { TrainingPanel } from "./TrainingPanel";
import { ModelsPanel } from "./ModelsPanel";
import { RecorderPanel } from "./RecorderPanel";
import { SignStudioModals } from "./SignStudioModals";
import { useSignStudioData } from "./useSignStudioData";
import { useSignStudioCapture } from "./useSignStudioCapture";
import type { SignRecording, StudioModel } from "./types";

const SignStudio: React.FC = () => {
  const [dominantHand, setDominantHand] = useState<"right" | "left">("right");

  const data = useSignStudioData();
  const {
    languages,
    selectedLanguageId,
    setSelectedLanguageId,
    regions,
    selectedRegionId,
    setSelectedRegionId,
    stages,
    selectedStageId,
    setSelectedStageId,
    lessons,
    selectedLessonId,
    setSelectedLessonId,
    signs,
    globalSigns,
    selectedSignId,
    setSelectedSignId,
    searchTerm,
    setSearchTerm,
    signRecordings,
    selectedPlaybackRecording,
    setSelectedPlaybackRecording,
    showPlaybackModal,
    setShowPlaybackModal,
    isTraining,
    selectedTrainingSignIds,
    setSelectedTrainingSignIds,
    models,
    showAddModal,
    setShowAddModal,
    showTesterModal,
    setShowTesterModal,
    showLogsModal,
    setShowLogsModal,
    selectedLogsModel,
    setSelectedLogsModel,
    selectedTesterModel,
    setSelectedTesterModel,
    newSignName,
    setNewSignName,
    newSignDetectionType,
    setNewSignDetectionType,
    isNewSignGlobal,
    setIsNewSignGlobal,
    isCreatingSigns,
    showConfirmModal,
    setShowConfirmModal,
    confirmConfig,
    setConfirmConfig,
    fetchModels,
    fetchSigns,
    fetchSignRecordings,
    fetchGlobalSigns,
    handleAddSign,
    handleAddSignsBulk,
    handleDeleteSign,
    handleDeleteRecording,
    handleTriggerTraining,
    handleRenameSign,
    allSigns,
    filteredAndSortedSigns,
  } = data;

  const capture = useSignStudioCapture({
    selectedSignId,
    signs,
    globalSigns,
    selectedRegionId,
    dominantHand,
    models,
    selectedPlaybackRecording,
    fetchSigns,
    fetchSignRecordings,
    fetchGlobalSigns,
  });

  const {
    videoRef,
    canvasRef,
    isLoading,
    isRecording,
    setIsRecording,
    isReviewing,
    setIsReviewing,
    previewFrame,
    landmarksBuffer,
    setLandmarksBuffer,
    recordCapturePhase,
    setRecordCapturePhase,
    recordStableCount,
    recordCaptureCount,
    recordHandVisible,
    isSaving,
    isCameraActive,
    setIsCameraActive,
    sampleTestModelId,
    setSampleTestModelId,
    sampleTestResult,
    setSampleTestResult,
    sampleTestLoading,
    enterReviewMode,
    resetRecordingCapture,
    handleSave,
    handleTestRecordingWithModel,
  } = capture;

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <Spinner size="xl" aria-label="Cargando Sign Studio..." />
        <span aria-hidden="true" className="mt-4 text-lg font-medium">
          Cargando Sign Studio...
        </span>
      </div>
    );
  }

  const openPlayback = (rec: SignRecording) => {
    setSelectedPlaybackRecording(rec);
    setSampleTestResult(null);
    const firstReady = models.find((m: StudioModel) => m.status === "READY");
    if (firstReady) setSampleTestModelId(firstReady.id);
    setShowPlaybackModal(true);
  };

  const toggleTrainingSign = (id: string) => {
    setSelectedTrainingSignIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return [...next];
    });
  };

  return (
    <div className="container mx-auto max-w-7xl p-4">
      <HierarchyFilters
        languages={languages}
        selectedLanguageId={selectedLanguageId}
        onLanguageChange={(id) => {
          setSelectedLanguageId(id);
          setSelectedRegionId("");
          setSelectedStageId("");
          setSelectedLessonId("");
          setSelectedSignId("");
        }}
        regions={regions}
        selectedRegionId={selectedRegionId}
        onRegionChange={(id) => {
          setSelectedRegionId(id);
          setSelectedStageId("");
          setSelectedLessonId("");
          setSelectedSignId("");
        }}
        stages={stages}
        selectedStageId={selectedStageId}
        onStageChange={(id) => {
          setSelectedStageId(id);
          setSelectedLessonId("");
          setSelectedSignId("");
        }}
        lessons={lessons}
        selectedLessonId={selectedLessonId}
        onLessonChange={(id) => {
          setSelectedLessonId(id);
          setSelectedSignId("");
        }}
        onAddSign={() => setShowAddModal(true)}
      />

      <SignChipsBar
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        signs={filteredAndSortedSigns}
        selectedSignId={selectedSignId}
        onSelectSign={setSelectedSignId}
        selectedTrainingSignIds={selectedTrainingSignIds}
        onToggleTrainingSign={toggleTrainingSign}
        onRenameSign={handleRenameSign}
        onDeleteSign={handleDeleteSign}
        selectedLessonId={selectedLessonId}
        onAddSign={() => setShowAddModal(true)}
      />

      <RecorderPanel
        selectedSignId={selectedSignId}
        allSigns={allSigns}
        signs={signs}
        globalSigns={globalSigns}
        dominantHand={dominantHand}
        onDominantHandChange={setDominantHand}
        isCameraActive={isCameraActive}
        onIsCameraActiveChange={setIsCameraActive}
        isRecording={isRecording}
        onIsRecordingChange={setIsRecording}
        isReviewing={isReviewing}
        onIsReviewingChange={setIsReviewing}
        previewFrame={previewFrame}
        landmarksBuffer={landmarksBuffer}
        onLandmarksBufferChange={setLandmarksBuffer}
        recordCapturePhase={recordCapturePhase}
        onRecordCapturePhaseChange={setRecordCapturePhase}
        recordStableCount={recordStableCount}
        recordCaptureCount={recordCaptureCount}
        recordHandVisible={recordHandVisible}
        isSaving={isSaving}
        videoRef={videoRef}
        canvasRef={canvasRef}
        enterReviewMode={enterReviewMode}
        resetRecordingCapture={resetRecordingCapture}
        handleSave={handleSave}
        signRecordings={signRecordings}
        onOpenPlayback={openPlayback}
        onDeleteRecording={handleDeleteRecording}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <TrainingPanel
          hasSigns={filteredAndSortedSigns.length > 0}
          isTraining={isTraining}
          selectedTrainingSignIds={selectedTrainingSignIds}
          onClearTrainingSelection={() => setSelectedTrainingSignIds([])}
          onSelectAllForTraining={() =>
            setSelectedTrainingSignIds(
              filteredAndSortedSigns.map((s) => s.id),
            )
          }
          selectedLessonId={selectedLessonId}
          selectedStageId={selectedStageId}
          selectedLanguageId={selectedLanguageId}
          onTriggerTraining={handleTriggerTraining}
        />

        <ModelsPanel
          models={models}
          onFetchModels={fetchModels}
          onSetConfirmConfig={setConfirmConfig}
          onSetShowConfirmModal={setShowConfirmModal}
          onOpenTester={(m) => {
            setSelectedTesterModel(m);
            setShowTesterModal(true);
          }}
          onOpenLogs={(m) => {
            setSelectedLogsModel(m);
            setShowLogsModal(true);
          }}
        />
      </div>

      <SignStudioModals
        showPlaybackModal={showPlaybackModal}
        onClosePlaybackModal={() => setShowPlaybackModal(false)}
        selectedPlaybackRecording={selectedPlaybackRecording}
        models={models}
        sampleTestModelId={sampleTestModelId}
        onSampleTestModelIdChange={setSampleTestModelId}
        sampleTestLoading={sampleTestLoading}
        sampleTestResult={sampleTestResult}
        onTestRecordingWithModel={handleTestRecordingWithModel}
        onDeleteRecording={handleDeleteRecording}
        showAddModal={showAddModal}
        onCloseAddModal={() => setShowAddModal(false)}
        newSignName={newSignName}
        onNewSignNameChange={setNewSignName}
        newSignDetectionType={newSignDetectionType}
        onNewSignDetectionTypeChange={setNewSignDetectionType}
        isNewSignGlobal={isNewSignGlobal}
        onIsNewSignGlobalChange={setIsNewSignGlobal}
        onAddSign={handleAddSign}
        onAddSignsBulk={handleAddSignsBulk}
        isCreatingSigns={isCreatingSigns}
        hasLessonSelected={Boolean(selectedLessonId)}
        showConfirmModal={showConfirmModal}
        onCloseConfirmModal={() => setShowConfirmModal(false)}
        confirmConfig={confirmConfig}
        showTesterModal={showTesterModal}
        onCloseTesterModal={() => setShowTesterModal(false)}
        selectedTesterModel={selectedTesterModel}
        showLogsModal={showLogsModal}
        onCloseLogsModal={() => setShowLogsModal(false)}
        selectedLogsModel={selectedLogsModel}
      />

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
};

export default SignStudio;
