import SignTesterModal from "./SignTesterModal";
import { PlaybackModal } from "./PlaybackModal";
import { AddSignModal } from "./AddSignModal";
import { ConfirmSignModal } from "./ConfirmSignModal";
import { TrainingLogsModal } from "./TrainingLogsModal";
import type { SignDetectionType } from "../../utils/signDetection";
import type { BulkSignDraft } from "./signCatalogPresets";
import type { ConfirmConfig, SampleTestResult, SignRecording, StudioModel } from "./types";

export interface SignStudioModalsProps {
  showPlaybackModal: boolean;
  onClosePlaybackModal: () => void;
  selectedPlaybackRecording: SignRecording | null;
  models: StudioModel[];
  sampleTestModelId: string;
  onSampleTestModelIdChange: (id: string) => void;
  sampleTestLoading: boolean;
  sampleTestResult: SampleTestResult | null;
  onTestRecordingWithModel: () => void;
  onDeleteRecording: (id: string) => void;
  showAddModal: boolean;
  onCloseAddModal: () => void;
  newSignName: string;
  onNewSignNameChange: (name: string) => void;
  newSignDetectionType: SignDetectionType;
  onNewSignDetectionTypeChange: (type: SignDetectionType) => void;
  isNewSignGlobal: boolean;
  onIsNewSignGlobalChange: (value: boolean) => void;
  onAddSign: () => void;
  onAddSignsBulk: (drafts: BulkSignDraft[]) => void;
  isCreatingSigns: boolean;
  hasLessonSelected: boolean;
  showConfirmModal: boolean;
  onCloseConfirmModal: () => void;
  confirmConfig: ConfirmConfig;
  showTesterModal: boolean;
  onCloseTesterModal: () => void;
  selectedTesterModel: StudioModel | null;
  showLogsModal: boolean;
  onCloseLogsModal: () => void;
  selectedLogsModel: StudioModel | null;
}

export function SignStudioModals(props: SignStudioModalsProps) {
  return (
    <>
      <PlaybackModal
        show={props.showPlaybackModal}
        onClose={props.onClosePlaybackModal}
        selectedPlaybackRecording={props.selectedPlaybackRecording}
        models={props.models}
        sampleTestModelId={props.sampleTestModelId}
        onSampleTestModelIdChange={props.onSampleTestModelIdChange}
        sampleTestLoading={props.sampleTestLoading}
        sampleTestResult={props.sampleTestResult}
        onTestRecordingWithModel={props.onTestRecordingWithModel}
        onDeleteRecording={props.onDeleteRecording}
      />
      <AddSignModal
        show={props.showAddModal}
        onClose={props.onCloseAddModal}
        newSignName={props.newSignName}
        onNewSignNameChange={props.onNewSignNameChange}
        newSignDetectionType={props.newSignDetectionType}
        onNewSignDetectionTypeChange={props.onNewSignDetectionTypeChange}
        isNewSignGlobal={props.isNewSignGlobal}
        onIsNewSignGlobalChange={props.onIsNewSignGlobalChange}
        onAddSign={props.onAddSign}
        onAddSignsBulk={props.onAddSignsBulk}
        isSubmitting={props.isCreatingSigns}
        hasLessonSelected={props.hasLessonSelected}
      />
      <ConfirmSignModal
        show={props.showConfirmModal}
        onClose={props.onCloseConfirmModal}
        confirmConfig={props.confirmConfig}
      />
      <SignTesterModal
        show={props.showTesterModal}
        onClose={props.onCloseTesterModal}
        model={props.selectedTesterModel as {
          id: string;
          name: string;
          modelJsonUrl: string;
          labels?: string[];
          featuresSchemaVersion?: string | null;
        } | null}
      />
      <TrainingLogsModal
        show={props.showLogsModal}
        onClose={props.onCloseLogsModal}
        selectedLogsModel={props.selectedLogsModel}
      />
    </>
  );
}
