import { Button, Spinner } from "flowbite-react";
import { HiVideoCamera, HiStop, HiTrash, HiCheckCircle } from "react-icons/hi";

interface RecorderCaptureActionsProps {
  isRecording: boolean;
  isReviewing: boolean;
  isSaving: boolean;
  isCameraActive: boolean;
  landmarksBufferLength: number;
  onEnterReviewMode: () => void;
  onSave: () => void;
  onDiscard: () => void;
  onStartCapture: () => void;
}

export function RecorderCaptureActions({
  isRecording,
  isReviewing,
  isSaving,
  isCameraActive,
  landmarksBufferLength,
  onEnterReviewMode,
  onSave,
  onDiscard,
  onStartCapture,
}: RecorderCaptureActionsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {isRecording ? (
        <Button color="dark" size="xl" onClick={onEnterReviewMode}>
          <HiStop className="mr-2 size-6" />
          Detener Captura
        </Button>
      ) : isReviewing ? (
        <>
          <Button
            color="success"
            size="xl"
            onClick={onSave}
            disabled={isSaving || landmarksBufferLength === 0}
          >
            {isSaving ? (
              <Spinner size="sm" className="mr-2" aria-hidden="true" />
            ) : (
              <HiCheckCircle className="mr-2 size-6" />
            )}
            Confirmar y Enviar
          </Button>
          <Button color="failure" size="xl" onClick={onDiscard} disabled={isSaving}>
            <HiTrash className="mr-2 size-6" />
            Descartar
          </Button>
        </>
      ) : (
        <Button color="blue" size="xl" onClick={onStartCapture} disabled={!isCameraActive}>
          <HiVideoCamera className="mr-2 size-6" />
          Empezar Nueva Captura
        </Button>
      )}
    </div>
  );
}
