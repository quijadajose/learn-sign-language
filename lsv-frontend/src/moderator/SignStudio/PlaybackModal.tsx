import {
  Button, Spinner, Select, Label, Badge, Modal, ModalHeader, ModalBody, ModalFooter,
} from "flowbite-react";
import { HiVideoCamera, HiTrash } from "react-icons/hi";
import { recordingHandFrameRatio } from "../../utils/signDetection";
import { PlaybackCanvas } from "./LandmarkCanvases";
import type { SampleTestResult, SignRecording, StudioModel } from "./types";

export interface PlaybackModalProps {
  show: boolean;
  onClose: () => void;
  selectedPlaybackRecording: SignRecording | null;
  models: StudioModel[];
  sampleTestModelId: string;
  onSampleTestModelIdChange: (id: string) => void;
  sampleTestLoading: boolean;
  sampleTestResult: SampleTestResult | null;
  onTestRecordingWithModel: () => void;
  onDeleteRecording: (id: string) => void;
}

export function PlaybackModal(props: PlaybackModalProps) {
  const {
    show, onClose, selectedPlaybackRecording, models, sampleTestModelId,
    onSampleTestModelIdChange, sampleTestLoading, sampleTestResult,
    onTestRecordingWithModel, onDeleteRecording,
  } = props;
  return (
<Modal show={show} onClose={onClose} size="3xl">
        <ModalHeader>Reproducción de Seña</ModalHeader>
        <ModalBody>
          <div className="flex flex-col items-center">
            <div className="w-full overflow-hidden rounded-xl border-2 border-gray-800 bg-black shadow-2xl">
              {selectedPlaybackRecording && (
                <PlaybackCanvas
                  key={selectedPlaybackRecording.id}
                  recording={selectedPlaybackRecording}
                />
              )}
            </div>
            <div className="mt-6 flex w-full items-center justify-between rounded-lg bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-800/50">
              <div className="flex gap-4">
                <span className="flex items-center gap-1">
                  <HiVideoCamera /> Fecha:{" "}
                  {selectedPlaybackRecording &&
                    new Date(selectedPlaybackRecording.createdAt!).toLocaleString()}
                </span>
                <span className="flex items-center gap-1 font-bold text-blue-500">
                  #{selectedPlaybackRecording?.id.substring(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  color={
                    selectedPlaybackRecording &&
                    recordingHandFrameRatio(selectedPlaybackRecording.landmarks) > 0.5
                      ? "success"
                      : "failure"
                  }
                  size="sm"
                >
                  Manos:{" "}
                  {selectedPlaybackRecording
                    ? `${Math.round(recordingHandFrameRatio(selectedPlaybackRecording.landmarks) * 100)}%`
                    : "0%"}
                </Badge>
                <Badge color="info" size="sm">
                  {selectedPlaybackRecording?.landmarks?.length || 0} Frames
                </Badge>
              </div>
            </div>

            <div className="mt-6 w-full rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-gray-500">
                Diagnóstico con modelo
              </h4>
              <p className="mb-4 text-xs text-gray-500">
                Ejecuta esta muestra guardada contra un modelo entrenado. Si aquí también da 0%, el
                problema está en los datos de entrenamiento, no en tu cámara actual.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Label htmlFor="sampleTestModel">Modelo</Label>
                  <Select
                    id="sampleTestModel"
                    value={sampleTestModelId}
                    onChange={(e) => onSampleTestModelIdChange(e.target.value)}
                  >
                    <option value="">Seleccionar modelo...</option>
                    {models.flatMap((model) =>
                      model.status === "READY" ? (
                        <option key={model.id} value={model.id}>
                          {model.name} ({Math.round((model.accuracy || 0) * 100)}% acc)
                        </option>
                      ) : (
                        []
                      ),
                    )}
                  </Select>
                </div>
                <Button
                  color="blue"
                  onClick={onTestRecordingWithModel}
                  disabled={sampleTestLoading || !sampleTestModelId}
                >
                  {sampleTestLoading ? <Spinner size="sm" className="mr-2" aria-hidden="true" /> : null}
                  Probar muestra
                </Button>
              </div>

              {sampleTestResult && (
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div className="rounded-lg bg-white p-3 dark:bg-gray-900">
                    <p className="text-[10px] uppercase text-gray-400">Predicción</p>
                    <p className="text-xl font-black text-blue-600">{sampleTestResult.topLabel}</p>
                  </div>
                  <div className="rounded-lg bg-white p-3 dark:bg-gray-900">
                    <p className="text-[10px] uppercase text-gray-400">Confianza</p>
                    <p className="text-xl font-black">
                      {(sampleTestResult.topScore * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-3 dark:bg-gray-900">
                    <p className="text-[10px] uppercase text-gray-400">Seña esperada</p>
                    <p className="text-xl font-black">
                      {(sampleTestResult.targetScore * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-3 dark:bg-gray-900">
                    <p className="text-[10px] uppercase text-gray-400">Frames con manos</p>
                    <p
                      className={`text-xl font-black ${sampleTestResult.handRatio > 0.5 ? "text-green-600" : "text-red-500"}`}
                    >
                      {(sampleTestResult.handRatio * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex w-full justify-between">
            <Button
              color="failure"
              onClick={() =>
                selectedPlaybackRecording && onDeleteRecording(selectedPlaybackRecording.id)
              }
            >
              <HiTrash className="mr-2 size-5" /> Eliminar Grabación
            </Button>
            <Button color="gray" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </ModalFooter>
      </Modal>
  );
}
